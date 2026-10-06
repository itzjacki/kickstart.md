import { text, note, isCancel, cancel } from "@clack/prompts";
import { prompt } from "../prompt.ts";
import { ASK_QUESTIONS_MOCK } from "../mock.ts";

export interface Question {
  /** Stable identifier the agent assigns to the question. */
  id: string;
  /** The plain-language question shown to the user. */
  question: string;
  /** Short rationale for why this question is being asked (not shown as the prompt). */
  why?: string;
}

export interface AnsweredQuestion extends Question {
  answer: string;
}

export interface AskQuestionsResult {
  /** The questions the agent decided to ask, with the user's answers. */
  answered: AnsweredQuestion[];
  /**
   * A text artifact summarizing the Q&A, written for consumption by later
   * stages (steering-file generation). Empty string when nothing was asked.
   */
  artifact: string;
}

/**
 * First half of the questions step: let the agent decide which plain-language
 * questions to put to the user — primarily to fill the product/domain gaps the
 * code can't reveal.
 *
 * This is a non-interactive agent call (it can hang for a while with no visible
 * output), so the entry point runs it inside a spinner `tasks()` block. It is
 * kept separate from {@link askQuestions} precisely so the spinner wraps only
 * this call and never the interactive prompting that follows.
 */
export const decideQuestions = async (
  analysis: string,
): Promise<Question[]> => {
  const raw = await prompt({
    promptString: buildDecisionPrompt(analysis),
    mockOutput: ASK_QUESTIONS_MOCK,
  });

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      questions?: Array<Partial<Question>>;
    };

    if (!Array.isArray(parsed.questions)) {
      return [];
    }

    return parsed.questions
      .filter(
        (q): q is Question =>
          typeof q?.question === "string" && q.question.trim().length > 0,
      )
      .map((q, i) => {
        const base: Question = {
          id: typeof q.id === "string" && q.id.trim() ? q.id.trim() : `q${i + 1}`,
          question: q.question.trim(),
        };
        const why = typeof q.why === "string" ? q.why.trim() : "";
        return why ? { ...base, why } : base;
      });
  } catch {
    return [];
  }
};

/**
 * Second half of the questions step: ask the pre-decided questions
 * interactively, one at a time, and return the collected answers as a text
 * artifact for later stages.
 *
 * Interactive (`@clack/prompts` `text`), so this MUST run outside any spinner
 * `tasks()` block — clack prompts hang inside one.
 */
export const askQuestions = async (
  questions: Question[],
): Promise<AskQuestionsResult> => {
  if (questions.length === 0) {
    return { answered: [], artifact: "" };
  }

  note(
    `I have a few questions about your project that I couldn't answer from the code alone.\nI'll ask them one at a time (${questions.length} total). Press enter to skip any you'd rather not answer.`,
    "A few questions",
  );

  const answered: AnsweredQuestion[] = [];

  for (const [index, question] of questions.entries()) {
    const answer = await text({
      message: `(${index + 1}/${questions.length}) ${question.question}`,
      placeholder: "Type your answer, or press enter to skip",
    });

    if (isCancel(answer)) {
      cancel("Question step cancelled.");
      throw new Error("Question step cancelled by user.");
    }

    const trimmed = (answer ?? "").trim();
    if (trimmed.length > 0) {
      answered.push({ ...question, answer: trimmed });
    }
  }

  return { answered, artifact: buildArtifact(answered) };
};

/** Renders answered questions into the text artifact later stages consume. */
const buildArtifact = (answered: AnsweredQuestion[]): string => {
  if (answered.length === 0) {
    return "";
  }

  const body = answered
    .map((qa) => `### ${qa.question}\n${qa.answer}`)
    .join("\n\n");

  return `# User answers\n\nPlain-language answers the user gave to questions the codebase could not resolve. Treat these as authoritative statements about the product, its domain, and its constraints.\n\n${body}`;
};

