#!/usr/bin/env node

import { text, isCancel, select, confirm } from "@clack/prompts";

async function main() {
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
