import { execFile } from "node:child_process";
import { promisify } from "util";

export const execFileAsync = promisify(execFile);