import { execFileAsync } from "./tools.ts";

const COMMAND_CHECK_TIMEOUT_MS = 5_000;

export interface DependencyIssue {
  name: string;
  detail: string;
}

/**
 * Check the manually installed runtime requirement before starting the
 * pipeline. Node/npm-managed packages are already involved in launching this
 * CLI and are not checked here.
 *
 * Mock mode intentionally skips kiro-cli: its purpose is to exercise the CLI
 * without an installed/authenticated agent.
 */
export const checkRuntimeDependencies = async ({
  skipKiroCli = false,
}: { skipKiroCli?: boolean } = {}): Promise<DependencyIssue[]> => {
  if (skipKiroCli) {
    return [];
  }

  try {
    await execFileAsync("kiro-cli", ["--version"], {
      encoding: "utf-8",
      timeout: COMMAND_CHECK_TIMEOUT_MS,
    });
    return [];
  } catch {
    return [
      {
        name: "kiro-cli",
        detail: "Install or make `kiro-cli` available on your PATH.",
      },
    ];
  }
};
