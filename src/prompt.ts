import { execFile } from "node:child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type KiroTool =
  | "read"
  | "write"
  | "shell"
  | "grep"
  | "glob"
  | "code"
  | "use_aws"
  | "subagent"
  | "task"
  | "web_fetch";

export const prompt = async (prompt: {
  promptString: string;
  allowedTools?: KiroTool[];
}): Promise<string> => {
  const args: string[] = ["chat", "--non-interactive"];

  if (prompt.allowedTools !== undefined) {
    args.push(`--trust-tools=${prompt.allowedTools.join(",")}`);
  }

  args.push(prompt.promptString);

  const result = await execFileAsync("kiro-cli", args, { encoding: "utf-8" });

  return result.stdout;
};
