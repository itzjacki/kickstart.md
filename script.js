const copyButton = document.querySelector("[data-copy-command]");

if (copyButton instanceof HTMLButtonElement) {
  copyButton.addEventListener("click", async () => {
    const command = copyButton.dataset.copyCommand;
    if (!command) return;

    try {
      await navigator.clipboard.writeText(command);
      copyButton.textContent = "Copied ✓";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);
    } catch {
      copyButton.textContent = "Select to copy";
    }
  });
}

const exampleOutputs = {
  mcps: `
│
◇  MCPs has been installed
│
◇  kickstart.md 1.0.0 - result ───╮
│                                 │
│  Steering files: 5 files        │
│    • AGENTS.md                  │
│    • .kiro/steering/product.md  │
│    • .kiro/steering/tech.md     │
│    • code-conventions.md        │
│    • security.md                │
│                                 │
│  Skills installed: 0            │
│  MCP servers added: 0           │
│                                 │
├─────────────────────────────────╯
│
└  Kickstart complete!`.trim(),
  steering: `
│
◆  Select the additional steering 
│  files to generate:
│  ◻ structure.md
│  ◼ code-conventions.md (non-obvious
│    coding patterns to follow)
│  ◻ api-standards.md
│  ◻ testing-standards.md
│  ◼ security.md (security-sensitive
│    handling (auth, secrets, PII))
│  ◻ domain-glossary.md
│  ◻ deployment.md
└  ↑/↓ to navigate
    • Space: select 
    • Enter: confirm`.trim(),
  skills: `
│
◆  Select the skills to install:
│  ◼ skill-creator (create and 
│    iterate on new skills)
│  ◻ grill-me
│  ◼ find-skills (discover and
│    install new skills)
│  ◻ prototype
│  ◻ improve-codebase-architecture
└  ↑/↓ to navigate
    • Space: select
    • Enter: confirm`.trim(),
};

const outputButtons = document.querySelectorAll("[data-output-key]");
const terminalOutput = document.querySelector("#terminal-output");

if (terminalOutput instanceof HTMLElement) {
  const selectOutput = (button) => {
    const outputKey = button.dataset.outputKey;
    const output = exampleOutputs[outputKey];
    if (!output) return;

    terminalOutput.textContent = output;
    outputButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
  };

  outputButtons.forEach((button) => {
    button.addEventListener("click", () => selectOutput(button));
  });

  const initialButton = document.querySelector('[data-output-key="mcps"]');
  if (initialButton) selectOutput(initialButton);
}

const topicButton = document.querySelector("[data-topic-cycle]");
const topics = ["context", "skills", "MCPs"];

if (topicButton instanceof HTMLButtonElement) {
  const topicLabel = topicButton.querySelector(".topic-label");

  if (topicLabel instanceof HTMLSpanElement) {
    let topicIndex = 0;
    let topicTimer;
    let isAnimating = false;

    const cycleTopic = () => {
      if (isAnimating) return;

      isAnimating = true;
      topicIndex = (topicIndex + 1) % topics.length;
      topicLabel.classList.remove("is-entering");
      topicLabel.classList.add("is-exiting");
      window.clearInterval(topicTimer);
      topicTimer = window.setInterval(cycleTopic, 10_000);

      window.setTimeout(() => {
        topicLabel.textContent = topics[topicIndex];
        topicLabel.classList.remove("is-exiting");
        topicLabel.classList.add("is-entering");

        window.setTimeout(() => {
          topicLabel.classList.remove("is-entering");
          isAnimating = false;
        }, 240);
      }, 180);
    };

    topicTimer = window.setInterval(cycleTopic, 10_000);
    topicButton.addEventListener("click", cycleTopic);
  }
}
