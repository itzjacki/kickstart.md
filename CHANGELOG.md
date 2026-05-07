# Changelog

This changelog is designed to be read by the `update-kickstart` skill. Each version entry lists what was added, changed, or removed so the skill can apply updates to target repos.

## v1

Initial release.

### ADDED

- `AGENTS.md` generation with `<!-- kickstart v1 -->` version stamp
- `.kiro/steering/product.md` — project purpose, users, features, business context
- `.kiro/steering/tech.md` — languages, frameworks, dev tools, infrastructure
- `.kiro/steering/structure.md` — directory layout, naming, module organization
- `.kiro/steering/code-conventions.md` (conditional) — observed coding patterns
- `.kiro/steering/api-standards.md` (conditional) — API conventions
- `.kiro/steering/testing-standards.md` (conditional) — testing patterns
- `.kiro/skills/update-kickstart/SKILL.md` — skill to update steering docs on new versions
