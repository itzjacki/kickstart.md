import { multiselect, confirm, isCancel, cancel, note } from "@clack/prompts";
import { prompt } from "../prompt.ts";
import { ADDITIONAL_STEERING_MOCK } from "../mock.ts";

/**
 * Catalog of SITUATIONAL steering files — generated only when the repo actually
 * has the concern they address. These are deliberately NOT mandatory: steering
 * files load into context every turn, so each one must earn its place. The
 * mandatory set (`AGENTS.md`, `product.md`, `tech.md`) is handled in stage 4.
 *
 * `whenToInclude` is the research-backed criterion the agent uses to decide
 * whether a file fits; `hint` is the short, plain-language label shown to the
 * user in the confirmation UI.
 */
export const ADDITIONAL_STEERING_FILES = {
  "structure.md": {
    hint: "how the codebase is organized",
    whenToInclude:
      "Only when the repo's layout is genuinely non-obvious — e.g. a large or unusual monorepo, multiple apps/packages, or a non-standard directory scheme. Skip for small or conventional layouts: directory overviews do not help navigation and cost context every turn.",
  },
  "code-conventions.md": {
    hint: "non-obvious coding patterns to follow",
    whenToInclude:
      "Only when the analysis found consistent, non-obvious patterns across many files (naming, error handling, module structure) that a linter/formatter does NOT already enforce. Skip if conventions are just what tooling enforces — do not duplicate the linter.",
  },
  "api-standards.md": {
    hint: "API endpoint and request/response conventions",
    whenToInclude:
      "Only when the repo exposes an actual API surface (HTTP routes, OpenAPI/GraphQL schema, RPC definitions) with conventions worth stating. Skip if there is no API.",
  },
  "testing-standards.md": {
    hint: "how tests are organized and written",
    whenToInclude:
      "Only when a test suite exists with patterns worth stating (file organization, fixture/mock conventions, what is expected to be tested). Skip if there are no tests or the setup is trivial.",
  },
  "security.md": {
    hint: "security-sensitive handling (auth, secrets, PII)",
    whenToInclude:
      "Only for repos with genuinely security-sensitive concerns — authentication/authorization, handling of secrets, PII, payments, or a regulated domain — where non-obvious rules apply. Skip for ordinary repos.",
  },
  "domain-glossary.md": {
    hint: "domain-specific vocabulary and rules",
    whenToInclude:
      "Only for domain-heavy projects with specialized vocabulary or business rules (e.g. finance, healthcare, logistics, aviation) that materially affect how code should be written. Skip for general-purpose software.",
  },
  "deployment.md": {
    hint: "non-trivial build/deploy/infra the agent may touch",
    whenToInclude:
      "Only when there is non-trivial deployment or infrastructure (IaC, multi-step release, environment specifics) the agent might need to interact with. Skip if deploy is trivial or handled entirely outside the repo.",
  },
} as const;

export type AdditionalSteeringFile = keyof typeof ADDITIONAL_STEERING_FILES;

export const ADDITIONAL_STEERING_NAMES = Object.keys(
  ADDITIONAL_STEERING_FILES,
) as AdditionalSteeringFile[];

/** The agent's recommendation for a single candidate file. */
export interface SteeringRecommendation {
  recommended: boolean;
  /** Terse rationale: why it fits, or why it was skipped. */
  reason: string;
}

export type SteeringRecommendations = Record<
  AdditionalSteeringFile,
  SteeringRecommendation
>;

/** The user's confirmed selection, carrying the agent's reasons forward. */
export type AdditionalSteeringSelection = Record<
  AdditionalSteeringFile,
  SteeringRecommendation
>;

export interface RecommendArgs {
  analysis: string;
  answers: string;
}

const emptyRecommendations = (): SteeringRecommendations =>
  Object.fromEntries(
    ADDITIONAL_STEERING_NAMES.map((file) => [
      file,
      { recommended: false, reason: "" },
    ]),
  ) as SteeringRecommendations;

/**
 * Stage 5a (non-interactive): asks the agent which situational steering files
 * fit this repo, with a per-file reason. Safe to run inside a spinner.
 */
export const recommendAdditionalSteeringFiles = async ({
  analysis,
  answers,
}: RecommendArgs): Promise<SteeringRecommendations> => {
  const raw = await prompt({
    promptString: buildPrompt(analysis, answers),
    mockOutput: ADDITIONAL_STEERING_MOCK,
  });

  return parseRecommendations(raw);
};

