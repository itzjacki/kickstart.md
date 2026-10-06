#!/usr/bin/env node

import { parseArgs } from "node:util";
import { intro, outro, log, tasks, cancel, note } from "@clack/prompts";
import { analyzeCodebase } from "./steps/codebase-analysis.ts";
import { askQuestions, decideQuestions } from "./steps/ask-questions.ts";
import {
  generateMandatoryFiles,
  MANDATORY_FILES,
} from "./steps/generate-mandatory-files.ts";
import {
  ADDITIONAL_STEERING_NAMES,
  recommendAdditionalSteeringFiles,
  confirmAdditionalSteeringFiles,
  type SteeringRecommendations,
  type AdditionalSteeringFile,
} from "./steps/additional-steering.ts";
import { generateAdditionalFiles } from "./steps/generate-additional-files.ts";
import {
  confirmSkillSelection,
  selectSkills,
  type SkillRecommendations,
} from "./skills.ts";
import { enableMockMode, isMockMode } from "./mock.ts";
import { enableDebugMode, isDebugMode } from "./debug.ts";
import { printHelp } from "./help.ts";
import { installSkills } from "./install-skills.ts";
import { showSummary } from "./summary.ts";
import { selectMCPs } from "./steps/select-mcps.ts";
import { checkRuntimeDependencies } from "./dependencies.ts";

