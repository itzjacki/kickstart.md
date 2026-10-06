import { multiselect, confirm, isCancel, cancel, note } from "@clack/prompts";
import { prompt } from "./prompt.ts";
import { SELECT_SKILLS_MOCK } from "./mock.ts";

export const SKILLS = {
  "skill-creator": {
    repository: "anthropics/skills",
    hint: "create and iterate on new skills",
  },
  "grill-me": {
    repository: "mattpocock/skills",
    hint: "stress-test plans and designs",
  },
  "find-skills": {
    repository: "vercel-labs/skills",
    hint: "discover and install new skills",
  },
  prototype: {
    repository: "emilkowalski/skills",
    hint: "build throwaway prototypes to explore designs",
  },
  "improve-codebase-architecture": {
    repository: "mattpocock/skills",
    hint: "find architecture improvement opportunities",
  },

  brainstorming: {
    repository: "obra/superpowers",
    hint: "explore requirements and solutions before implementation",
  },
  "writing-plans": {
    repository: "obra/superpowers",
    hint: "turn requirements into actionable implementation plans",
  },
  "domain-modeling": {
    repository: "mattpocock/skills",
    hint: "model the domain, entities, and relationships before coding",
  },
  implement: {
    repository: "mattpocock/skills",
    hint: "execute an implementation plan systematically",
  },

  tdd: {
    repository: "mattpocock/skills",
    hint: "develop features using behavior-focused test-driven development",
  },
  "agent-browser": {
    repository: "vercel-labs/agent-browser",
    hint: "test and interact with web applications through a browser",
  },
  "verification-before-completion": {
    repository: "obra/superpowers",
    hint: "verify implementation results before declaring work complete",
  },
  "systematic-debugging": {
    repository: "obra/superpowers",
    hint: "diagnose bugs methodically instead of guessing at fixes",
  },
  "diagnosing-bugs": {
    repository: "mattpocock/skills",
    hint: "investigate and isolate bugs using a structured workflow",
  },

  "code-review": {
    repository: "mattpocock/skills",
    hint: "review code for correctness, maintainability, and risks",
  },
  "setup-pre-commit": {
    repository: "mattpocock/skills",
    hint: "configure automated checks before commits",
  },
  "git-guardrails-claude-code": {
    repository: "mattpocock/skills",
    hint: "protect repositories from unsafe AI-driven Git operations",
  },

  "frontend-design": {
    repository: "anthropics/skills",
    hint: "build distinctive production-quality frontend interfaces",
  },
  "web-design-guidelines": {
    repository: "vercel-labs/agent-skills",
    hint: "apply practical web UI, accessibility, and interaction guidelines",
  },
  "vercel-react-best-practices": {
    repository: "vercel-labs/agent-skills",
    hint: "build performant and maintainable React applications",
  },
  "vercel-composition-patterns": {
    repository: "vercel-labs/agent-skills",
    hint: "design reusable and maintainable React component architectures",
  },

  "subagent-driven-development": {
    repository: "obra/superpowers",
    hint: "split implementation into focused tasks handled by specialized agents",
  },

  "prisma-database-setup": {
    repository: "prisma/skills",
    hint: "set up and work with Prisma databases and schemas",
  },
  supabase: {
    repository: "supabase/agent-skills",
    hint: "build applications with Supabase backend services",
  },
} as const;

export type Skill = keyof typeof SKILLS;

export type SkillSelection = Record<Skill, boolean>;

/** The agent's recommendation for a single skill. */
export interface SkillRecommendation {
  recommended: boolean;
  reason: string;
}

export type SkillRecommendations = Record<Skill, SkillRecommendation>;

export interface SelectSkillsArgs {
  projectContext: string;
  userInput: string;
}

export const SKILL_NAMES = Object.keys(SKILLS) as Skill[];

const emptyRecommendations = (): SkillRecommendations =>
  Object.fromEntries(
    SKILL_NAMES.map((skill) => [skill, { recommended: false, reason: "" }]),
  ) as SkillRecommendations;

/**
 * Ask the agent which skills fit this project (with a per-skill reason)
 */
export async function selectSkills({
  projectContext,
  userInput,
}: SelectSkillsArgs): Promise<SkillRecommendations> {
  const promptText = buildPrompt(projectContext, userInput);

  const raw = await prompt({
    promptString: promptText,
    mockOutput: SELECT_SKILLS_MOCK,
  });

  return parseRecommendations(raw);
}

const parseRecommendations = (raw: string): SkillRecommendations => {
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

    for (const skill of SKILL_NAMES) {
      const entry = parsed[skill];
      if (entry && typeof entry === "object") {
        const { recommended, reason } = entry as Record<string, unknown>;
        result[skill] = {
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

const buildPrompt = (projectContext: string, userInput: string): string => {
  const example = Object.fromEntries(
    SKILL_NAMES.map((skill) => [
      skill,
      { recommended: false, reason: "<terse reason>" },
    ]),
  );

  return `
## Your task: recommend skills for this project

Decide which of a fixed set of skills this project would genuinely benefit from.
Be conservative: only recommend a skill when it clearly fits. Default to NOT
recommending when the signal is weak. Base your decision on the project context
and the user's input; never invent evidence.

## Available skills
${SKILL_NAMES.map((skill) => `- \`${skill}\`: ${SKILLS[skill].hint}`).join("\n")}

## Project context
${projectContext.trim() || "(none provided)"}

## User input
${userInput.trim() || "(none provided)"}

## Output format
Return ONLY a JSON object keyed by the exact skill names above. For each, give a
boolean \`recommended\` and a terse \`reason\` (one clause: cite the evidence that
justifies recommending it, or why it is being skipped). Example shape:

${JSON.stringify(example, null, 2)}
`.trim();
};

export async function confirmSkillSelection(
  recommendations: SkillRecommendations,
): Promise<Skill[] | null> {
  const summary = SKILL_NAMES.map((skill) => {
    const { recommended, reason } = recommendations[skill];
    const mark = recommended ? "✓" : "·";
    return `${mark} ${skill}${reason ? ` — ${reason}` : ""}`;
  }).join("\n");
  note(summary, "Suggested skills");

  // Start from the agent's recommendation
  // After a "no" -> re-seed the multiselect with the user's current choice
  let initialValues = SKILL_NAMES.filter(
    (skill) => recommendations[skill].recommended,
  );

  while (true) {
    const picked = await multiselect<Skill>({
      message:
        "Select the skills to install (space to toggle, enter to continue):",
      options: SKILL_NAMES.map((skill) => ({
        value: skill,
        label: skill,
        hint: SKILLS[skill].hint,
      })),
      initialValues,
      required: false,
    });

    if (isCancel(picked)) {
      cancel("Skill selection cancelled.");
      return null;
    }

    const chosen = new Set(picked);
    // confirm before proceeding
    const proceed = await confirm({
      message:
        chosen.size > 0
          ? `Install ${chosen.size} skill(s): ${[...chosen].join(", ")}?`
          : "Proceed with no skills selected?",
    });

    if (isCancel(proceed)) {
      cancel("Skill selection cancelled.");
      return null;
    }

    // answer "no" -> loop back to the multiselect
    if (!proceed) {
      initialValues = [...chosen];
      continue;
    }

    return [...chosen];
  }
}

export function getSelectedSkills(selection: SkillSelection): Skill[] {
  return SKILL_NAMES.filter((skill) => selection[skill]);
}
