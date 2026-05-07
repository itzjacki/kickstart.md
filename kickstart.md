# Kickstart v1

> This file is hosted at `https://raw.githubusercontent.com/itzjacki/kickstart.md/refs/heads/main/kickstart.md`.

> **This prompt is designed for Kiro.** If you're running in a different tool (Claude Code, Cursor, Copilot, etc.), stop here — the artifacts it generates are Kiro-specific and won't be useful elsewhere.

You are bootstrapping AI steering docs and tooling for this repository. Follow these instructions step by step.

## Before you begin

Read the template catalogs to understand what's available:
- `https://raw.githubusercontent.com/itzjacki/kickstart.md/refs/heads/main/templates/skills/README.md` — available skills and when to include them

To fetch an individual template, use the same base URL. For example:
- `https://raw.githubusercontent.com/itzjacki/kickstart.md/refs/heads/main/templates/skills/update-kickstart/SKILL.md`

The `CHANGELOG.md` (for the update-kickstart skill) is at:
- `https://raw.githubusercontent.com/itzjacki/kickstart.md/refs/heads/main/CHANGELOG.md`

## Step 1: Announce the plan

Tell the user what you're about to do:

> I'm going to analyze this repository and set up AI steering docs and tooling (Kiro-native). Here's what I'll generate:
>
> **Always:**
> - `AGENTS.md` — project context and working guidelines
> - `.kiro/steering/product.md` — what this project is
> - `.kiro/steering/tech.md` — tech stack and tooling commands
> - `.kiro/steering/structure.md` — how the code is organized
> - `.kiro/skills/` — relevant workflow skills
>
> **Possibly (I'll check if they're relevant):**
> - `.kiro/steering/code-conventions.md` — observed coding patterns
> - `.kiro/steering/api-standards.md` — API conventions
> - `.kiro/steering/testing-standards.md` — testing patterns
>
> I'll analyze the repo first, ask you some questions about the project, then generate everything. Ready to go, or do you have any questions first?

**Stop here and wait for the user to respond before continuing.**

## Step 2: Analyze the repository

Investigate the target repo thoroughly. Gather:

1. **Languages & frameworks** — check file extensions, package manifests (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, etc.)
2. **Build/test/lint commands** — read config files, CI workflows (`.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`), Makefiles, scripts
3. **Directory structure** — understand the layout, identify source dirs, test dirs, config dirs, generated/build output dirs
4. **Existing docs** — check for README, CONTRIBUTING, existing AGENTS.md, architecture docs
5. **Conventions** — sample several source files to identify naming patterns, error handling style, import organization, component structure
6. **API surface** — check for route definitions, OpenAPI specs, GraphQL schemas
7. **Testing** — identify test framework, test file locations, coverage config
8. **Infrastructure** — Docker, Terraform, CDK, serverless configs, deploy scripts
9. **Git history** — check branch naming, commit message patterns if accessible
10. **Sensitive areas** — identify files/dirs that should not be modified without human approval (migrations, infra, auth, CI config)

## Step 3: Ask about the product

After analyzing the code, ask the user about anything you couldn't confidently determine from the codebase alone. This is critical — do NOT assume you understand the product, its users, or its domain just from reading code.

Things you should ask about if unclear:
- What the project does and who it's for
- Key business goals or constraints
- Which parts of the codebase are most active or important
- Anything domain-specific that affects how code should be written
- Areas that are sensitive or off-limits

Keep questions plain-language. The user knows their project — they don't need to know anything about AI tooling. Ask in a batch (not one at a time) to minimize back-and-forth.

**The "friction-free" principle applies to AI tooling decisions, NOT to understanding the product. Always ask rather than guess about the application and its domain.**

## Step 4: Generate mandatory files

Generate the following. These are always created.

### .kiro/steering/product.md
```markdown
# Product

## What this project is
[One paragraph describing the project's purpose]

## Target users
[Who uses this — developers, end users, internal team, etc.]

## Key features
[Bullet list of main capabilities]

## Business context
[Any relevant context about why this exists, constraints, goals]
```

