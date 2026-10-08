import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { SKILLS } from "./skills.ts";
import type { Skill } from "./skills.ts";

const execFileAsync = promisify(execFile);

/**
 * Resolve the `skills` CLI entrypoint through Node's module resolution rather
 * than guessing a path into `node_modules/.bin`.
 *
 * Why: when kickstart.md is installed as a dependency, npm hoists `skills` to
 * the consumer's top-level `node_modules`, so a hardcoded
 * `<pkg>/node_modules/.bin/skills` path does not exist. `require.resolve`
 * finds the real file regardless of where the installer placed it (hoisted,
 * nested, pnpm symlinks, etc.). We resolve the bin file directly — the `skills`
 * package ships no `main`/`exports`, but publishes `bin/cli.mjs` in `files`, so
 * the subpath resolves everywhere.
 *
 * We then run it with the current `node` (`process.execPath`) instead of the
 * `.bin` shim, which avoids depending on shim location, executable bit, or the
 * shebang being honored (e.g. on Windows).
 */
const require = createRequire(import.meta.url);
const SKILLS_CLI = require.resolve("skills/bin/cli.mjs");

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
        process.execPath,
        [
          SKILLS_CLI,
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
