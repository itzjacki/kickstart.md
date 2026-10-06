import pkg from "../package.json" with { type: "json" };

/**
 * The kickstart.md version, sourced from package.json's semantic version.
 * This is surfaced in the CLI and stamped into generated artifacts.
 */
export const KICKSTART_VERSION: string = pkg.version;
