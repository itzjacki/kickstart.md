# kickstart.md — Project Roadmap

## Goal

Create a meta-toolkit that an AI agent (e.g., Kiro) can follow to bootstrap proper AI steering docs and tooling in any target repository.

## Architecture rewrite: script-based orchestrator (in progress)

We are rewriting kickstart.md from a single hand-off prompt into a **script-based orchestrator** — a TypeScript/Node CLI that calls `kiro-cli` multiple times, once per logical step, to get explicit control over the process (sequencing, deterministic logic, user prompts between agent calls, and easier debugging).

Status:

- [x] Scaffold TypeScript/Node project (`src/`, ESM, Node ≥24, `@clack/prompts`)
- [x] `src/prompt.ts` — wrapper around `kiro-cli chat --non-interactive` (via `execFile`)
- [x] `src/index.ts` — CLI entry point (bin: `kickstart.md`) with interactive clack flow

### Pipeline stages

The run is an ordered pipeline. Each agent-backed stage makes its own scoped `kiro-cli` call; artifacts flow from earlier stages into later ones. Stages 3–10 are currently placeholder tasks in `src/index.ts` (return a `"Placeholder for step ..."` string); only analysis is implemented.

- [x] 1. Introduction — announce planned steps up front (`@clack/prompts` intro; no agent call)
- [x] 2. Analyze codebase — produce agent-oriented analysis artifact (`src/steps/codebase-analysis.ts`)
- [x] 3. Ask questions — agent decides (actively) which plain-language questions fill analysis gaps/`unknown`s; asked one-at-a-time via clack; produces answers artifact (`src/steps/ask-questions.ts`)
- [x] 4. Generate mandatory steering files — `AGENTS.md`, `product.md`, `tech.md` (lean/research-backed; `structure.md` deliberately excluded as situational) (`src/steps/generate-mandatory-files.ts`)
- [ ] 5. Recommend additional steering files — agent recommends situational files (incl. `structure.md`), user confirms/adjusts selection _(placeholder)_
- [ ] 6. Generate additional steering files (if any) _(placeholder)_
- [~] 7. Recommend skills — selection logic implemented (`src/skills.ts`); not yet wired into pipeline _(placeholder in flow)_
- [ ] 8. Install selected skills (likely `npx skills`) _(placeholder)_
- [ ] 9. Recommend MCP servers — agent determines relevance, looks them up online, user adjusts _(placeholder)_
- [ ] 10. Add selected MCP servers (disabled suggestions in agent config) _(placeholder)_
- [x] 11. Summarize — report everything created/installed (`@clack/prompts` outro; no agent call)

### Cross-cutting

- [~] Pass structured context between stages (analysis → questions wired; questions → generation pending)
- [ ] Installer-style UX: announce up front, per-stage progress, final summary
- [x] Scope `--trust-tools` per call (read-only structured tools by default; no `shell`)
- [ ] Error handling / retry for individual stages
- [ ] Decide the fate of the legacy `kickstart.md` prompt once the script reaches parity (retire or keep as fallback)

## Workflow

1. User opens a target repo in Kiro
2. User points Kiro at this repo (e.g., via knowledge base or context)
3. Kiro reads the kickstart instructions, analyzes the target repo, and generates tailored steering artifacts

## Scope

The kickstart prompt should produce what an AI agent needs to work effectively in a repo — no more. Specifically:

1. **Project context** — what the project is, how it's organized, key architectural decisions
2. **Environment/tooling** — build, test, lint, deploy commands; dependencies; CI setup
3. **Observed conventions** — patterns the AI should follow (naming, structure, error handling style, etc.) — documented as facts, not prescriptions
4. **Agent constraints** — files/dirs that are off-limits, actions that need human approval

Out of scope: tone, workflow preferences, prescriptive style guides.

## Kickstart prompt steps

1. Analyze the target repo — detect language(s), framework(s), build tools, test runners, linters/formatters, directory structure
2. Generate project context
3. Document environment/tooling
4. Capture observed conventions
5. Set agent constraints

## Artifacts to generate in target repos

### Always generated

- `AGENTS.md` — project context + agent constraints (always loaded by Kiro)
- `.kiro/steering/product.md` — what the project is, target users, business objectives
- `.kiro/steering/tech.md` — frameworks, libraries, dev tools, build/test/lint commands
- `.kiro/skills/update-kickstart/SKILL.md` — skill to update steering docs when kickstart versions change
- `.kiro/skills/` — additional skills sourced from established, well-tested collections (not invented from scratch). Some will always be included based on the kickstart workflow; others conditional on what's detected in the repo.

### Conditional (only if relevant)

- `.kiro/steering/structure.md` — if the repo's layout is genuinely non-obvious (e.g. a large/unusual monorepo); demoted from always-generated per research (directory overviews don't aid navigation and cost context)
- `.kiro/steering/code-conventions.md` — if clear patterns are detected in the codebase
- `.kiro/steering/api-standards.md` — if it's an API project
- `.kiro/steering/testing-standards.md` — if tests exist

## Checklist

- [x] Entry-point prompt (the main instruction set an AI agent follows)
- [x] Target repo analysis logic (what to look for and how)
- [x] Artifact generation rules (what to produce, where to put it, what format)
- [x] Versioning scheme — stamp version into generated artifacts
- [x] CHANGELOG.md — LLM-actionable changelog tracking what changed between versions
- [x] Update skill — separate skill that reads target's current version, diffs changelog, applies changes
- [x] Templates structure:
  - `templates/skills/README.md` — catalog (what each skill does, when to include, source/attribution, customization notes)
  - `templates/skills/*/SKILL.md` — bundled skill templates
  - `templates/agents/README.md` — catalog (placeholder for when agent config format is confirmed)

## Open questions

- Which specific skills and agents to bundle (research needed)

## Next steps

- [ ] Refine generation instructions for each steering file (product.md, tech.md, structure.md, code-conventions.md, api-standards.md, testing-standards.md) — reference web resources on best practices for each
- [ ] Add `docs-updater` skill to templates — a skill that keeps steering docs in sync as the codebase evolves
- [ ] Adjust the kickstarted AGENTS.md template so it instructs the AI to update steering docs every time a task is completed

## Skills for this repo (not templates)

- [ ] `release-version` skill — creates a new kickstart version: looks at the diff since last version, generates a changelog entry following the same specification that `update-kickstart` uses to parse it. Ensures changelog format is consistent between producer and consumer.
- [ ] `write-skill` skill — assists in writing new skill templates (proper frontmatter, structure, catalog entry, etc.)

## Stretch goals

- [ ] Support for multiple AI tools (Kiro, Cursor, Copilot, etc.)
- [ ] Validation step — verify generated docs are consistent with the actual repo
- [ ] Prompt hooks (IDE-only for now) — when available in CLI, use them for "do this every time" procedures instead of relying on AGENTS.md instructions
