import { multiselect, confirm, isCancel, cancel } from "@clack/prompts";
import { prompt } from "./prompt.ts";
import { SELECT_SKILLS_MOCK } from "./mock.ts";

export const SKILLS = {
  "skill-creator": {
    repository: "anthropics/skills",
    hint: "create and iterate on new skills",
  },
  "grill-me": {
    repository: "mattpocock/skills",
    hint: "stress-test plans and designs",
  },
  "find-skills": {
    repository: "vercel-labs/skills",
    hint: "discover and install new skills",
  },
  prototype: {
    repository: "emilkowalski/skills",
    hint: "build throwaway prototypes to explore designs",
  },
  "improve-codebase-architecture": {
    repository: "mattpocock/skills",
    hint: "find architecture improvement opportunities",
  },
} as const;

export type Skill = keyof typeof SKILLS;

export type SkillSelection = Record<Skill, boolean>;

export interface SelectSkillsArgs {
  projectContext: string;
  userInput: string;
}

export const SKILL_NAMES = Object.keys(SKILLS) as Skill[];

export async function selectSkills({
  projectContext,
  userInput,
}: SelectSkillsArgs): Promise<SkillSelection> {
  const template = Object.fromEntries(
    SKILL_NAMES.map((skill) => [skill, false]),
  );

  const promptText = `
Select which optional skills are useful for this project.
Only enable a skill when it clearly fits.
Default to false when unsure.

## Available skills
${SKILL_NAMES.map((skill) => `- ${skill}`).join("\n")}

## Project context
${projectContext.trim() || "(none provided)"}

## User input
${userInput.trim() || "(none provided)"}

## Output
Return ONLY a JSON object with these keys and boolean values:

${JSON.stringify(template, null, 2)}
`.trim();

  const raw = await prompt({
    promptString: promptText,
    mockOutput: SELECT_SKILLS_MOCK,
  });

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end <= start) {
    return template as SkillSelection;
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));

    return Object.fromEntries(
      SKILL_NAMES.map((skill) => [skill, parsed[skill] === true]),
    ) as SkillSelection;
  } catch {
    return template as SkillSelection;
  }
}

export async function confirmSkillSelection(
  selection: SkillSelection,
): Promise<Skill[] | null> {
  // preselect skills the LLM marked `true`
  const picked = await multiselect<Skill>({
    message:
      "Select the skills to install (space to toggle, enter to continue):",
    options: SKILL_NAMES.map((skill) => ({
      value: skill,
      label: skill,
      hint: SKILLS[skill].hint,
    })),
    initialValues: SKILL_NAMES.filter((skill) => selection[skill]),
    required: false,
  });

  if (isCancel(picked)) {
    cancel("Skill selection cancelled.");
    return null;
  }

  const chosen = new Set(picked);
  // confirm before proceeding
  const proceed = await confirm({
    message:
      chosen.size > 0
        ? `Install ${chosen.size} skill(s): ${[...chosen].join(", ")}?`
        : "Proceed with no skills selected?",
  });

  if (isCancel(proceed) || !proceed) {
    cancel("Skill selection cancelled.");
    return null;
  }

  return [...chosen];
}

export function getSelectedSkills(selection: SkillSelection): Skill[] {
  return SKILL_NAMES.filter((skill) => selection[skill]);
}
