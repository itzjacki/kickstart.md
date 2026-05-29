# Skills Catalog

This directory contains skill templates that the kickstart prompt installs in target repos. Each skill is a folder with a `SKILL.md` file (and optional supporting files).

The kickstart prompt reads this catalog to decide which skills to install based on what it detects in the target repo.

## Skills

| Skill | Include when | Description | Based on | Extra files | Customization |
| --- | --- | --- | --- | --- | --- |
| `update-kickstart` | Always | Update steering docs and skills when a new kickstart version is available. Reads the target repo's current version, diffs against the changelog, and applies relevant changes. | Original | — | Fill in the path/URL to the kickstart repo. |
| `update-steering` | Always | Update AI steering docs after codebase changes. Checks git history, identifies stale docs, and applies targeted edits. | Original | — | Adjust which steering file paths to check if non-standard layout. |
| `skill-creator` | Always | Create new skills from scratch or improve existing ones. Guides through writing, testing, evaluating, and iterating on skills. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | — | None. |
| `grill-me` | Always | Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. | [mattpocock/skills](https://github.com/mattpocock/skills) | — | None. |
| `find-skills` | Always | Helps users discover and install agent skills when they ask about extending capabilities or finding functionality. | [vercel-labs/skills](https://github.com/vercel-labs/skills) | — | None. |
| `prototype` | Always | Build a throwaway prototype to flesh out a design — routes between a runnable terminal app for logic questions or multiple UI variations for design exploration. | [mattpocock/skills](https://github.com/mattpocock/skills) | `UI.md`, `LOGIC.md` | None. |
| `improve-codebase-architecture` | Always | Find deepening opportunities in a codebase — consolidate tightly-coupled modules, improve testability, and make the codebase more AI-navigable. | [mattpocock/skills](https://github.com/mattpocock/skills) | `LANGUAGE.md`, `HTML-REPORT.md`, `DEEPENING.md`, `INTERFACE-DESIGN.md` | None. |

<!--
Template for adding new entries:

| `skill-name` | [detection criteria] | [what it does] | [source URL or "original"] | [extra files or —] | [what to customize per-repo] |
-->

## Installing skills with extra files

Some skills include supporting files beyond `SKILL.md` (listed in the "Extra files" column). When installing a skill, copy **all** files from its template directory — not just `SKILL.md`. These extra files are dependencies that the skill references at runtime.

## Adding a new skill

1. Create a folder: `templates/skills/[skill-name]/`
2. Add `SKILL.md` with valid frontmatter (`name` and `description` fields)
3. Optionally add supporting files (referenced by the skill at runtime)
4. Add an entry to this catalog with: description, inclusion criteria, source/attribution, extra files, and customization notes
