import { execFile } from "node:child_process";
import { promisify } from "util";
import { appendFile } from "node:fs/promises";
import { isDebugMode } from "./debug.ts";

export const execFileAsync = promisify(execFile);

export const kiroTrace = async (kiroOutput: {
  stderr: string;
  stdout: string;
}): Promise<void> => {
  if (!isDebugMode()) return;
  const err = kiroOutput.stderr + "\n";
  const out = kiroOutput.stdout + "\n";
  await appendFile("./kiro-trace", err + out);
};
