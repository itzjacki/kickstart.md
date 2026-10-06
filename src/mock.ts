/**
 * Mock mode for local development and testing.
 *
 * When enabled, every LLM step (any call that goes through `prompt()` in
 * `src/prompt.ts`) is short-circuited to return a pre-made example instead of
 * invoking `kiro-cli`. This lets you exercise the full orchestrator flow — the
 * interactive prompts, the sequencing, the UX — instantly and for free, without
 * network calls or an installed/authenticated `kiro-cli`.
 *
 * Enable it with either:
 *   - the `--mock` (or `-m`) CLI flag, or
 *   - the `KICKSTART_MOCK` environment variable set to `true` (case-insensitive).
 *
 * All canned outputs live in this module (one place to browse them). Each step
 * imports its own fixture and passes it to `prompt({ ..., mockOutput })`, so the
 * fixture is linked to its call site at compile time while staying centralized
 * here. Fixtures are written to match the real output contract of their step
 * (e.g. the analysis fixture is dense Markdown; the questions fixture is the JSON
 * the step parses), so downstream stages behave realistically.
 *
 * Caveat: mock mode replaces only the agent's RETURN VALUE. Steps whose real
 * effect is a side effect performed by the agent (e.g. the mandatory-files step,
 * where the agent writes files to disk via the `write` tool) will NOT produce
 * those files in mock mode — the flow still runs, but no files are written.
 */

let forcedMock = false;

/** Force mock mode on (called by the CLI entry point when `--mock` is passed). */
export const enableMockMode = (): void => {
  forcedMock = true;
};

/** Whether mock mode is active (via `--mock` flag or `KICKSTART_MOCK` env var). */
export const isMockMode = (): boolean =>
  forcedMock || process.env.KICKSTART_MOCK?.toLowerCase() === "true";

// --- Fixtures -------------------------------------------------------------
// Each constant is the canned output for one LLM step. Imported by that step
// and passed through `prompt({ mockOutput })`.

/** Fixture for the codebase-analysis step (dense analysis Markdown). */
export const CODEBASE_ANALYSIS_MOCK = `
## languages_and_runtimes
lang: TypeScript (package.json)
runtime: Node >=24 (package.json engines)
module: ESM ("type":"module")

## frameworks_and_libraries
cli_ux: @clack/prompts (package.json)

## commands
typecheck: npx tsc --noEmit (AGENTS.md)
build: unknown (no build script)
test: unknown (no test runner configured)
lint: unknown
format: unknown

## directory_structure
src/: orchestrator source
src/steps/: per-stage logic
templates/: bundled skill/agent templates

## existing_docs_and_ai_tooling
AGENTS.md: present (repo root)
README.md: present
.kiro/: present (skills: skill-creator)
legacy_prompt: kickstart.md (root)

## conventions
style: ESM imports with .ts extensions (consistent across src)
exactOptionalPropertyTypes: true (tsconfig)

## api_surface
none

## testing
unknown (no test suite yet)

## infrastructure_and_deployment
none

## version_control_signals
unknown

## sensitive_areas
root README.md/index.html/styles.css: human-only (AGENTS.md)

## product_signals
product_purpose: meta-toolkit that bootstraps AI steering docs/tooling in a target repo (AGENTS.md/README.md)
target_users: developers setting up repos for agentic AI tools
`.trim();

/** Fixture for the ask-questions step (the JSON the step parses). */
export const ASK_QUESTIONS_MOCK = JSON.stringify(
  {
    questions: [
      {
        id: "product-purpose",
        question:
          "In one or two sentences, what does this project do and who is it for?",
        why: "product_purpose only weakly evidenced",
      },
      {
        id: "technical-direction",
        question:
          "Is there a particular way you want new code written going forward — a direction you're moving toward, even if the current code is mixed?",
        why: "north star cannot be inferred from code",
      },
      {
        id: "off-limits",
        question:
          "Are there any files, folders, or actions an assistant should never change without checking with you first?",
        why: "mandatory off-limits question",
      },
    ],
  },
  null,
  2,
);

