---
name: skill-creator
description: Create new skills from scratch or improve existing ones. Use when users want to create a skill, edit a skill, or iterate on a skill's quality. Trigger this whenever the user mentions making, building, drafting, or improving a skill.
---

# Skill Creator

Help users create and iterate on skills. The core loop is:

1. Understand what the skill should do
2. Write the SKILL.md
3. Test it with a few prompts (with-skill AND baseline)
4. Evaluate results with the user — qualitative review + optional assertions
5. Improve based on feedback
6. Repeat until the user is happy

A skill is NOT complete until it has been through at least one test-and-evaluate cycle (steps 3-4). Never skip from step 2 to packaging. After writing the draft, you must proceed to testing — do not present the skill as finished or summarize it as "done" until the user has reviewed test results and confirmed they're satisfied.

## Capturing Intent

Figure out what the user wants. If the conversation already contains a workflow they want to capture, extract from context first. Key questions:

1. What should this skill enable the agent to do?
2. When should it trigger? (what user phrases/contexts)
3. What's the expected output format?

Ask about edge cases, input/output formats, and success criteria before writing.

## Writing the SKILL.md

### Structure

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Optional resources/
    ├── scripts/    - Deterministic/repetitive tasks
    ├── references/ - Docs loaded as needed
    └── assets/     - Templates, files used in output
```

### Frontmatter

- **name**: Skill identifier
- **description**: Primary triggering mechanism. Include what the skill does AND specific contexts for when to use it. Be slightly "pushy" — err toward triggering rather than not. Example: instead of "Build dashboards", write "Build dashboards for displaying data. Use whenever the user mentions dashboards, data visualization, metrics, or displaying any kind of data."

**Validation constraints:**

- Allowed frontmatter keys: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`. Anything else will fail validation.
- `name`: required, kebab-case only (lowercase, digits, hyphens), max 64 characters, no leading/trailing/consecutive hyphens.
- `description`: required, max 1024 characters, no angle brackets (`<` or `>`).
- `compatibility`: optional, max 500 characters.

### Writing Guidelines

- Use imperative form for instructions
- Explain **why** things matter rather than piling on MUSTs and NEVERs
- Keep SKILL.md under 500 lines; offload detail to reference files
- Include examples of expected input/output where helpful
- Make instructions general, not overfitted to specific examples
- If you find yourself writing rigid rules, reframe as reasoning the model can internalize

### Example patterns

**Output format:**

```markdown
## Report structure

Use this template:

# [Title]

## Summary

## Findings

## Recommendations
```

**Examples:**

```markdown
## Commit message format

Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

## Testing

After writing the skill draft, create 3+ realistic test prompts — things a real user would say. Share them with the user for confirmation, then run them.

### Writing good test prompts

The point of testing is to find out where the skill breaks, not to confirm it works. Design test prompts that exercise different aspects of the skill:

- **Typical cases** — the bread-and-butter usage you expect most often
- **Edge cases** — unusual inputs, ambiguous instructions, large/small scope
- **Adversarial cases** — situations where the skill might do the wrong thing (over-edit, hallucinate, ignore constraints, do too much, do too little)
- **Constraint tests** — prompts that specifically test the skill's "don't do X" instructions, not just its "do Y" instructions

A test suite that only contains happy-path prompts will tell you nothing useful. Include prompts where you genuinely don't know how the skill will perform — those are the most informative.

### Always run baselines

For each test case, run two versions:

- **With-skill**: the agent uses the skill to complete the task
- **Baseline**: the same prompt without the skill (or with the old version if improving an existing skill)

This is the only way to know if the skill is actually helping. Without a baseline, you're guessing.

If subagents are available, spawn both runs in parallel. If not, run them sequentially.

### Workspace organization

All test workspaces must be created inside the current working directory (e.g., `./skill-name-workspace/`). Never create workspaces outside the project root or in absolute paths like `/tmp`.

```
skill-name-workspace/
└── iteration-1/
    ├── eval-descriptive-name/
    │   ├── with_skill/outputs/
    │   └── without_skill/outputs/   (or old_skill/ if improving)
    └── eval-another-case/
        ├── with_skill/outputs/
        └── without_skill/outputs/
