# AGENTS.md

## Project overview

kickstart.md is a meta-toolkit. It contains a prompt (`kickstart.md`) that an AI agent reads and executes against a *different* target repository to bootstrap AI steering docs and tooling there.

This repo does NOT contain application code. It contains:
- `kickstart.md` — the entry-point prompt an AI agent follows to set up a target repo
- `TODO.md` — project roadmap and checklist
- Templates and examples (as they are developed)

## Key decisions

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
- This is a documentation/prompt project — there is no build step or test suite.
