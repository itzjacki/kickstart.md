const copyButton = document.querySelector("[data-copy-command]");

if (copyButton instanceof HTMLButtonElement) {
  copyButton.addEventListener("click", async () => {
    const command = copyButton.dataset.copyCommand;
    if (!command) return;

    try {
      await navigator.clipboard.writeText(command);
      copyButton.textContent = "Copied ✅";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);
    } catch {
      copyButton.textContent = "Select to copy";
    }
  });
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
