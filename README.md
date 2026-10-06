# kickstart.md

## The short version

A CLI that prepares your project for AI-assisted development with as little friction as possible.

Run it inside the repository you want to set up:

```
npx kickstart.md
```

It analyzes your project, asks you a few plain-language questions, and writes a tailored set of steering files (`AGENTS.md` + a `.kiro/` directory), picks a conservative set of skills, and suggests MCP servers you can enable later.

Real runs require [`kiro-cli`](https://github.com/aws/kiro) on your `PATH` — kickstart.md drives the process by making focused, scoped calls to it, one per step.

_PS: Right now the tool follows Kiro's standard for steering file structure. I'm hoping to support other tools' preferred structures later. Why Kiro? Because the motivation for this project comes from me not wanting to manually scaffold a bunch of repos I use at work — where we use Kiro._

## The slightly longer version

Agentic AI coding tools like Claude Code, Kiro, and Cursor are far more effective when they're given a proper structure to operate in. That structure usually includes steering documentation, skills, and MCP configuration. kickstart.md generates this for you based on best practices, the peculiarities of your particular project, and a little user input.

Rather than handing your agent one big prompt and hoping it runs end-to-end, kickstart.md is a script that drives the process: it makes multiple, focused calls to `kiro-cli` — one per step (analyze, ask questions, generate steering files, recommend skills, suggest MCP servers) — and runs its own logic and asks you plain-language questions in between. The result is a predictable, installer-style experience that tells you what it's going to do, shows progress as it goes, and summarizes what it created.

This repo also ships a set of skill templates that are useful in most projects.

## Installation and usage

kickstart.md is a Node CLI (Node ≥ 24). The easiest way to run it is with `npx`, which requires no install:

```
npx kickstart.md
```

Run it from inside the repository you want to kickstart.

### Options

```
-h, --help    Show usage.
-m, --mock    Mock mode: skip all LLM calls and use pre-made example outputs
              (for development/testing without kiro-cli).
-d, --debug   Debug mode: show extra diagnostics.
```

### Environment variables

- `KICKSTART_MOCK` — set to `true` to enable mock mode.
- `KICKSTART_DEBUG` — set to `true` to enable debug mode.

### Requirements

- Node ≥ 24.
- `kiro-cli` on your `PATH`.

## What does kickstart.md do?

When you run it, the following steps happen in order:

### 1. Analyze the codebase

The tool looks around the repository to get a lay of the land — languages, frameworks, build/test/lint tooling, and conventions — and produces an analysis it uses to steer the rest of the run.

### 2. Ask you a few questions

Based on the analysis, the tool decides which plain-language questions would fill the gaps that are hard to figure out from the code alone, and asks them one at a time.

### 3. Generate the mandatory steering files

A small, mandatory set of steering files is always generated:

- `AGENTS.md` — loaded into context on every turn in your agentic AI tool. Think of it as a project-specific system prompt: project context plus agent constraints.
- `.kiro/steering/product.md` — a non-technical description of what the project is, its users, and its purpose.
- `.kiro/steering/tech.md` — the tech stack, plus build/test/lint commands.

### 4. Recommend and generate additional steering files

The tool recommends situational steering files when it judges them useful — for example `structure.md` for an unusual layout, or API/testing standards files — each with a reason. You confirm or adjust the selection, and the chosen files are generated.

### 5. Recommend and install skills

The tool selects skills it judges useful for your repository, you confirm the selection, and they're installed into `.kiro/skills/`. The selection is deliberately conservative to avoid bloating your project.

### 6. Suggest MCP servers

The tool suggests MCP servers relevant to your project that you can enable later.

### 7. Summary

Finally, it reports everything it created and installed.

## Less is more

Generated steering loads into the agent's context on every turn, so kickstart.md deliberately prefers a lean setup over a comprehensive one. It includes only non-discoverable information, avoids duplicating what the linter or the code already enforces, and omits anything it isn't sure about. Only `AGENTS.md`, `product.md`, and `tech.md` are mandatory; everything else is situational.

## Who is this for?

The point of this project is not to create the perfect agentic AI setup. If you're already familiar with how to properly steer agentic AI, you'll probably get better results handcrafting something. The goal is to get you 90% of the way there for 10% of the effort.

kickstart.md is intentionally designed to leave you with a setup that errs on the side of too lean rather than too bloated. I recommend tweaking and adding to the result as you get a feel for how it works, but it should be good enough to leave in peace if this sort of thing doesn't interest you at all.