```

### Assertions (optional)

For skills with objectively verifiable outputs (file transforms, data extraction, structured generation), write assertions — simple pass/fail checks you can evaluate against the outputs. Skip these for subjective skills (writing style, creative work) where human judgment is the only meaningful evaluation.

Write assertions that are genuinely discriminating — they should be hard to pass without actually doing the task correctly. An assertion like "output file exists" is nearly useless; an assertion like "output file contains the correct values from the input, not hallucinated ones" tests real behavior.

Also write assertions that test constraints — things the skill should NOT do. If the skill says "don't create new files" or "don't modify unrelated sections," write assertions that verify those constraints hold.

Save assertions alongside the test cases:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "assertions": [
        {
          "text": "Output contains a valid JSON array",
          "type": "content_check"
        }
      ]
    }
  ]
}
```

Where possible, verify assertions programmatically (write a quick script) rather than eyeballing.

### Timing awareness

Note token usage and duration when runs complete. If the with-skill version uses dramatically more tokens for similar quality, the skill may be causing unproductive work — look for instructions that send the model down rabbit holes.

## Evaluating Results

Do not evaluate outputs yourself. Use the reference tools — they exist to prevent you from eyeballing results and declaring "looks good."

### Step 1: Blind comparison (required)

For each test case, use the **comparator** (`references/comparator.md`) to judge with-skill vs baseline. Spawn a subagent and tell it to read `references/comparator.md` and follow those instructions exactly — do not paraphrase or summarize the spec into the prompt.

### Step 2: Analysis (required)

After comparison, use the **analyzer** (`references/analyzer.md`, mode 1) to unblind the results — it reads both skills and transcripts to explain why the winner won and generate prioritized improvement suggestions.

### Step 3: Grading assertions (if defined)

If assertions were defined, use the **grader** (`references/grader.md`) to evaluate them against outputs. Spawn a subagent and tell it to read `references/grader.md` and follow those instructions exactly.

### Step 4: Present to user

Only after running the comparator and analyzer, present the results to the user. Include:

- The comparator's verdict for each test case
- The analyzer's explanation of why the winner won (or why it was a tie)
- Any improvement suggestions the analyzer surfaced

Ask for feedback.

## Benchmark Analysis (optional)

When running multiple test cases across iterations, use the **analyzer** (`references/analyzer.md`, mode 2) to surface patterns the aggregate stats hide — non-discriminating assertions, flaky evals, time/token tradeoffs, and outliers.

## Reference Files

The `references/` directory contains instructions for specialized evaluation tasks. When you need to use one, tell the subagent to read the file and follow it — do not paraphrase or summarize the contents into the subagent prompt. The reference files are written to be used directly.

| Reference  | File                       | When to use                                             |
| ---------- | -------------------------- | ------------------------------------------------------- |
| Grader     | `references/grader.md`     | Evaluating assertions against outputs after test runs   |
| Comparator | `references/comparator.md` | Blind A/B comparison between two outputs                |
| Analyzer   | `references/analyzer.md`   | Post-comparison analysis OR benchmark pattern detection |

Example subagent prompt:

```
Read the grader instructions at [path]/references/grader.md and follow them exactly.

Inputs:
- expectations: [list]
- outputs_dir: [path]
```

## Iterating

After reviewing test results with the user:

1. **Generalize** — don't overfit to test cases. The skill will be used on many different prompts.
2. **Stay lean** — remove instructions that aren't pulling their weight. Read the transcripts, not just outputs — if the skill makes the model waste time on unproductive steps, cut those instructions.
3. **Explain the why** — if something keeps going wrong, add reasoning rather than rigid rules.
4. **Bundle repeated work** — if test runs all independently write similar helper scripts, bundle that script in the skill.
5. **Expand test coverage** — after each iteration, consider adding new test prompts that target weaknesses you discovered. The test suite should grow to cover more ground, not just re-confirm the same cases.

Apply improvements, rerun tests into a new `iteration-N/` directory (always including baselines), review again. Repeat until the user is satisfied or feedback is empty.

## Packaging

The skill directory itself is the deliverable.

Once the user confirms they're satisfied with the skill, delete the test workspace directory (e.g., `./skill-name-workspace/`). Don't ask — just clean it up. The files in the skill directory are the only artifacts that should remain.
