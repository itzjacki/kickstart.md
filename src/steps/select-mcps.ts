import { log, multiselect, spinner, tasks } from "@clack/prompts";
import { execFileAsync, kiroTrace } from "../tools.ts";
import type { PromiseWithChild } from "node:child_process";
import { prompt } from "../prompt.ts";

interface MCP {
  name: string;
  url: string;
  scope: "default" | "workspace" | "global";
  description: string;
}

const getAiRecommendationPrompt = (
  aiContext: string,
  excludedMCPs: MCP[],
): string => {
  return `
## Your task: recommend MCPs

Your job here is to find appropriate MCPs this repo would genuinely benefit from. 
Do NOT generate any files — only recommend. Output only the JSON described below.

### Guiding principle

Base your decision on the analysis (repo facts) and the user's answers
(intent/domain); never invent evidence. Ignore the following MCPs

${JSON.stringify(excludedMCPs)}

### Output format

Return ONLY a list of MCPs corresponding to this format. Do not add any additional
information or text. No reasoning necessary. Your output is structured data only.
Do not add line breaks or spaces inside the JSON.

interface MCP {
    name: string
    url: string
    scope: 'default' | 'workspace' | 'global'
    description: string
}

example format: 
[{"name": "actual-name","url": "actual-url","scope": "actual-scope","description": "actual-description"}]
 
Add a short description to each MCP, stating the main purpose of the service behind. No more than 100 chars.
Set "scope" property to "workspace" for each MCP you recommend. 

### Analysis and user-answers artifact 

${aiContext.trim() || "(no ai context provided)"}

`.trim();
};

export const selectMCPs = async (
  aiContext: string,
): Promise<{ mcpsAdded: number }> => {
  const mcpCollection: MCP[] = [
    {
      name: "atlassian",
      url: "https://mcp.atlassian.com/v2/mcp",
      scope: "workspace",
      description: "Atlassian (Jira, Bitbucket, etc.)",
    },
    {
      name: "context7",
      url: "https://mcp.context7.com/mcp",
      scope: "workspace",
      description: "Context7. Up-to-date library documentation",
    },
  ];
  await tasks([
    {
      title:
        "Finding suitable MCPs for your project. MCP servers connect the AI to external tools and data sources, like your docs, APIs, or databases.",
      task: async () => {
        const aiRecommendedMCPs = await prompt({
          promptString: getAiRecommendationPrompt(aiContext, mcpCollection),
          mockOutput,
        });

        const json = aiRecommendedMCPs.match(/\[{[\s\S]*}]/);
        if (!json) return;

        log.info(json[0]);
        const foo = JSON.parse(json[0]) as MCP[];
        mcpCollection.push(...foo);
      },
    },
  ]);
  const mcps = await multiselect({
    message: "Select MCPs to add:",
    options: mcpCollection.map((m) => ({
      value: m.name,
      label: m.description,
    })),
    required: false,
  });

  if (typeof mcps === "symbol") return { mcpsAdded: 0 };

  await tasks([
    {
      title: "Installing selected MCPs",
      task: async () => {
        const deferred: PromiseWithChild<{ stdout: string; stderr: string }>[] =
          [];
        mcps.forEach((mcpName) => {
          const mcp = mcpCollection.find((r) => r.name === mcpName);
          if (!mcp) return;

          deferred.push(
            execFileAsync(
              "kiro-cli",
              [
                "mcp",
                "add",
                "--name",
                mcp.name,
                "--url",
                mcp.url,
                "--scope",
                mcp.scope,
                "--force",
              ],
              { encoding: "utf-8" },
            ),
          );
        });
        const result = await Promise.allSettled(deferred);
        result.forEach((r) =>
          r.status === "fulfilled" ? kiroTrace(r.value) : kiroTrace(r.reason),
        );

        const error = result.filter((r) => r.status === "rejected");
        const success = result
          .filter((r) => r.status === "fulfilled")
          .map((s) => s.value.stderr.trim());

        error &&
          error.length > 0 &&
          log.error(`Error adding MCPs: ${error.map((e) => e.reason)}`);
        log.info("\n" + success.join("\n"));
      },
    },
  ]);

  return { mcpsAdded: mcps.length };
};

const mockOutput =
  '[{"name":"github","url":"https://github.com/github/github-mcp-server","scope":"workspace","description":"GitHub. Manage issues, pull requests, repos, and code search via GitHub API."}]';
