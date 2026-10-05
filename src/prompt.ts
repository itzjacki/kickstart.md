import { execFile } from "node:child_process";
import { promisify } from "util";
import { createPromptText } from "./assemble-prompt.ts";

const execFileAsync = promisify(execFile);

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
}

export const prompt = async ({
  promptString,
  optionalAllowedTools,
}: Prompt): Promise<string> => {
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
