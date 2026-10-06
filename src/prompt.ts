import { createPromptText } from "./assemble-prompt.ts";
import { isMockMode } from "./mock.ts";
import {execFileAsync} from "./tools.ts";

const defaultAllowedKiroTools = ["read", "grep", "glob", "code"];

type OptionalKiroTool =
  | "write"
  | "shell"
  | "use_aws"
  | "subagent"
  | "task"
  | "web_fetch"
  | "web_search";
type DefaultKiroTool = (typeof defaultAllowedKiroTools)[number];
type KiroTool = OptionalKiroTool & DefaultKiroTool;

interface Prompt {
  promptString: string;
  optionalAllowedTools?: OptionalKiroTool[];
  /**
   * The canned output to return when mock mode is active. Steps import their
   * fixture from `src/mock.ts` and pass it here so mock runs behave
   * realistically. Ignored when mock mode is off.
   */
  mockOutput?: string;
}

export const prompt = async ({
  promptString,
  optionalAllowedTools,
  mockOutput,
}: Prompt): Promise<string> => {
  // In mock mode, skip the real agent call entirely and return the pre-made
  // example. This keeps the full orchestrator flow runnable without kiro-cli.
  if (isMockMode() && mockOutput !== undefined) {
    return mockOutput;
  }

  const allowedTools = Array.from(
    new Set(defaultAllowedKiroTools).union(new Set(optionalAllowedTools)),
  );

  const args: string[] = [
    "chat",
    "--no-interactive",
    `--trust-tools=${allowedTools.join(",")}`,
    createPromptText(promptString),
  ];

  const result = await execFileAsync("kiro-cli", args, { encoding: "utf-8" });

  console.log(result.stderr);

  return result.stdout;
};