const parseRecommendations = (raw: string): SteeringRecommendations => {
  const result = emptyRecommendations();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return result;
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<
      string,
      unknown
    >;

    for (const file of ADDITIONAL_STEERING_NAMES) {
      const entry = parsed[file];
      if (entry && typeof entry === "object") {
        const { recommended, reason } = entry as Record<string, unknown>;
        result[file] = {
          recommended: recommended === true,
          reason: typeof reason === "string" ? reason.trim() : "",
        };
      }
    }
  } catch {
    return emptyRecommendations();
  }

  return result;
};

/**
 * Stage 5b (interactive): shows the agent's recommendation with reasons and
 * lets the user adjust the selection. Must run outside a spinner.
 *
 * The selection → confirm pair runs in a loop: answering "no" at the
 * confirmation returns the user to the multiselect (keeping their current
 * choice) rather than aborting. Only an explicit cancel (Ctrl+C / Esc) aborts
 * the whole step and returns `null`.
 */
export const confirmAdditionalSteeringFiles = async (
  recommendations: SteeringRecommendations,
): Promise<AdditionalSteeringSelection | null> => {
  const recommended = ADDITIONAL_STEERING_NAMES.filter(
    (file) => recommendations[file].recommended,
  );

  // Surface the agent's reasoning so the user understands the recommendation.
  const summary = ADDITIONAL_STEERING_NAMES.map((file) => {
    const { recommended: rec, reason } = recommendations[file];
    const mark = rec ? "✓" : "·";
    return `${mark} ${file}${reason ? ` — ${reason}` : ""}`;
  }).join("\n");
  note(summary, "Suggested additional steering files");

  // Start from the agent's recommendation; after a "no" we re-seed the
  // multiselect with whatever the user had picked so they don't lose edits.
  let initialValues = recommended;

  while (true) {
    const picked = await multiselect<AdditionalSteeringFile>({
      message: "Select the additional steering files to generate:",
      options: ADDITIONAL_STEERING_NAMES.map((file) => ({
        value: file,
        label: file,
        hint: ADDITIONAL_STEERING_FILES[file].hint,
      })),
      initialValues,
      required: false,
    });

    if (isCancel(picked)) {
      cancel("Additional steering selection cancelled.");
      return null;
    }

    const chosen = new Set(picked);
    const proceed = await confirm({
      message:
        chosen.size > 0
          ? `Generate ${chosen.size} additional steering file(s): ${[...chosen].join(", ")}?`
          : "Proceed with no additional steering files?",
    });

    if (isCancel(proceed)) {
      cancel("Additional steering selection cancelled.");
      return null;
    }

    // A plain "no" means "let me change my selection": loop back to the
    // multiselect, pre-seeded with the choice the user just made.
    if (!proceed) {
      initialValues = [...chosen];
      continue;
    }

    // Rebuild the selection from the user's final choice, keeping the agent's
    // reason for files that remain selected.
    const result = {} as AdditionalSteeringSelection;
    for (const file of ADDITIONAL_STEERING_NAMES) {
      const isChosen = chosen.has(file);
      result[file] = {
        recommended: isChosen,
        reason: isChosen ? recommendations[file].reason : "",
      };
    }
    return result;
  }
};

const buildPrompt = (analysis: string, answers: string): string =>
  `
## Your task: recommend situational steering files

This is the additional-steering recommendation stage of kickstart.md. The
mandatory steering files (\`AGENTS.md\`, \`product.md\`, \`tech.md\`) are already
handled. Your job here is to decide which of a fixed set of SITUATIONAL steering
files this repo would genuinely benefit from. Do NOT generate any files — only
recommend. Output only the JSON described below.

### Guiding principle

Steering files load into the agent's context on every turn, so each one has a
permanent cost. Recommend a file ONLY when the repo actually has the concern it
addresses and the file would carry non-discoverable, non-duplicative value.
Default to NOT recommending when the signal is weak. A lean set beats a complete
one. Base your decision on the analysis (repo facts) and the user's answers
(intent/domain); never invent evidence.

### Candidate files and when to include each

${ADDITIONAL_STEERING_NAMES.map(
  (file) => `- \`${file}\`: ${ADDITIONAL_STEERING_FILES[file].whenToInclude}`,
).join("\n")}

### Output format

Return ONLY a JSON object keyed by the exact filenames above. For each, give a
boolean \`recommended\` and a terse \`reason\` (one clause: cite the evidence that
justifies including it, or why it is being skipped). Example shape:

${JSON.stringify(
  Object.fromEntries(
    ADDITIONAL_STEERING_NAMES.map((file) => [
      file,
      { recommended: false, reason: "<terse reason>" },
    ]),
  ),
  null,
  2,
)}

### Analysis artifact

${analysis.trim() || "(no analysis provided)"}

### User-answers artifact

${answers.trim() || "(no answers provided)"}
`.trim();
