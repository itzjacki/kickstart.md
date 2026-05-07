---
name: update-kickstart
description: Update AI steering docs and skills when a new kickstart version is available. Use when the user wants to update their AI tooling setup, or when checking if steering docs are current.
---

# Update Kickstart

Update this repository's AI steering docs and tooling to the latest kickstart version.

## How to use

The user invokes this skill when they want to check for or apply updates to their AI steering setup.

## Procedure

1. **Read current version** — find the `<!-- kickstart vN -->` comment in `AGENTS.md` to determine which version was used.

2. **Read the changelog** — fetch or read `CHANGELOG.md` from the kickstart repo to see what changed since the current version.

3. **Show the user what changed** — summarize the relevant changelog entries in plain language:
   > Your steering docs were generated with kickstart v1. The latest is v3. Here's what changed:
   > - v2: Added testing-standards steering file, updated default agent config
   > - v3: Deprecated X skill, added Y skill, changed structure.md format

4. **Ask for confirmation** — before making changes:
   > Want me to apply these updates? I'll preserve any manual edits you've made to the steering files.

5. **Apply changes** — for each changelog entry between current and latest:
   - **ADDED** items: generate the new file/section
   - **CHANGED** items: update the relevant file, merging with any manual edits
   - **DEPRECATED/REMOVED** items: remove the file/section (confirm with user first if it was manually edited)

6. **Update version stamp** — change `<!-- kickstart vN -->` in `AGENTS.md` to the new version.

7. **Report** — summarize what was updated.

## Important

- Never overwrite manual edits without asking.
- If a file was manually edited AND the update would change it, show the user both versions and ask which to keep (or how to merge).
- If the changelog references a new skill or agent template, fetch it from the kickstart repo's `templates/` directory.
