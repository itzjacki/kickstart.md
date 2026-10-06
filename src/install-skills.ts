import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS } from "./skills.ts";
import type { Skill } from "./skills.ts";

const execFileAsync = promisify(execFile);

/**
 * Resolve the `skills` CLI binary from the local node_modules rather than
 * relying on npx. (This avoids first-run download latency and version drift)
 */
const SKILLS_BIN = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  "skills",
);

export async function installSkills(skills: readonly Skill[]): Promise<void> {
  for (const skill of skills) {
    const source = SKILLS[skill].repository;

    await execFileAsync(
      SKILLS_BIN,
      [
        "add",
        source,
        "--skill",
        skill,
        "--agent",
        "kiro-cli",
        "--yes",
      ],
      {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  }
}
