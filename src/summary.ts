import { note } from "@clack/prompts";
import { KICKSTART_VERSION } from "./version.ts";

/**
 * Everything the run produced, as counts/names the outro summarizes. Keep this
 * oriented around what the user cares about seeing — not an exhaustive dump.
 *
 * As stages get wired up, replace the placeholder fields with real results.
 */
export interface RunSummary {
  /** Mandatory steering files written (always generated). */
  mandatoryFiles: readonly string[];
  /** Additional situational steering files the user chose to generate. */
  additionalFiles: readonly string[];
  /** Names of the skills that were installed. */
  skillsInstalled: readonly string[];
  /** How many MCP servers were added (as disabled suggestions). */
  mcpServersAdded: number;
}

/**
 * Format a count with a correctly-pluralized noun, e.g. `1 file` / `3 files`.
 */
const countLabel = (
  n: number,
  singular: string,
  plural = `${singular}s`,
): string => `${n} ${n === 1 ? singular : plural}`;

/**
 * Render the end-of-run recap and the closing outro.
 *
 * CLI summaries work best as a scannable recap of counts, enumerating only the
 * small, high-signal set (the steering files that were written). Larger or
 * open-ended sets (skills, MCP servers) are reported as counts rather than
 * listed item-by-item, which keeps the output readable and scales as those
 * stages produce more.
 */
export const renderSummary = ({
  mandatoryFiles,
  additionalFiles,
  skillsInstalled,
  mcpServersAdded,
}: RunSummary): string => {
  const steeringFiles = [...mandatoryFiles, ...additionalFiles];

  const lines = [
    `Steering files: ${countLabel(steeringFiles.length, "file")}`,
    ...steeringFiles.map((file) => `  • ${file}`),
    "",
    `Skills installed: ${countLabel(skillsInstalled.length, "skill")}`,
    ...skillsInstalled.map((skill) => `  • ${skill}`),
    "",
    `MCP servers added: ${mcpServersAdded}`,
  ];

  return lines.join("\n");
};

/**
 * Show the final summary panel followed by the closing message. Pairs the
 * recap `note` with an `outro` so the entry point has a single call for the
 * last stage.
 */
export const showSummary = (summary: RunSummary): void => {
  note(renderSummary(summary), `kickstart.md ${KICKSTART_VERSION} - result`);
};
