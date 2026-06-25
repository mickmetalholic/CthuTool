import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const root = join(__dirname, "..", "..");
const scriptPath = join(root, "scripts", "precommit-refresh-cli-dist.mjs");

type CommandCall = {
  readonly command: string;
  readonly args: readonly string[];
};

type PrecommitCliDistModule = {
  readonly cliDistPath: string;
  readonly getCliDistInputPaths: (paths: readonly string[]) => string[];
  readonly runPrecommitCliDistRefresh: (options: {
    readonly cwd?: string;
    readonly stagedPaths?: readonly string[];
    readonly commandRunner?: (
      command: string,
      args: readonly string[],
      options?: { readonly cwd?: string; readonly capture?: boolean },
    ) => string;
    readonly logger?: Pick<Console, "log">;
  }) => { readonly refreshed: boolean; readonly matchedPaths: readonly string[] };
};

const silentLogger = {
  log: () => undefined,
};

async function loadModule(): Promise<PrecommitCliDistModule> {
  return (await import(pathToFileURL(scriptPath).href)) as PrecommitCliDistModule;
}

function recordingCommandRunner(calls: CommandCall[]) {
  return (command: string, args: readonly string[]) => {
    calls.push({ command, args });
    return "";
  };
}

describe("precommit CLI dist refresh", () => {
  it("matches staged paths that can affect the CLI bundle", async () => {
    const module = await loadModule();

    expect(
      module.getCliDistInputPaths([
        "apps/cli/src/index.ts",
        "./apps/cli/package.json",
        "apps/cli/bun.lock",
        "apps/cli/tsconfig.json",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
        "README.md",
        "apps/cli/dist/index.js",
      ]),
    ).toEqual([
      "apps/cli/src/index.ts",
      "apps/cli/package.json",
      "apps/cli/bun.lock",
      "apps/cli/tsconfig.json",
      "package.json",
      "pnpm-lock.yaml",
      "tsconfig.json",
    ]);
  });

  it("does not run build commands for unrelated staged paths", async () => {
    const module = await loadModule();
    const calls: CommandCall[] = [];

    const result = module.runPrecommitCliDistRefresh({
      stagedPaths: ["README.md", "packages/ui/src/cn.ts"],
      commandRunner: recordingCommandRunner(calls),
      logger: silentLogger,
    });

    expect(result).toEqual({ refreshed: false, matchedPaths: [] });
    expect(calls).toEqual([]);
  });

  it("runs build, stages only CLI dist, and verifies freshness for CLI source", async () => {
    const module = await loadModule();
    const calls: CommandCall[] = [];

    const result = module.runPrecommitCliDistRefresh({
      stagedPaths: ["apps/cli/src/index.ts"],
      commandRunner: recordingCommandRunner(calls),
      logger: silentLogger,
    });

    expect(result).toEqual({
      refreshed: true,
      matchedPaths: ["apps/cli/src/index.ts"],
    });
    expect(calls).toEqual([
      {
        command: "pnpm",
        args: ["--filter", "@cthutool/cli", "build"],
      },
      {
        command: "git",
        args: ["add", module.cliDistPath],
      },
      {
        command: "pnpm",
        args: ["run", "check:cli-dist"],
      },
    ]);
  });

  it("runs the refresh for bundle-affecting metadata", async () => {
    const module = await loadModule();
    const calls: CommandCall[] = [];

    const result = module.runPrecommitCliDistRefresh({
      stagedPaths: ["apps/cli/package.json", "pnpm-lock.yaml"],
      commandRunner: recordingCommandRunner(calls),
      logger: silentLogger,
    });

    expect(result).toEqual({
      refreshed: true,
      matchedPaths: ["apps/cli/package.json", "pnpm-lock.yaml"],
    });
    expect(calls.map((call) => `${call.command} ${call.args.join(" ")}`)).toEqual([
      "pnpm --filter @cthutool/cli build",
      "git add apps/cli/dist/index.js",
      "pnpm run check:cli-dist",
    ]);
  });

  it("wires the hook before lint-staged and tolerates ignored generated files", () => {
    const hook = readFileSync(join(root, ".husky", "pre-commit"), "utf8");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
      readonly "lint-staged"?: Record<string, string>;
    };

    expect(pkg.scripts?.["precommit:cli-dist"]).toBe(
      "node scripts/precommit-refresh-cli-dist.mjs",
    );
    expect(hook.indexOf("pnpm run precommit:cli-dist")).toBeGreaterThan(-1);
    expect(hook.indexOf("pnpm exec lint-staged")).toBeGreaterThan(
      hook.indexOf("pnpm run precommit:cli-dist"),
    );
    expect(pkg["lint-staged"]?.["apps/**/*.{js,ts,mjs,cjs,jsx,tsx,json,jsonc}"]).toContain(
      "--no-errors-on-unmatched",
    );
  });
});
