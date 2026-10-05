import { prompt } from "../prompt.ts";

export const analyzeCodebase = async () => {
  const analysisResult = await prompt({ promptString: analysisPrompt });
  return analysisResult;
};

const analysisPrompt = `
  ## Your task: analyze this repository

  This is the analysis stage of kickstart.md. Your sole job in this call is to
  investigate the repository and produce a single structured analysis of it.
  Do NOT generate steering files, do NOT ask the user anything, and do NOT perform
  work from later stages — only analyze and report.

  Your output is an internal artifact. It is written FOR an AI agent and will be
  consumed by later automated stages (generating steering docs, choosing which
  questions to ask the user, selecting skills). It will NOT be read by a human.
  Therefore:

  - Write dense, factual, agent-oriented notes. Skip introductions, narration,
    praise, and conclusions.
  - Record observations as facts about what IS, not recommendations about what
    SHOULD be. No style advice, no editorializing.
  - Be concrete: cite file paths, exact command strings, dependency names, and
    version numbers you actually found.
  - Never fabricate. If something is present, report it with evidence. If it is
    absent or cannot be determined from the repository, mark it explicitly as
    \`unknown\` and, where useful, note why (e.g. "no package manifest found").
    These \`unknown\` markers are important — a later stage uses them to decide what
    to ask the user.

  ### What to investigate

  Gather evidence on each of the following. Prefer reading manifests, config, and
  representative source files over guessing.

  1. Languages & runtimes — from file extensions and manifests (package.json,
     Cargo.toml, pyproject.toml, go.mod, pom.xml, build.gradle, Gemfile, etc.);
     include detected version/engine constraints.
  2. Frameworks & key libraries — the important ones that shape how code is
     written, not an exhaustive dependency dump.
  3. Build / test / lint / format commands — the actual invocations, read from
     scripts, task runners, Makefiles, and CI config.
  4. Directory structure — top-level layout; identify source, test, config, docs,
     and generated/build-output directories.
  5. Existing docs & AI tooling — README, CONTRIBUTING, architecture docs, and any
     pre-existing AGENTS.md / CLAUDE.md / .kiro/ or other steering setup already in
     the repo.
  6. Observed conventions — sample several source files for naming patterns, error
     handling, import organization, and module/component structure. Report only
     patterns that recur across multiple files; note how consistent they are.
  7. API surface — route definitions, OpenAPI/GraphQL schemas, RPC definitions, if
     any.
  8. Testing — framework, test file locations/naming, fixtures/mocks, coverage
     config, if any.
  9. Infrastructure & deployment — Docker, Terraform/CDK/Pulumi, serverless, CI/CD
     pipelines, deploy scripts, if any.
  10. Version control signals — branch naming and commit-message patterns, if
      determinable from available history.
  11. Sensitive / off-limits areas — files or directories that typically need
      human approval before changes (migrations, infra-as-code, auth, secrets,
      generated code, CI config).
  12. Product signals — any evidence in the repo of what the project does and who
      it is for. Report only what the code and docs actually show; treat the
      product's purpose, users, and domain as \`unknown\` where the repository does
      not make them clear. (Do not infer a product story from code alone.)

    ### Output format

  Produce a single Markdown document for a downstream AI agent to read. This output
  is never read by a human, so ignore readability, formatting aesthetics, and
  natural phrasing entirely. Optimize for one thing: maximum information in minimum
  tokens.

  - Be as short as possible without dropping information. Every token must carry a
    fact. Cut all filler: no articles, no full sentences, no narration, no
    intro/summary/recommendations. Telegraphic style is expected
    (e.g. \`build: npm run build (package.json)\`, not
    \`The build command is npm run build, defined in package.json\`).
  - Use the exact section headings listed below, in this order, every time. Do not
    add, rename, reorder, or omit sections. If a section has no findings, keep the
    heading and write \`unknown\` or \`none\` under it.
  - Under each heading, write one fact per line as \`label: value\`. Compress freely:
    omit obvious words, use lists over prose, drop redundant qualifiers.
  - Keep the evidence (file path, exact command, dependency name, version) — that
    is information, not filler. Attach it inline and as briefly as possible
    (e.g. \`test: pytest (pyproject.toml)\`).
  - When something cannot be determined, write exactly \`unknown\`, optionally with a
    terse reason in parentheses (e.g. \`product_purpose: unknown (no README)\`). A
    later stage keys off these markers, so never omit the line — mark it.
  - Do not sacrifice any fact for the sake of brevity. Brevity means removing
    words, never removing information.

  #### Sections (use these exact headings)

  ## languages_and_runtimes
  ## frameworks_and_libraries
  ## commands        (build / test / lint / format)
  ## directory_structure
  ## existing_docs_and_ai_tooling
  ## conventions     (note prevalence, e.g. 11/14 files)
  ## api_surface
  ## testing
  ## infrastructure_and_deployment
  ## version_control_signals
  ## sensitive_areas
  ## product_signals  (only what repo shows; else unknown)
`;
