import { execFile } from "node:child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

interface Prompt {
  promptString: string;
}

export const prompt = async ({ promptString }: Prompt): Promise<string> => {
  const args: string[] = ["chat", "--non-interactive", "--trust-all-tools"];

  args.push(promptString);

  const result = await execFileAsync("kiro-cli", args, { encoding: "utf-8" });

  console.log(result.stderr);

  return result.stdout;
};
