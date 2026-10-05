import { exec } from "node:child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const prompt = async (args: { prompt: string }): Promise<string> => {
  const result = await execAsync(
    `kiro-cli chat --non-interactive "${args.prompt}"`,
    { encoding: "utf-8" },
  );

  return result.stdout;
};
