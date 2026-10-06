import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { SKILLS } from "./skills.ts";
import type { Skill } from "./skills.ts";

const execFileAsync = promisify(execFile);

export async function installSkills(skills: readonly Skill[]): Promise<void> {
  for (const skill of skills) {
    const source = SKILLS[skill].repository;

    await execFileAsync(
      "npx",
      [
        "skills",
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
