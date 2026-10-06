import { prompt } from "../prompt.ts";
import { KICKSTART_VERSION } from "../version.ts";
import { GENERATE_MANDATORY_FILES_MOCK } from "../mock.ts";

export interface GenerateMandatoryFilesArgs {
  /** The dense analysis artifact produced by the analysis stage. */
  analysis: string;
  /** The user-answers artifact produced by the questions stage (may be empty). */
  answers: string;
}

/** The mandatory artifacts generated for every repo. */
export const MANDATORY_FILES = [
  "AGENTS.md",
  ".kiro/steering/product.md",
  ".kiro/steering/tech.md",
] as const;

/**
 * Mandatory steering-file generation stage.
 *
 * Generates the always-created artifacts — `AGENTS.md`, `product.md`, and
 * `tech.md` — from the analysis + answers artifacts and writes them to disk.
 *
 * `structure.md` is intentionally NOT generated here: research (ETH Zurich 2025;
 * GitHub's 2,500-repo analysis) found that directory/structure overviews in
 * always-loaded context do not help agents navigate and mostly add token cost.
 * It is handled as a situational file in the additional-steering stages, only
 * when a repo's layout is genuinely non-obvious.
 *
 * The agent is granted the `write` tool for this call so it can create the files
 * directly. Returns the agent's raw stdout (useful for logging/debugging).
 */
export const generateMandatoryFiles = async ({
  analysis,
  answers,
}: GenerateMandatoryFilesArgs): Promise<string> => {
  return prompt({
    promptString: buildPrompt(analysis, answers),
    optionalAllowedTools: ["write"],
    mockOutput: GENERATE_MANDATORY_FILES_MOCK,
  });
};

