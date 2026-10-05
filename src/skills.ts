import { prompt } from "./prompt.ts";

export const SKILLS = [
  "update-kickstart",
  "update-steering",
  "skill-creator",
  "grill-me",
  "find-skills",
  "prototype",
  "improve-codebase-architecture",
] as const;

export type Skill = (typeof SKILLS)[number];

export type SkillSelection = Record<Skill, boolean>;

export interface SelectSkillsArgs {
  projectContext: string;
  userInput: string;
}

export async function selectSkills({
  projectContext,
  userInput,
}: SelectSkillsArgs): Promise<SkillSelection> {
  const template = Object.fromEntries(SKILLS.map((skill) => [skill, false]));

  const promptText = `
Select which optional skills are useful for this project.
Only enable a skill when it clearly fits.
Default to false when unsure.

## Available skills
${SKILLS.map((skill) => `- ${skill}`).join("\n")}

## Project context
${projectContext.trim() || "(none provided)"}

## User input
${userInput.trim() || "(none provided)"}

## Output
Return ONLY a JSON object with these keys and boolean values:

${JSON.stringify(template, null, 2)}
`.trim();

  const raw = await prompt({ promptString: promptText });

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end <= start) {
    return template as SkillSelection;
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));

    return Object.fromEntries(
      SKILLS.map((skill) => [skill, parsed[skill] === true]),
    ) as SkillSelection;
  } catch {
    return template as SkillSelection;
  }
}

// for testing: delete later
export const projectContext = `
  Wideroe.no — the public website for Widerøe, a Norwegian regional airline.
  Next.js 16 (App Router) + React 19 + TypeScript 6 with Optimizely CMS via
  Content Graph (GraphQL), replacing a legacy AEM-driven React SPA. Serves
  CMS-driven content pages plus transactional flows (flight search, booking,
  manage booking, check-in, loyalty). CSS Modules + clsx (no Tailwind), next-intl
  (nb/en), SAP OIDC auth. Trunk-based development with auto-deploy to production
  on merge to main — quality is critical.
  
  The team is in an active phase that touches every part of its AI-assisted
  workflow and codebase health, and needs ALL of the following:
  
  - update-kickstart: The project's AI kickstart tooling is behind. A newer
    kickstart version is available and the steering docs/skills setup needs to be
    updated to match it.
  
  - update-steering: The codebase has changed significantly since the last doc
    sync — new flight-search features, refactors, and dependency changes. The
    .kiro steering docs are now out of date and must be brought back in line with
    the code.
  
  - skill-creator: The team wants to author new custom agent skills from scratch
    (and improve existing ones) to encode their booking-flow conventions.
  
  - grill-me: Before committing to the new booking data model and state machine,
    the team wants their plan relentlessly stress-tested and every branch of the
    decision tree resolved.
  
  - find-skills: The team keeps asking "is there a skill that can do X?" and wants
    help discovering and installing additional agent skills to extend
    capabilities.
  
  - prototype: Before committing to the design, the team wants a throwaway
    prototype to flesh out the flight-search state machine and let them play with
    the different booking states and UI variations.
  
  - improve-codebase-architecture: The AEM migration left tightly-coupled,
    hard-to-test modules in src/components/old/ and the lib/optimizely layer that
    need refactoring to be more testable and AI-navigable.
  
  Every one of these skills is clearly and immediately relevant to the current
  work.
  `.trim();