/** Fixture for the skill-selection step (the JSON the step parses). */
export const SELECT_SKILLS_MOCK = JSON.stringify(
  {
    "skill-creator": {
      recommended: true,
      reason: "meta-toolkit that authors skills — skill creation is core work",
    },
    "grill-me": {
      recommended: true,
      reason: "no evidence of plan/design stress-testing need",
    },
    "find-skills": {
      recommended: true,
      reason: "skill discovery not a stated need",
    },
    prototype: {
      recommended: true,
      reason: "no throwaway-prototype workflow signalled",
    },
    "improve-codebase-architecture": {
      recommended: true,
      reason: "growing TS CLI benefits from architecture review",
    },
    brainstorming: {
      recommended: false,
      reason: "requirements already scoped",
    },
    "writing-plans": {
      recommended: false,
      reason: "no multi-step planning workflow signalled",
    },
    "domain-modeling": {
      recommended: false,
      reason: "domain is small and already modeled",
    },
    implement: {
      recommended: false,
      reason: "no formal plan-execution workflow in use",
    },
    tdd: {
      recommended: true,
      reason: "no test suite yet",
    },
    "agent-browser": {
      recommended: false,
      reason: "CLI tool, no web UI to drive",
    },
    "verification-before-completion": {
      recommended: true,
      reason: "typecheck-before-done discipline fits this repo",
    },
    "systematic-debugging": {
      recommended: false,
      reason: "no recurring debugging pain signalled",
    },
    "diagnosing-bugs": {
      recommended: false,
      reason: "no recurring debugging pain signalled",
    },
    "code-review": {
      recommended: false,
      reason: "small team/scope; not a stated need",
    },
    "setup-pre-commit": {
      recommended: false,
      reason: "no pre-commit tooling in repo",
    },
    "git-guardrails-claude-code": {
      recommended: false,
      reason: "Git guardrails already covered in AGENTS.md",
    },
    "resolving-merge-conflicts": {
      recommended: false,
      reason: "no evidence of frequent merge conflicts",
    },
    "frontend-design": {
      recommended: false,
      reason: "no frontend surface",
    },
    "web-design-guidelines": {
      recommended: true,
      reason: "no frontend surface",
    },
    "vercel-react-best-practices": {
      recommended: false,
      reason: "not a React project",
    },
    "vercel-composition-patterns": {
      recommended: false,
      reason: "not a React project",
    },
    "subagent-driven-development": {
      recommended: false,
      reason: "single-agent flow; no subagent split signalled",
    },
    "prisma-database-setup": {
      recommended: false,
      reason: "no database",
    },
    supabase: {
      recommended: false,
      reason: "no Supabase backend",
    },
  },
  null,
  2,
);

/** Fixture for the mandatory-files step (per-file confirmation lines). */
export const GENERATE_MANDATORY_FILES_MOCK = [
  "Wrote AGENTS.md",
  "Wrote .kiro/steering/product.md",
  "Wrote .kiro/steering/tech.md",
  "(mock mode: no files were actually written)",
].join("\n");

/** Fixture for the additional-steering recommendation step (the JSON parsed). */
export const ADDITIONAL_STEERING_MOCK = JSON.stringify(
  {
    "structure.md": {
      recommended: false,
      reason: "small, conventional src/ layout — self-evident",
    },
    "code-conventions.md": {
      recommended: false,
      reason: "conventions mostly enforced by tsc/prettier; nothing non-obvious",
    },
    "api-standards.md": {
      recommended: false,
      reason: "no API surface (CLI tool)",
    },
    "testing-standards.md": {
      recommended: false,
      reason: "no test suite yet",
    },
    "security.md": {
      recommended: false,
      reason: "no auth/PII/secrets handling",
    },
    "domain-glossary.md": {
      recommended: true,
      reason:
        "steering/skills/agent-config vocabulary is domain-specific and shapes how code is written",
    },
    "deployment.md": {
      recommended: false,
      reason: "no non-trivial deploy/infra in repo",
    },
  },
  null,
  2,
);
