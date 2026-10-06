import { prompt } from "../prompt.ts";
import { KICKSTART_VERSION } from "../version.ts";
import { GENERATE_ADDITIONAL_FILES_MOCK } from "../mock.ts";
import type { AdditionalSteeringFile } from "./additional-steering.ts";
import { composeAdditionalSteeringPrompts } from "./additional-steering-prompts.ts";

export interface GenerateAdditionalFilesArgs {
  /** The dense analysis artifact produced by the analysis stage. */
  analysis: string;
  /** The user-answers artifact produced by the questions stage (may be empty). */
  answers: string;
  /** The final files confirmed by the user in the interactive selection. */
  selectedFiles: readonly AdditionalSteeringFile[];
}

/**
 * Generates the user-selected situational steering files.
 *
 * The prompt is deliberately assembled from only the confirmed files. The
 * agent gets write access for this scoped call and is forbidden from touching
 * mandatory steering files, skills, or unrelated repository files.
 */
export const generateAdditionalFiles = async ({
  analysis,
  answers,
  selectedFiles,
}: GenerateAdditionalFilesArgs): Promise<string> => {
  if (selectedFiles.length === 0) {
    return "";
  }

  return prompt({
    promptString: buildPrompt(analysis, answers, selectedFiles),
    optionalAllowedTools: ["write"],
    mockOutput: GENERATE_ADDITIONAL_FILES_MOCK,
  });
};

const buildPrompt = (
  analysis: string,
  answers: string,
  selectedFiles: readonly AdditionalSteeringFile[],
): string =>
  `
## Your task: generate the selected additional steering files

This is the optional-steering generation stage of kickstart.md. The user has
already reviewed and confirmed the exact files listed below. Generate only those
files and WRITE them to disk using the write tool, at these paths relative to the
repository root:

${selectedFiles.map((file) => `- \`.kiro/steering/${file}\``).join("\n")}

Create the \`.kiro/steering/\` directory as needed. Do NOT generate or modify
AGENTS.md, \`.kiro/steering/product.md\`, \`.kiro/steering/tech.md\`, skills,
MCP configuration, or any other file. Do not perform unrelated repository work.

### Per-file instructions

The following sections are the individual instructions for the selected files.
Follow each section only for its named output path; do not create files for any
section that is absent.

${composeAdditionalSteeringPrompts(selectedFiles)}

### Evidence and quality rules

- Use BOTH artifacts below. The analysis is factual repository evidence; the
  answers are authoritative for product, domain, constraints, and requested
  handling of existing files.
- Facts beat generic advice. Include only information supported by the artifacts
  or by files you inspect with read-only tools. Cite paths briefly where useful.
- Keep every file lean. Capture non-discoverable guidance, not a directory dump,
  dependency inventory, copied source code, or rules already enforced by tools.
- Never fabricate. If a selected concern is not actually evidenced, write a short
  honest file explaining that the relevant information could not be established,
  rather than inventing policy. Do not silently broaden a file into a different
  concern.
- Each file must be valid Markdown, begin with an appropriate title, and include
  this comment immediately below the title:
  \`<!-- kickstart version: ${KICKSTART_VERSION} -->\`

### Reconciling existing files

If the user-answers artifact states how to handle an existing selected file:

- \"replace\": overwrite it with the new evidence-based content;
- \"merge\" or \"combine\": read it first and preserve still-relevant content;
- \"keep\" or \"leave untouched\": do not write that file and report that it
  was skipped.

If no preference is expressed, write the selected files normally. Never delete
existing files and never overwrite an existing file merely because it was not
selected; this stage only handles the confirmed paths.

### Output

Write the selected files and then stop. Output only one concise confirmation line
per selected path, for example \`Wrote .kiro/steering/security.md\`. If an
existing file was explicitly kept, report \`Skipped ... (kept existing file)\`
instead. Do not echo file contents or add commentary.

### Analysis artifact

${analysis.trim() || "(no analysis provided)"}

### User-answers artifact

${answers.trim() || "(no answers provided)"}
`.trim();
