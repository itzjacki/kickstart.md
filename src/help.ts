import { KICKSTART_VERSION } from "./version.ts";

/**
 * Print standard `--help` usage to stdout.
 *
 * This is the single source of truth for the CLI's usage text. Whenever a flag
 * or environment variable is added, removed, or changed in `src/index.ts`,
 * update this text to match — the help output is part of the tool's contract.
 *
 * Prints via `console.log` (not clack): help runs before any interactive UI
 * starts, so clack isn't owning the terminal, and `--help` conventionally emits
 * plain stdout that users may pipe or grep.
 */
export function printHelp(): void {
  console.log(
    `kickstart.md ${KICKSTART_VERSION} — bootstrap AI steering docs and tooling for a repo

USAGE
  kickstart.md [options]

  Run inside the repository you want to kickstart. It analyzes the project,
  asks a few plain-language questions, then generates AGENTS.md and a .kiro/
  directory of steering files and skills.

OPTIONS
  -h, --help    Show this page.
  -m, --mock    Mock mode: skip all LLM calls and use pre-made example outputs
                (for development/testing without kiro-cli).
  -d, --debug   Debug mode: show extra diagnostics.

ENVIRONMENT
  KICKSTART_MOCK    Set to "true" to enable mock mode.
  KICKSTART_DEBUG   Set to "true" to enable debug mode.`,
  );
}
