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

## Key decisions

- Architecture: the tool is a **script-based orchestrator** (TypeScript/Node CLI), not a single hand-off prompt. The script makes multiple scoped `kiro-cli chat` calls — one per logical step — so the tool controls sequencing, can run deterministic logic and user prompts between agent calls, and is easier to debug than a monolithic prompt. The legacy `kickstart.md` prompt is retained during the transition and will be superseded.
- Agent invocation goes through a single wrapper (`src/prompt.ts`) around `kiro-cli chat --non-interactive`, using `execFile` (argv array, no shell) to avoid injection/quoting issues. The wrapper is the one place where kiro-cli flags (e.g. `--trust-tools`) are mapped.
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
- Skills and agents are bundled in `templates/` in this repo (not generated from scratch, not fetched from a remote source). Based on established community skills/agents where possible. Agent templates are on hold until the Kiro agent config format is confirmed.
- MCP servers: generate disabled suggestions in agent config when relevant tooling is detected (e.g., git MCP server for git repos). Don't enable by default since the user may not have the binaries installed.
- Each template directory has a `README.md` catalog documenting: what it does, when to include it, how to customize it, and what it's based on (for tracking upstream updates).
- The kickstart prompt reads the catalogs to decide which templates to install based on what it detects in the target repo.

## Working on this repo

- When a decision is made during planning or implementation, update this file immediately. Do not rely on chat history to preserve decisions.
- Keep `TODO.md` in sync with current progress.
- The orchestrator is a TypeScript/Node project. Typecheck changes with `npx tsc --noEmit` before considering them done. There is no test suite yet.
- The legacy `kickstart.md` prompt and the `templates/` catalogs are plain docs/prompts with no build step.
- Do not ever touch the project root README.md, index.html or styles.css unless _explicitly_ asked to do so. They are only to be worked on by a human.
