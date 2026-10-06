import type { AdditionalSteeringFile } from "./additional-steering.ts";

/**
 * Per-file generation guidance for situational steering documents.
 *
 * These prompts deliberately describe what evidence to capture rather than
 * inventing project rules. The shared composer adds the repository artifacts,
 * reconciliation rules, and write/output contract.
 */
export const ADDITIONAL_STEERING_PROMPTS = {
  "structure.md": `
Create a concise map of the repository's non-obvious structure.

Include only navigation information that an agent could not quickly infer from a
normal directory listing:

- the important top-level areas and what each owns;
- boundaries between applications, packages, services, libraries, or generated
  code;
- where a change of a particular kind belongs;
- unusual source, configuration, template, or generated-output locations; and
- relationships between directories when those relationships affect navigation.

Do not produce an exhaustive tree, repeat obvious filenames, or prescribe a new
architecture. Cite representative paths. If the layout is conventional, keep
the file very short and say what is genuinely non-obvious rather than filling it
with a directory dump.

Use these sections when they contain evidence: 'Directory layout', 'Key
directories', and 'Navigation notes'.`,

  "code-conventions.md": `
Document recurring, non-obvious coding conventions observed across the codebase.

Capture only patterns supported by multiple examples, such as:

- naming or file-placement conventions not already enforced by tooling;
- import and module-boundary organization;
- error, validation, logging, resource-lifecycle, or async handling patterns;
- component, service, or module shape that new code must fit; and
- patterns for configuration, dependency injection, or public interfaces.

For every useful convention, explain the practical rule briefly and cite example
paths. Separate an observed convention from an exception. Do not invent a style
guide, restate formatter/linter/compiler behavior, prescribe a preference that
is not evidenced, or copy large code samples. Omit a category when there is no
reliable signal.

Use the sections 'Observed conventions' and 'Examples and exceptions' only when
they add non-duplicative value.`,

  "api-standards.md": `
Document conventions for the APIs this repository actually exposes.

Cover only evidenced API surfaces and include, where applicable:

- endpoint, operation, or schema naming and organization;
- request parsing, validation, and content-type conventions;
- response envelopes, resource shapes, pagination, filtering, and status codes;
- error response structure and safe error details;
- authentication, authorization, identity, and tenant boundaries;
- versioning, compatibility, idempotency, and rate-limit behavior; and
- API-specific tests, schemas, or generated clients that must stay in sync.

Cite routes, handlers, schemas, or representative tests. Distinguish observed
behavior from an explicit product requirement in the user answers. Do not add
generic REST advice, document an API that is not present, expose secrets or
real credentials, or duplicate an existing OpenAPI/schema source of truth.

Use concise sections such as 'Surface', 'Requests and responses', 'Errors',
'Authentication and authorization', and 'Compatibility' only when supported.`,

  "testing-standards.md": `
Document how tests are organized and what a useful test should look like in this
repository.

Include evidence-based guidance about:

- test framework, runner, and file placement/naming;
- unit, integration, end-to-end, contract, or other test boundaries;
- fixtures, factories, mocks, stubs, snapshots, and test data ownership;
- setup/teardown and environment requirements;
- behavior or risk areas the existing suite consistently verifies; and
- how tests are invoked, if the command is not already clear from AGENTS.md.

Cite representative test and configuration paths. Preserve the repository's
actual isolation and cleanup patterns. Do not claim coverage that is not present,
turn a handful of tests into a universal rule, duplicate tool-enforced style, or
recommend a new testing framework. If tests are sparse, describe only the
reliable patterns and say what is not established.

Use concise sections such as 'Test layout', 'Test types', 'Fixtures and mocks',
and 'What to verify' when applicable.`,

  "security.md": `
Document security-sensitive rules that materially affect changes in this
repository.

Cover only concerns supported by the analysis or user answers, including where
applicable:

- authentication, authorization, roles, permissions, or tenant isolation;
- secrets, credentials, tokens, and environment/configuration handling;
- personal, financial, health, or otherwise sensitive data;
- input validation, output encoding, injection boundaries, and file/network
  access;
- logging, telemetry, error messages, and data retention;
- dependency, webhook, third-party-service, or deployment trust boundaries; and
- security-sensitive tests, reviews, or files that require extra care.

State the rule and cite its source path or user-provided requirement. Never copy
secret values, invent a threat model, or turn generic security advice into a
project rule. Make clear when a point is an observed implementation constraint
versus a user-stated requirement. Keep this file focused on actionable,
non-discoverable guidance.

Use sections such as 'Sensitive assets', 'Access control', 'Data handling',
'Input and output boundaries', and 'Change boundaries' only when relevant.`,

  "domain-glossary.md": `
Create a compact glossary for specialized domain language that affects product
behavior or code changes.

For each important term, record:

- the preferred term and a plain-language definition;
- distinctions from terms that are easy to confuse;
- business rules, invariants, lifecycle states, or units that govern it; and
- the authoritative source, identifier, or code path when one exists.

Include only vocabulary that is genuinely domain-specific and useful to an agent
working on this repository. Prefer the user's answers for product meaning and
business rules; use code and documentation to identify names and relationships.
Do not define generic programming terms, infer business policy from a variable
name alone, or copy an exhaustive database/schema dump. Mark unresolved meaning
as unknown or omit it rather than guessing.

Use 'Terms', 'Rules and invariants', and 'Common confusions' when those sections
are supported by evidence.`,

  "deployment.md": `
Document the non-trivial path from source to a running or published system.

Include only evidence-backed details about:

- environments and their meaningful differences;
- build and packaging artifacts;
- infrastructure, hosting, services, and deployment configuration;
- required environment variables, secret references, and configuration flow
  without including secret values;
- migrations, ordering constraints, feature flags, or compatibility steps;
- health checks, smoke checks, rollback, or recovery procedures; and
- release ownership or approval boundaries when explicitly documented.

Cite scripts, CI workflows, infrastructure files, and relevant documentation.
Do not invent commands, credentials, cloud resources, or operational guarantees.
Do not duplicate a simple package-manager command already covered by AGENTS.md;
focus on relationships and non-obvious sequencing an agent needs before touching
build or deployment work.

Use sections such as 'Environments', 'Build and release', 'Configuration',
'Infrastructure', and 'Safety and rollback' only when applicable.`,
} as const satisfies Record<AdditionalSteeringFile, string>;

/**
 * Combines exactly the per-file instructions selected by the user.
 * Duplicate selections are ignored while preserving the catalog order supplied
 * by the caller.
 */
export const composeAdditionalSteeringPrompts = (
  selectedFiles: readonly AdditionalSteeringFile[],
): string => {
  const uniqueFiles = [...new Set(selectedFiles)];

  return uniqueFiles
    .map(
      (file) =>
        `### .kiro/steering/${file}\n\n${ADDITIONAL_STEERING_PROMPTS[file].trim()}`,
    )
    .join("\n\n");
};
