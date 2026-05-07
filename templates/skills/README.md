# Skills Catalog

This directory contains skill templates that the kickstart prompt installs in target repos. Each skill is a folder with a `SKILL.md` file (and optional `references/` directory).

The kickstart prompt reads this catalog to decide which skills to install based on what it detects in the target repo.

> **Note:** This catalog is still growing. If no conditional skills match, just continue with the always-included ones — the process works fine with only those.

## Always included

| Skill | Description | Customization |
|-------|-------------|---------------|
| `update-kickstart` | Update steering docs and skills when a new kickstart version is available. Reads the target repo's current version, diffs against the changelog, and applies relevant changes. | Fill in the path/URL to the kickstart repo. |

## Conditional

| Skill | Include when | Description | Based on | Customization |
|-------|-------------|-------------|----------|---------------|
| *(to be added)* | | | | |

<!-- 
Template for adding new entries:

| `skill-name` | [detection criteria] | [what it does] | [source URL or "original"] | [what to customize per-repo] |
-->

## Adding a new skill

1. Create a folder: `templates/skills/[skill-name]/`
2. Add `SKILL.md` with valid frontmatter (`name` and `description` fields)
3. Optionally add a `references/` directory for supporting docs
4. Add an entry to this catalog with: description, inclusion criteria, source/attribution, and customization notes