const buildPrompt = (analysis: string, answers: string): string =>
  `
## Your task: generate the mandatory steering files

This is the mandatory-generation stage of kickstart.md. Using the analysis and
user-answers artifacts below, generate exactly three files and WRITE them to disk
using the write tool, at these paths relative to the repository root:

1. \`AGENTS.md\`
2. \`.kiro/steering/product.md\`
3. \`.kiro/steering/tech.md\`

Create the \`.kiro/steering/\` directory as needed. Do NOT generate any other
files (no \`structure.md\`, no optional steering files, no skills) — those belong
to later stages. Write the files and then stop; output only a one-line
confirmation per file (no file contents echoed back, no commentary).

### Reconciling with existing files

If the user-answers artifact states a preference for how to handle pre-existing
AI setup (an existing \`AGENTS.md\`, \`.kiro/\` steering, or similar), honor it:

- "replace": overwrite the existing file(s) with the new content.
- "merge"/"combine": read the existing file first and fold its still-relevant
  content into the new file rather than discarding it.
- "keep"/"leave untouched" for a specific file: do NOT write that file; skip it
  and note it in your confirmation.

If the answers express no such preference, write the three files normally
(overwriting if they happen to exist).

### Guiding principle: lean beats comprehensive

These files are loaded into the agent's context on EVERY turn, so every line has
a permanent cost. Empirical research on agent context files is unambiguous:
bloated or auto-generated files that duplicate what the agent could discover
itself REDUCE task success and raise cost; lean files that capture only what the
agent cannot discover help. Optimize accordingly:

- Include only what an agent CANNOT easily discover by reading the repo: the WHY
  (intent/purpose) and the non-obvious HOW (exact commands, non-standard tooling).
- Do NOT restate what tools already enforce or what the code makes obvious. No
  code-style rules (linters/formatters own that; the agent copies existing
  patterns anyway). No exhaustive dependency dumps. No directory-tree listings.
- Prefer pointers over copies. Reference file paths rather than pasting code or
  config that will go stale.
- Never fabricate. If the analysis marks something \`unknown\` and the answers do
  not resolve it, omit it rather than guessing. An omitted line is better than a
  wrong one.
- Keep it tight. \`AGENTS.md\` should comfortably fit well under ~150 lines; the
  steering files should be similarly lean. Brevity means removing words and
  non-essential sections, never inventing content.

### Inputs

Use BOTH artifacts. The analysis is factual repo evidence (treat as ground truth
about the code). The answers are the user's authoritative statements about
product, domain, and constraints (treat as ground truth about intent, and as the
primary source for anything the analysis left \`unknown\`). Where they conflict on
intent/product, prefer the user's answers.

### File 1: AGENTS.md (repository root)

The highest-leverage file — always in context. Keep it short and specific. Use
this structure:

\`\`\`markdown
# AGENTS.md

<!-- kickstart version: ${KICKSTART_VERSION} -->

## Project overview

[2-3 sentences: what this is, what it does, who it's for. The WHY, not a feature
dump.]

## Commands

[The exact, runnable commands an agent needs. Put these early — they are the most
used lines in the file. Include flags, not just tool names. Only list commands
that actually exist in the repo. Example shape:]

- Build: \`<command>\`
- Test: \`<command>\`
- Lint: \`<command>\`
- Format: \`<command>\`
- Run (dev): \`<command>\`

[Omit any line whose command is unknown. Call out non-obvious tooling explicitly
(e.g. "uses \`uv\`, not \`pip\`"; "\`pnpm\`, not \`npm\`").]

## Working guidelines

[Only UNIVERSAL, project-specific, non-discoverable rules the agent should follow
every time. A handful at most. Skip anything a linter enforces or that applies
only to some tasks. Omit this section entirely if there is nothing non-obvious
and universal to say.]

## Boundaries

Use three tiers. Keep each concrete (name real paths/actions from the analysis
and answers). Omit a tier if genuinely empty, but "never commit secrets" and any
user-stated off-limits areas should almost always appear.

- Always: [safe actions the agent can take without asking]
- Ask first: [actions needing confirmation — e.g. schema/migration changes,
  adding dependencies, touching CI/CD]
- Never: [hard limits — e.g. commit secrets, edit generated output or vendored
  code, and any off-limits areas the user named]
\`\`\`

### File 2: .kiro/steering/product.md

The WHY and WHO — the one thing code cannot reveal. Source this primarily from
the user's answers. If the user did not provide product information and the
analysis has none, keep sections minimal and honest rather than inventing a
product story.

\`\`\`markdown
# Product

<!-- kickstart version: ${KICKSTART_VERSION} -->

## What this project is

[One paragraph: the project's purpose, in plain terms.]

## Target users

[Who uses this.]

## Key features

[Main capabilities — brief bullets, only those actually evidenced.]

## Business context

[Relevant constraints, goals, or domain rules the user stated. Omit if none.]
\`\`\`

### File 3: .kiro/steering/tech.md

The stack, the non-obvious HOW, and the project's technical direction. Complement
AGENTS.md rather than duplicating it: AGENTS.md holds the terse command
quick-reference; tech.md gives the fuller stack picture, any constraints, and the
intended direction. Do not re-list every command verbatim and do not dump the
full dependency manifest — name the frameworks/tools that actually shape how code
is written, with versions where known.

This is also the right place for higher-level signals about the KIND of code the
project wants to produce — architectural preferences and defaults that sit above
individual code conventions (e.g. a preferred rendering/data-fetching strategy, a
default to one architectural style over another, a direction on state management
or module boundaries). These are the project's "north star."

Critical: do NOT infer this direction from the existing code. A codebase is
usually a mix of legacy and modern patterns, and averaging over it produces a
muddled target that pulls new code toward the old. The intended direction is
precisely the thing code cannot reveal — it must come from the user's answers.
Only include a technical-direction point when the user's answers actually state
or clearly imply it; if the answers say nothing about direction, omit the section
entirely rather than reverse-engineering a north star from the repo.

\`\`\`markdown
# Technology Stack

<!-- kickstart version: ${KICKSTART_VERSION} -->

## Languages & runtimes

[Languages with versions/engine constraints, from the analysis.]

## Frameworks & key libraries

[The important, code-shaping ones — not an exhaustive list.]

## Technical direction

[Higher-level signals about the kind of code to write — architectural
preferences and defaults that go beyond per-line conventions. Source ONLY from
the user's answers, never inferred from existing code. State the intended north
star, not the current average. Omit this section entirely if the answers give no
direction.]

## Tooling

[Build/test/lint/format toolchain and any non-standard tools. Point to AGENTS.md
for the exact command strings rather than repeating them all.]

## Infrastructure

[Docker, cloud, CI/CD — only what is actually present and relevant. Omit if none.]

## Key constraints

[Version requirements, platform targets, compatibility notes. Omit if none.]
\`\`\`

### Analysis artifact

${analysis.trim() || "(no analysis provided)"}

### User-answers artifact

${answers.trim() || "(no answers provided)"}
`.trim();
