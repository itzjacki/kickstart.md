#!/usr/bin/env node

import { intro, outro, log, tasks, cancel } from "@clack/prompts";
import { analyzeCodebase } from "./steps/codebase-analysis.ts";
import { selectSkills } from "./skills.ts";

async function main() {
  // Stage 1: Introduction
  intro("kickstart.md — bootstrapping AI steering docs and tooling");
  log.info("Info about the process will go here.");

  // Temporarily put this here, feel free to move it @daria
  const skills = await selectSkills({
    projectContext:
      "Wideroe.no — the public website for Widerøe (Norwegian regional airline). Next.js 16 + Optimizely CMS, replacing a legacy AEM SPA. Serves content pages and transactional flows (booking, manage booking, check-in, loyalty) for travellers, plus a CMS interface for content editors.",
    userInput: "",
  });
  console.log("skills", skills);

  await tasks([
    // Stage 2: Analyze codebase
    {
      title: "Analyzing codebase",
      task: async () => {
        await analyzeCodebase();
        return "Codebase analyzed";
      },
    },
    {
      title: "Asking questions",
      task: async () => "Placeholder for step: ask questions",
    },
    {
      title: "Generating mandatory steering files",
      task: async () =>
        "Placeholder for step: generate mandatory steering files",
    },
    {
      title: "Recommending additional steering files",
      task: async () =>
        "Placeholder for step: recommend additional steering files",
    },
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
