# AGENTS.md

## Project overview

kickstart.md is a meta-toolkit that bootstraps AI steering docs and tooling in a target repository.

It is being rewritten from a single-prompt tool into a **script-based orchestrator**: a TypeScript/Node CLI that drives the kickstart process by making multiple, scoped calls to `kiro-cli` instead of handing the agent one large prompt to execute end-to-end. This gives the tool explicit control over each step (analysis, generation, selection, verification), lets it interleave deterministic logic and user prompts (via `@clack/prompts`) between agent calls, and makes the process more predictable and debuggable.

This repo contains:

- `src/` — the TypeScript CLI (the orchestrator)
  - `src/index.ts` — CLI entry point (bin: `kickstart.md`); drives the interactive flow
  - `src/prompt.ts` — thin wrapper around `kiro-cli chat --non-interactive` used to invoke the agent for individual steps
- `kickstart.md` — the legacy entry-point prompt (being superseded by the script; retained during the transition)
- `templates/` — bundled skill/agent templates and their catalogs
- `TODO.md` — project roadmap and checklist
- `.kiro/` — this repo's own steering/skills

Toolchain: TypeScript (ESM, `"type": "module"`, Node ≥24), `@clack/prompts` for interactive CLI UX. Typecheck with `npx tsc --noEmit`.

## Pipeline stages

The orchestrator runs the kickstart process as an ordered pipeline. Each stage is a discrete step; stages that need the agent make their own scoped `kiro-cli` call via `src/prompt.ts`. Text/data artifacts produced by earlier stages are passed into later ones.

