#!/usr/bin/env node

import { text, isCancel, select, confirm } from "@clack/prompts";
import { prompt } from "./prompt.ts";

async function main() {
  const result = await prompt({
    promptString:
      "what is the capital in norway? Write the answer in a file called capital.txt",
  });

  // Get user's name
  const name = String(
    await text({
      message: "What is your name?",
      placeholder: "John Doe",
    }),
  );

  // Get user's preferred framework
  const framework = await select({
    message: "Choose a framework:",
    options: [
      { value: "react", label: "React" },
      { value: "vue", label: "Vue" },
      { value: "svelte", label: "Svelte" },
    ],
  });

  if (isCancel(framework)) {
    console.log("Operation cancelled");
    process.exit(0);
  }

  // Confirm the selection
  const shouldProceed = await confirm({
    message: `Create a ${framework} project for ${name}?`,
  });

  if (shouldProceed) {
    console.log("Creating project...");
  }
}

main();
