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

export interface SkillInstallFailure {
  skill: Skill;
  error: string;
}

export interface InstallSkillsResult {
  installed: Skill[];
  failed: SkillInstallFailure[];
}

/**
 * Install each selected skill independently
 * Returns which skills succeeded and which failed to install
 */
export async function installSkills(
  skills: readonly Skill[],
): Promise<InstallSkillsResult> {
  const installed: Skill[] = [];
  const failed: SkillInstallFailure[] = [];

  for (const skill of skills) {
    const source = SKILLS[skill].repository;

    try {
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
      installed.push(skill);
    } catch (err) {
      failed.push({ skill, error: summarizeError(err) });
    }
  }

  return { installed, failed };
}

// generated code:
/** Extract a concise reason from an execFile error (strips ANSI, picks signal). */
function summarizeError(err: unknown): string {
  const e = err as { stdout?: string; stderr?: string; message?: string };
  const text = `${e.stderr ?? ""}${e.stdout ?? ""}`
    // Strip ANSI escape sequences the CLI emits.
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

  // Prefer the CLI's explicit "No matching skills"/error line if present.
  const signal = text
    .split("\n")
    .map((l) => l.replace(/^[│■◆◇○●\s]+/, "").trim())
    .find((l) => /no matching skills|error|not found|failed/i.test(l));

  return signal || e.message?.split("\n")[0] || "unknown error";
}