1. **Introduction** — tell the user what the script is about to do (no agent call; `@clack/prompts` intro).
2. **Analyze codebase** — agent analyzes the repo and produces a dense, agent-oriented descriptive text artifact consumed by later stages. _(implemented: `src/steps/codebase-analysis.ts`)_
3. **Ask questions** — using gaps/`unknown`s from the analysis, ask the user plain-language questions to fill in what the code can't reveal (notably product/domain). The agent actively decides which questions to ask (the suggested list is non-exhaustive and non-mandatory, except the off-limits question and any product/domain gap-fillers); questions are asked one at a time via `@clack/prompts`. Produces a second text artifact used later. _(implemented: `src/steps/ask-questions.ts`)_
4. **Generate mandatory steering files** — generate the always-created artifacts (`AGENTS.md`, `.kiro/steering/product.md`, `tech.md`) from the analysis + answers. `structure.md` is NOT mandatory (it's situational — see Key decisions). _(implemented: `src/steps/generate-mandatory-files.ts`)_
5. **Recommend additional steering files** — agent analyzes which optional/situational steering files the repo would benefit from (from a fixed candidate catalog with research-backed when-to-include criteria), returns a per-file recommendation + reason, and lets the user confirm/adjust via a multiselect. `structure.md` is one of the candidates here (not mandatory). _(implemented: `src/steps/additional-steering.ts`)_
6. **Generate additional steering files** — generate the confirmed optional steering files (if any).
7. **Recommend skills** — agent selects which skills from the predefined catalog fit the repo, presents a recommendation, and lets the user adjust. _(selection implemented: `src/skills.ts`)_
8. **Install selected skills** — install the chosen skills (likely via `npx skills`).
9. **Recommend MCP servers** — agent determines which MCP servers may be relevant, looks them up online for details, presents a recommendation, and lets the user adjust.
10. **Add selected MCP servers** — add the chosen MCP servers (as disabled suggestions in agent config per the MCP decision below).
11. **Summarize** — summarize everything that was created/installed (no agent call; `@clack/prompts` outro).

Stage status is tracked in `TODO.md`.

## Key decisions

- Architecture: the tool is a **script-based orchestrator** (TypeScript/Node CLI), not a single hand-off prompt. The script makes multiple scoped `kiro-cli chat` calls — one per logical step — so the tool controls sequencing, can run deterministic logic and user prompts between agent calls, and is easier to debug than a monolithic prompt. The legacy `kickstart.md` prompt is retained during the transition and will be superseded.
- Agent invocation goes through a single wrapper (`src/prompt.ts`) around `kiro-cli chat --non-interactive`, using `execFile` (argv array, no shell) to avoid injection/quoting issues. The wrapper is the one place where kiro-cli flags (e.g. `--trust-tools`) are mapped. The assembled prompt (`src/assemble-prompt.ts`) also tells the agent upfront exactly which tools are available for the call (by name), so it doesn't waste turns probing or attempting tools that aren't trusted — an untrusted tool call in `--no-interactive` mode would hang the session.
- No custom agent config files are placed in the user's repo or global `~/.kiro`. `kiro-cli --agent` only resolves agents discoverable from the cwd (the user's repo) or `~/.kiro/agents`, and writing files into either location is intrusive and violates the friction-free principle. Consequence: command-level shell fencing (which requires an agent config's `toolsSettings.shell`) is not available, so agent calls are scoped with `--trust-tools` at tool granularity only. `shell` is not granted by default; stages rely on the read-only structured tools (`read`, `grep`, `glob`, `code`). The known gap is git history (`git log`/`blame`/`diff`), which has no structured-tool equivalent — revisit non-intrusively if a stage genuinely needs it.
- The entry-point prompt lives in `kickstart.md` at the root
- `README.md` is for humans on GitHub; `AGENTS.md` (this file) is for AI working on this repo; `kickstart.md` is for AI working on other repos
- Scope is limited to what an AI agent needs to work effectively: project context, environment/tooling, observed conventions, agent constraints
- Out of scope: tone, workflow preferences, prescriptive style guides
- Conventions in target repos are documented as observed facts, not prescriptions
- Target tool is Kiro only (for now). Generate the full Kiro-native structure: `AGENTS.md` + `.kiro/` directory (steering, skills). No layered/portable approach — just fire-and-forget, all-in.
- Friction-free: running kickstart in a repo should require zero setup or decisions from the user.
- Interaction model: lean autonomous, but ask the user when input is genuinely needed. Questions must be plain-language and understandable to people with no knowledge of AI tooling or steering docs.
- Installer-style UX: announce what will be generated upfront, show progress as each step completes, and summarize what was created at the end.
- Versioning: use simple incrementing versions (v1, v2, v3). Target repos record which version was used. A `CHANGELOG.md` in this repo tracks what changed between versions in LLM-actionable format.
- The kickstart prompt stamps its version into generated artifacts
- Updating a target repo is a separate skill (not part of `kickstart.md`). The update skill reads the target's current version, diffs against the changelog, and applies relevant changes.
- Prefer a lean setup over a bloated one. Generate only what's genuinely useful — don't produce artifacts for the sake of completeness.
- Mandatory steering files (generated for every repo): `AGENTS.md`, `.kiro/steering/product.md`, `.kiro/steering/tech.md`. These capture what an agent cannot discover by reading the code — intent/purpose (product) and the non-obvious stack + commands (tech) — plus the always-loaded entry file (AGENTS.md). `structure.md` is deliberately NOT mandatory; it is situational (generate only when a repo's layout is genuinely non-obvious, e.g. a large/unusual monorepo). This departs from the legacy `kickstart.md`, which treated `structure.md` as always-created.
- Rationale (research-backed): steering files load into context every turn, so bloat has a real cost. Empirical findings (ETH Zurich 2025 "Evaluating AGENTS.md"; GitHub's analysis of 2,500+ repos) show that context files which duplicate discoverable information (directory trees, code-style rules a linter already enforces, exhaustive dependency dumps) tend to REDUCE task success and raise cost, while lean files limited to non-discoverable info help. Generation prompts therefore enforce: include only the WHY + non-obvious HOW, commands early, three-tier boundaries (always / ask-first / never), omit-if-unknown (never fabricate), and a tight length budget. Directory/structure overviews specifically were found not to help navigation — another reason `structure.md` is situational.
- Note: the `product.md`/`tech.md`/`structure.md` grouping is a kickstart.md (Kiro-IDE-flavored) convention, not a Kiro CLI requirement. Per Kiro CLI docs, the only specially-recognized marker file is `AGENTS.md` (always in context); any `.md` under `.kiro/steering/` is loaded uniformly regardless of filename.
- Versioning: generated artifacts are stamped from a single `KICKSTART_VERSION` constant (`src/version.ts`), surfaced in files as an HTML comment (e.g. `<!-- kickstart v1 -->`).
- Mock mode (dev/testing): every LLM step is skippable. All agent calls go through `prompt()` (`src/prompt.ts`), which — when mock mode is on — returns a per-step canned output instead of invoking `kiro-cli`. Enable via the `--mock`/`-m` flag or `KICKSTART_MOCK` env var. Fixtures all live centrally in `src/mock.ts` (one place to browse them); each step imports its own fixture constant and passes it through `prompt({ mockOutput })`, so the fixture is linked to its call site at compile time while staying centralized. Fixtures match each step's real output contract (analysis Markdown, questions JSON, etc.) so downstream stages behave realistically. Caveat: mock mode only replaces the agent's return value — side-effect steps (e.g. mandatory-files writing to disk via the `write` tool) do not produce files in mock mode.
- Debug mode (dev/troubleshooting): enable via the `--debug`/`-d` flag or `KICKSTART_DEBUG` env var (`src/debug.ts`, same flag/env pattern as mock mode). Its first use is surfacing each `kiro-cli` call's `stderr` (the agent's error/trace output) from `prompt()`, which is otherwise suppressed. All debug/diagnostic output MUST be emitted through `@clack/prompts` `log.*` helpers, never raw `console.*` — clack owns the terminal during prompts/spinners and will overwrite or garble bare console writes.
- Skills and agents are bundled in `templates/` in this repo (not generated from scratch, not fetched from a remote source). Based on established community skills/agents where possible. Agent templates are on hold until the Kiro agent config format is confirmed.
- MCP servers: generate disabled suggestions in agent config when relevant tooling is detected (e.g., git MCP server for git repos). Don't enable by default since the user may not have the binaries installed.
- Each template directory has a `README.md` catalog documenting: what it does, when to include it, how to customize it, and what it's based on (for tracking upstream updates).
- The kickstart prompt reads the catalogs to decide which templates to install based on what it detects in the target repo.

## Working on this repo

- When a decision is made during planning or implementation, update this file immediately. Do not rely on chat history to preserve decisions.
- Keep `TODO.md` in sync with current progress.
- Keep the CLI `--help` output (`src/help.ts`, the single source of truth for usage text) in sync with the actual flags/options. Whenever a CLI flag or environment variable is added, removed, or renamed in `src/index.ts`, update `src/help.ts` in the same change.
- The orchestrator is a TypeScript/Node project. Typecheck changes with `npx tsc --noEmit` before considering them done. There is no test suite yet.
- The legacy `kickstart.md` prompt and the `templates/` catalogs are plain docs/prompts with no build step.
- Do not ever touch the project root README.md, index.html or styles.css unless _explicitly_ asked to do so. They are only to be worked on by a human.