const buildDecisionPrompt = (analysis: string): string =>
  `
## Your task: decide which questions to ask the user

This is the questions stage of kickstart.md. The previous stage analyzed the
repository and produced the analysis artifact below. Your sole job in this call
is to decide which plain-language questions should be put to the user to fill in
what the code could not reveal. Do NOT answer the questions yourself, do NOT
generate steering files, and do NOT perform work from other stages. Output only
the question list in the specified format.

### Why this stage exists

Reading code tells you HOW the project is built, but not WHAT it is for or WHY it
exists. The product's purpose, its users, and its domain generally cannot be
inferred from code alone — assuming them leads to wrong steering docs. This stage
closes that gap by asking the person who actually knows.

### How to choose questions

- The analysis marks things it could not determine as \`unknown\`. Use those
  markers as your primary signal for what is worth asking about.
- Make an ACTIVE decision for every question. Do not ask a question just because
  it appears in the suggestion list below. Only ask something when the answer is
  genuinely missing from the analysis AND would change the steering docs that get
  generated. If the analysis already answers something, do not ask about it.
- Prefer a short, high-signal set of questions over an exhaustive interrogation.
  The user should feel this is quick. When in doubt, leave a question out — with
  the two exceptions below.

### Suggested topics (NOT exhaustive, NOT mandatory)

The following are examples of things that are often unclear from code. Treat them
as prompts for your own judgement, not a checklist. Some may already be answered
by the analysis (skip those); others not listed here may be worth asking about
for this particular repo (add those). Rephrase freely into plain language.

- What the project does and who it is for.
- Key business goals, constraints, or deadlines that affect how code is written.
- Which parts of the codebase are most active or most important.
- Domain-specific rules or vocabulary that affect how code should be written.
- The intended technical direction — the kind of code the project wants to move
  toward, above the level of individual conventions (e.g. a preferred
  architectural approach or default). This is worth asking because existing code
  is usually a mix of old and new patterns; the "north star" is a deliberate
  choice the code cannot reveal, and should not be guessed from the repo.
- Anything surprising or non-obvious about how the project is meant to work.

### Mandatory questions (always include these)

- Off-limits areas: always ask whether there are any files, directories, or
  actions that must not be changed without explicit human approval. This is the
  one topic you must always raise regardless of the analysis.
- Product/project gap-fillers: whenever the analysis leaves the product's
  purpose, users, or domain as \`unknown\` (or only weakly evidenced), you MUST
  ask whatever plain-language questions are needed to fill that gap. Never guess
  the product story to avoid asking.
- Reconciling existing AI setup: if the analysis shows the repo ALREADY has AI
  steering docs, skills, or related config (e.g. an existing \`AGENTS.md\` /
  \`CLAUDE.md\`, a \`.kiro/\` directory, rules files, or similar — see the
  analysis's existing-docs/AI-tooling findings), you MUST ask the user how they
  want the new setup to coexist with it: replace the old entirely, merge the two,
  or leave specific existing files untouched. Do not silently overwrite or
  duplicate the user's existing work. Only ask this when such pre-existing setup
  is actually detected; skip it for a repo with no prior AI tooling.

### Writing style for questions

- Plain language only. The user knows their project but may know nothing about AI
  tooling, steering docs, or this tool. Never use jargon like "steering",
  "artifact", "repo analysis", or tool names. (Exception: the reconciliation
  question above may name concrete existing files/directories the user already
  has, e.g. "your existing \`AGENTS.md\`", since the user needs to know what is
  being referred to — but still phrase the choice itself plainly, e.g. "keep,
  replace, or combine".)
- One idea per question — these are asked one at a time, so keep each self-
  contained and answerable in a sentence or two.
- Phrase as direct questions a non-technical stakeholder could answer.

### Output format

Return ONLY a JSON object, no prose before or after:

{
  "questions": [
    { "id": "short-stable-id", "question": "The plain-language question.", "why": "Terse reason this is being asked (which gap it fills)." }
  ]
}

- \`id\`: short kebab-case identifier (e.g. "product-purpose", "off-limits").
- \`question\`: the exact text shown to the user.
- \`why\`: one terse clause naming the gap it fills (internal only; not shown).
- Order questions from most to least important.
- If — and only if — the analysis genuinely leaves no product/domain gaps, still
  return the single mandatory off-limits question.

### Analysis artifact

${analysis.trim() || "(no analysis provided)"}
`.trim();
