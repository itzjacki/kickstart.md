#!/usr/bin/env node

import { parseArgs } from "node:util";
import { intro, outro, log, tasks, cancel } from "@clack/prompts";
import { analyzeCodebase } from "./steps/codebase-analysis.ts";
import { askQuestions } from "./steps/ask-questions.ts";
import { generateMandatoryFiles } from "./steps/generate-mandatory-files.ts";
import {
  recommendAdditionalSteeringFiles,
  confirmAdditionalSteeringFiles,
  type SteeringRecommendations,
  type AdditionalSteeringSelection,
} from "./steps/additional-steering.ts";
import { selectSkills } from "./skills.ts";
import { enableMockMode, isMockMode } from "./mock.ts";
import { enableDebugMode, isDebugMode } from "./debug.ts";
import { printHelp } from "./help.ts";

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

  // Stage 1: Introduction
  intro("kickstart.md — bootstrapping AI steering docs and tooling");
  if (isMockMode()) {
    log.warn("Running in mock mode — LLM steps return pre-made examples.");
  }
  if (isDebugMode()) {
    log.warn("Running in debug mode — extra diagnostics will be shown.");
  }
  log.info("Info about the process will go here.");

  // Temporarily put this here, feel free to move it @daria
  const skills = await selectSkills({
    projectContext:
      "Wideroe.no — the public website for Widerøe (Norwegian regional airline). Next.js 16 + Optimizely CMS, replacing a legacy AEM SPA. Serves content pages and transactional flows (booking, manage booking, check-in, loyalty) for travellers, plus a CMS interface for content editors.",
    userInput: "",
  });
  console.log("skills", skills);

  // Stage 2: Analyze codebase. Runs in a spinner; capture its artifact for
  // later stages.
  let analysis = "";
  await tasks([
    {
      title: "Analyzing codebase",
      task: async () => {
        analysis = await analyzeCodebase();
        return "Codebase analyzed";
      },
    },
  ]);

  // Stage 3: Ask questions. This step is interactive (it prompts the user one
  // question at a time), so it must run outside the spinner `tasks` block.
  const questions = await askQuestions(analysis);
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
      title: "Recommending additional steering files",
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
  let additionalSteering: AdditionalSteeringSelection | null = null;
  if (steeringRecommendations) {
    additionalSteering = await confirmAdditionalSteeringFiles(
      steeringRecommendations,
    );
    if (additionalSteering === null) {
      // User cancelled during confirmation.
      cancel("Kickstart cancelled.");
      process.exitCode = 1;
      return;
    }
    const selected = Object.entries(additionalSteering)
      .filter(([, rec]) => rec.recommended)
      .map(([file]) => file);
    log.info(
      selected.length > 0
        ? `Additional steering files to generate: ${selected.join(", ")}.`
        : "No additional steering files selected.",
    );
  }

  await tasks([
    {
      title: "Generating additional steering files",
      task: async () =>
        "Placeholder for step: generate additional steering files",
    },
    {
      title: "Recommending skills",
      task: async () => "Placeholder for step: recommend skills",
    },
    {
      title: "Installing skills",
      task: async () => "Placeholder for step: install skills",
    },
    {
      title: "Recommending MCP servers",
      task: async () => "Placeholder for step: recommend MCP servers",
    },
    {
      title: "Adding MCP servers",
      task: async () => "Placeholder for step: add MCP servers",
    },
  ]);

  // Stage 11: Summarize.
  outro("Kickstart complete. Should probably put some more info here.");
}

main().catch((error) => {
  cancel(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
