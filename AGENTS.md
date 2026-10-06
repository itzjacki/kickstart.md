# AGENTS.md

kickstart.md bootstraps AI steering docs (`AGENTS.md` + `.kiro/`) in a _target_
repo. It's a TypeScript/Node CLI (`src/`) that drives the process via scoped
`kiro-cli chat --no-interactive` calls, one per pipeline stage. (Legacy
single-prompt version still lives at root `kickstart.md` during the rewrite.)

**Verify any change with `npx tsc --noEmit`** (typecheck only; no tests yet).
Run locally: `node --experimental-strip-types ./src/index.ts`. Stage status: `TODO.md`.

**Published artifact is compiled JS, not stripped TS.** Node's TS stripping does
not work for installed `node_modules`, so the package ships `dist/` (emitted by
`npm run build` = `clean && tsc`) and `bin` points at `dist/index.js`. The `files`
field publishes only `dist/`; `package.json` is always included (needed at runtime
by `version.js`, which imports `../package.json` — resolving from `dist/` to the
package root). The build runs automatically on release (`after:bump` hook) and as
a `prepublishOnly` safety net; `dist/` is gitignored.

## Things you'll get wrong without knowing

- All agent calls go through `src/prompt.ts` (the one place `kiro-cli` flags are set).
- `--trust-tools` controls auto-approval, not availability: in `--no-interactive`
  mode an _untrusted_ tool call hangs forever. The trusted set is the only usable
  one — read-only by default (`read`/`grep`/`glob`/`code`); `write` etc. granted
  per stage. No `shell`, and no agent-config is written to the user's repo/`~/.kiro`
  (friction-free), so stages rely on the structured read tools.
- `@clack/prompts` prompts hang inside a `tasks()` spinner — run interactive
  prompts _between_ spinner blocks. All diagnostic output must use clack `log.*`,
  never `console.*` (clack owns the terminal).
- ESM with explicit `.ts` import extensions; `exactOptionalPropertyTypes` is on.
- Startup preflight checks that `kiro-cli` is on PATH for real runs; mock mode skips that check. Node/npm-managed runtime requirements are handled by the launcher/package metadata rather than manually checked.

## Keep in sync

Record decisions in this file as they're made. Keep `TODO.md` current. A CLI flag
change in `src/index.ts` → update `src/help.ts` in the same change. For release
changes, keep `package.json` scripts/configuration and this guidance in sync.

## Boundaries

- **Never touch** (human-only unless explicitly asked): root `README.md`, `index.html`, `styles.css`.
- **Ask first**: retiring the legacy root `kickstart.md`; changing the package version or release process.
- **Release command**: `npm run release -- patch|minor|major` uses release-it to typecheck, bump the package version, push the tag, create the GitHub Release, and publish to npm. This performs external/irreversible actions, so never run it without an explicit request. GitHub CLI is not required; release-it uses the GitHub API.

## What the tool generates (design principle)

Lean beats comprehensive — generated steering loads into context every turn, so
include only non-discoverable info, never duplicate the linter/code, omit
unknowns. Mandatory set: `AGENTS.md`, `product.md`, `tech.md`; everything else is
situational. Full rationale: `TODO.md` and `kickstart.md`.