async function main() {
  const { values } = parseArgs({
    options: {
      help: { type: "boolean", short: "h", default: false },
      mock: { type: "boolean", short: "m", default: false },
      debug: { type: "boolean", short: "d", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return;
  }

  if (values.mock) {
    enableMockMode();
  }

  if (values.debug) {
    enableDebugMode();
  }

  const dependencyIssues = await checkRuntimeDependencies({
    skipKiroCli: isMockMode(),
  });
  if (dependencyIssues.length > 0) {
    log.error(
      [
        "Cannot start kickstart.md because required runtime dependencies are missing:",
        ...dependencyIssues.map(({ name, detail }) => `- ${name}: ${detail}`),
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  // Stage 1: Introduction
  intro("kickstart.md — bootstrapping AI steering docs and tooling");
  if (isMockMode()) {
    log.warn("Running in mock mode — LLM steps return pre-made examples.");
  }
  if (isDebugMode()) {
    log.warn("Running in debug mode — extra diagnostics will be shown.");
  }
  note(
    [
      "kickstart.md sets up your repo for AI-assisted development. It runs",
      "through a few focused steps, asking plain-language questions along the",
      "way, and writes everything into AGENTS.md and a .kiro/ directory.",
      "",
      "What happens next:",
      "  1. Analyze the codebase to understand your project.",
      "  2. Ask you a few clarifying questions.",
      "  3. Generate relevant steering files",
      "  4. Recommend and install relevant skills.",
      "  5. Suggest MCP servers you can enable later.",
    ].join("\n"),
    "What this does",
  );

  // Stage 2: Analyze codebase. Runs in a spinner; capture its artifact for
  // later stages.
  let analysis = "";
  await tasks([
    {
      title:
        "Analyzing codebase. This will probably take a few minutes, depending on the size of the codebase.",
      task: async () => {
        analysis = await analyzeCodebase();
        return "Codebase analyzed";
      },
    },
  ]);

  // Stage 3: Ask questions. Split in two: deciding which questions to ask is a
  // non-interactive agent call (can hang with no output), so it runs in a
  // spinner; the actual prompting is interactive and must run outside the
  // spinner `tasks` block (clack prompts hang inside one).
  let decidedQuestions: Awaited<ReturnType<typeof decideQuestions>> = [];
  await tasks([
    {
      title: "Deciding what to ask you",
      task: async () => {
        decidedQuestions = await decideQuestions(analysis);
        return decidedQuestions.length > 0
          ? `Prepared ${decidedQuestions.length} question${decidedQuestions.length === 1 ? "" : "s"}`
          : "No questions needed";
      },
    },
  ]);

  const questions = await askQuestions(decidedQuestions);
  log.info(
    `Captured ${questions.answered.length} answer${questions.answered.length === 1 ? "" : "s"}.`,
  );

  // Stages 4 & 5a: non-interactive agent work — generate mandatory files, then
  // compute the additional-steering recommendation. Both run in the spinner.
  let steeringRecommendations: SteeringRecommendations | undefined;
  await tasks([
    // Stage 4: Generate mandatory steering files (AGENTS.md, product.md,
    // tech.md). The agent writes them to disk directly.
    {
      title: "Generating mandatory steering files",
      task: async () => {
        await generateMandatoryFiles({
          analysis,
          answers: questions.artifact,
        });
        return "Mandatory steering files generated";
      },
    },
    // Stage 5a: Recommend additional (situational) steering files.
    {
      title: "Deciding which steering files to recommend",
      task: async () => {
        steeringRecommendations = await recommendAdditionalSteeringFiles({
          analysis,
          answers: questions.artifact,
        });
        return "Additional steering files recommended";
      },
    },
  ]);

  // Stage 5b: Confirm/adjust the additional-steering selection. Interactive, so
  // it runs outside the spinner `tasks` block.
  let selectedAdditionalFiles: AdditionalSteeringFile[] = [];
  if (steeringRecommendations) {
    const additionalSteering = await confirmAdditionalSteeringFiles(
      steeringRecommendations,
    );
    if (additionalSteering === null) {
      // User cancelled during confirmation.
      cancel("Kickstart cancelled.");
      process.exitCode = 1;
      return;
    }
    selectedAdditionalFiles = ADDITIONAL_STEERING_NAMES.filter(
      (file) => additionalSteering[file].recommended,
    );
    log.info(
      selectedAdditionalFiles.length > 0
        ? `Additional steering files to generate: ${selectedAdditionalFiles.join(", ")}.`
        : "No additional steering files selected.",
    );
  }

  await tasks([
    {
      title: "Generating additional steering files",
      task: async () => {
        if (selectedAdditionalFiles.length === 0) {
          return "No additional steering files selected";
        }

        await generateAdditionalFiles({
          analysis,
          answers: questions.artifact,
          selectedFiles: selectedAdditionalFiles,
        });

        return `Generated ${selectedAdditionalFiles.length} additional steering file(s)`;
      },
    },
  ]);

  // Stage 7: Recommend skills
  let suggestedSkills!: SkillRecommendations;
  await tasks([
    {
      title:
        "Deciding which skills to recommend. Skills give the AI reusable, step-by-step instructions for specific tasks in your project.",
      task: async () => {
        suggestedSkills = await selectSkills({
          projectContext: analysis,
          userInput: questions.artifact,
        });

        return "Skills recommended";
      },
    },
  ]);

  // Stage 8: Confirm skills
  const selectedSkills = await confirmSkillSelection(suggestedSkills);

  if (selectedSkills === null) {
    cancel("Kickstart cancelled.");
    process.exitCode = 1;
    return;
  }

  // Stage 9: Install skills. Each skill installs independently; a failure on
  // one is collected rather than aborting the whole step.
  let installedSkills: string[] = [];
  await tasks([
    {
      title: "Installing skills",
      task: async () => {
        if (selectedSkills.length === 0) {
          return "No skills selected";
        }

        const { installed, failed } = await installSkills(selectedSkills);
        installedSkills = installed;

        if (failed.length > 0) {
          const detail = failed
            .map(({ skill, error }) => `${skill} (${error})`)
            .join(", ");
          log.warn(`Failed to install ${failed.length} skill(s): ${detail}`);
        }

        return `Installed ${installed.length} of ${selectedSkills.length} skill(s)`;
      },
    },
  ]);

  // Stage 10: Select MCPs
  const { mcpsAdded } = await selectMCPs(analysis + questions.artifact);

  // Stage 11: Summarize what the run produced
  showSummary({
    mandatoryFiles: MANDATORY_FILES,
    additionalFiles: selectedAdditionalFiles,
    skillsInstalled: installedSkills,
    mcpServersAdded: mcpsAdded,
  });
  outro("Kickstart complete!");
}

main().catch((error) => {
  cancel(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
