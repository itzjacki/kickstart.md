# kickstart.md

## The short version

A tool that prepares your project for AI development with as little friction as possible. Simply run the following command:

```
kiro-cli chat "Go to https://kickstart.md/kickstart.md and execute the instructions found there."
```

_PS: Right now the tool follows Kiro's standard for steering file structure, but I'm hoping to change this soon, adding other tools' preferred structures as well. Why Kiro? Because the motivation for this project comes from me not wanting to manually scaffold a bunch of repos I use at work - where we use Kiro._

## The slightly longer version

Agentic AI Coding tools like Claude Code, Kiro and Cursor are way more effective if they're given a proper structure to operate in. This structure usually includes some steering documentation, skills and subagent specifications. By pointing your LLM at kickstart.md, it generates all of this stuff for you based on best pracices, the peculiarities of your particular project, and (some) user input.

This repo contains an initialization prompt (`kickstart.md`) which tells your agent about the most important steering docs, what they should focus on. It also comes with a bunch of templates for useful skills and subagents which should be useful in most projects.

## What does kickstart.md do?

When you run the prompt, the following things happen, in order:

### Step 1: Analysis and orientation

The agent looks around the repository to get a lay of the land. It will likely also ask you some clarifying questions about the stuff that's hard to figure out from just looking at the code.

### Step 2: Core steering files

The agent generates a fundamental set of steering files:

- `AGENTS.md`/`CLAUDE.md`: The contents of this file is sent along with every prompt you make in your agentic AI tool. Think of it as a system prompt.
- `product.md`: A non-technical description of your product. If your repository is a website, this describes the "business purpose" of the website.
- `tech.md`: A description of the tech stack used in the repository.
- `structure.md`: A description of the code structure and code conventions observed during the analysis phase.

### Step 3: Skill selection

The Agent selects skills from [the skills catalogue](/templates/skills/README.md) that it judges to be useful in your repository. This is purposefully designed to be conservative in its selection, in order to not bloat your project.

### Step 4: Subagent selection

The agent selects subagents to specify in your project, based on [the agent catalogue](/templates/agents/README.md). Like with skills, this prioritizes not bloating your project.

### Step 5: Optional steering files

The Agent determines if any more steering files would be useful in your repository. If your project is a set of APIs, it might suggest creating a steering file for API principles, for example.

## Who is this for?

The point of this project is not to create the perfect agentic AI setup. If you're already familiar with how to properly steer agentic AI, you will probably get better results from handcrafting something. The goal is to get you 90% of the way there for 10% of the effort.

I've purposefully designed kickstart.md to leave you with a setup which prefers to be too lean, rather than too bloated. I recommend manually adding to and tweaking the result as you get experience with how it works, but it should be good enough that you can leave it in peace if this sort of stuff doesn't interest you at all.