### .kiro/steering/tech.md
```markdown
# Technology Stack

## Languages
[List with versions if detectable]

## Frameworks & libraries
[Key dependencies — not an exhaustive list, just the important ones]

## Development tools
- Build: [command]
- Test: [command]
- Lint: [command]
- Format: [command]

## Infrastructure
[Docker, cloud services, CI/CD — whatever is relevant]

## Key constraints
[Version requirements, platform targets, compatibility notes]
```

### .kiro/steering/structure.md
```markdown
# Project Structure

## Directory layout
[Tree or description of top-level organization]

## Key directories
[What lives where — source, tests, config, docs, scripts, etc.]

## File naming conventions
[Observed patterns]

## Import/module organization
[How code is organized into modules/packages]
```

### AGENTS.md (repo root)
```markdown
# AGENTS.md

<!-- kickstart v1 -->

## Project overview
[2-3 sentences: what this is, what it does, who it's for]

## Quick reference
- Build: `[command]`
- Test: `[command]`
- Lint: `[command]`
- Format: `[command]`

## Working guidelines
[Key procedures the AI should always follow — e.g.:]
- Run tests before committing changes
- Do not modify migration files without explicit approval
- Follow existing patterns when adding new [components/modules/endpoints]
- [Other project-specific guidelines]

## Off-limits (require human approval)
- [List files/directories/actions that need explicit user confirmation]
```

Keep AGENTS.md concise. Detailed information belongs in the steering files.

### Skills from templates

Read the template catalogs and install:
- **Always:** `update-kickstart` skill
- **Conditional:** any other skills whose inclusion criteria are met

Customize installed templates with project-specific values (commands, paths, conventions).

## Step 5: Propose conditional files

Before generating conditional steering files, tell the user what you plan to include or skip:

> Based on my analysis, here's what I'm thinking for the optional steering files:
>
> **Will generate:**
> - `code-conventions.md` — [short reason, e.g., "I found consistent patterns in naming and error handling across 15+ files"]
> - `testing-standards.md` — [short reason, e.g., "You have a Jest test suite with clear fixture patterns"]
>
> **Skipping:**
> - `api-standards.md` — [short reason, e.g., "No API routes or endpoint definitions found"]
>
> Does this look right, or would you like me to add or skip any of these?

**Stop here and wait for the user to confirm or adjust before continuing.**

## Step 6: Generate conditional files

Based on the user's confirmation, generate the applicable files:

**code-conventions.md** — if you observed clear, consistent patterns across multiple files:
- Naming conventions (variables, functions, files)
- Error handling patterns
- Component/module structure patterns
- Import ordering

**api-standards.md** — if the project exposes APIs:
- Endpoint naming patterns
- Request/response formats
- Error response structure
- Authentication approach

**testing-standards.md** — if tests exist:
- Test file organization
- Naming conventions for tests
- Mocking/fixture patterns
- What's expected to be tested

## Step 7: Report

Summarize what was generated:

> **Kickstart complete!** Here's what I set up:
>
> **Steering files:**
> - `.kiro/steering/product.md` — [one-line summary]
> - `.kiro/steering/tech.md` — [one-line summary]
> - `.kiro/steering/structure.md` — [one-line summary]
> - [any conditional files]
>
> **Skills:**
> - `.kiro/skills/update-kickstart/` — update steering docs when kickstart versions change
> - [any additional skills]
>
> **Root:**
> - `AGENTS.md` — project context and working guidelines
>
> These files are ready to commit. The steering docs will be loaded automatically in future Kiro sessions.
>
> To update these docs later when a new kickstart version is available, use the `/update-kickstart` skill.

## Guidelines

- **Lean over bloated.** Only generate what's genuinely useful. If you don't have enough signal for a conditional file, skip it.
- **Facts over prescriptions.** Document what IS, not what SHOULD BE. Conventions are observed patterns, not invented rules.
- **Ask about the product.** Never assume you understand the application, its users, or its domain. The code tells you *how* — the user tells you *what* and *why*.
- **Plain language.** Any questions to the user should be understandable without AI/tooling knowledge.
- **Don't guess.** If you can't determine something from the code, ask or omit it. Don't fabricate.
- **Respect existing work.** If the repo already has an AGENTS.md or steering files, ask the user whether to merge, replace, or skip.
