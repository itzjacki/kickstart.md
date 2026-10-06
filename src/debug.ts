/**
 * Debug mode for local development and troubleshooting.
 *
 * When enabled, the orchestrator surfaces extra diagnostics that are normally
 * hidden — most importantly the `stderr` of each `kiro-cli` call (see
 * `src/prompt.ts`), which carries the agent's own error/trace output.
 *
 * Enable it with either:
 *   - the `--debug` (or `-d`) CLI flag, or
 *   - the `KICKSTART_DEBUG` environment variable set to `true` (case-insensitive).
 *
 * IMPORTANT: debug output must be emitted through `@clack/prompts` logging
 * helpers (`log.*`), never raw `console.log`/`console.error`. clack owns the
 * terminal while prompts and spinners are active; a bare `console.*` write can
 * be overwritten or garbled by clack's re-rendering. Routing through `log.*`
 * lets clack place the message cleanly in its output stream.
 */

let forcedDebug = false;

/** Force debug mode on (called by the CLI entry point when `--debug` is passed). */
export const enableDebugMode = (): void => {
  forcedDebug = true;
};

/** Whether debug mode is active (via `--debug` flag or `KICKSTART_DEBUG` env var). */
export const isDebugMode = (): boolean =>
  forcedDebug || process.env.KICKSTART_DEBUG?.toLowerCase() === "true";
