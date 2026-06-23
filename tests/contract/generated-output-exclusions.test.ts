import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");
const generatedValidationExcludes = [
  "coverage",
  "dist",
  "out",
  "build",
  "release",
] as const;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function rootWorkspacePackageDirs(): string[] {
  return ["apps", "packages"].flatMap((area) =>
    readdirSync(join(root, area), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, area, entry.name)),
  );
}

function packageConfigPaths(fileName: string): string[] {
  return rootWorkspacePackageDirs()
    .map((packageDir) => join(packageDir, fileName))
    .filter((path) => {
      try {
        readFileSync(path, "utf8");
        return true;
      } catch {
        return false;
      }
    });
}

function hasBroadInclude(include: unknown): boolean {
  return (
    Array.isArray(include) &&
    include.some(
      (pattern) =>
        typeof pattern === "string" &&
        (pattern === "**/*" ||
          pattern.startsWith("**/*.") ||
          pattern.includes("/**/*")),
    )
  );
}

function excludesGeneratedOutput(exclude: unknown, generatedDir: string): boolean {
  return (
    Array.isArray(exclude) &&
    exclude.some(
      (pattern) =>
        typeof pattern === "string" &&
        (pattern === generatedDir ||
          pattern === `${generatedDir}/**` ||
          pattern === `**/${generatedDir}` ||
          pattern === `**/${generatedDir}/**`),
    )
  );
}

describe("generated output validation exclusions", () => {
  it("keeps the generated-output policy scoped to root workspace packages", () => {
    const wsRaw = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    const ws = parseYaml(wsRaw) as { packages?: string[] };

    expect(ws.packages).toEqual(
      expect.arrayContaining(["apps/*", "packages/*"]),
    );
    expect(ws.packages ?? []).not.toContain("scratches/collection-hub");
    expect(ws.packages ?? []).not.toContain("scratches/collection-hub/*");
  });

  it("excludes generated outputs from Biome validation inputs", () => {
    const biome = readJson(join(root, "biome.jsonc")) as {
      files?: { includes?: string[] };
    };
    const includes = biome.files?.includes ?? [];

    for (const generatedDir of [
      ...generatedValidationExcludes,
      ".next",
      ".astro",
    ]) {
      expect(includes).toContain(`!**/${generatedDir}`);
    }
    expect(includes).toEqual(expect.arrayContaining(["apps/**", "packages/**"]));
  });

  it("excludes generated outputs from broad TypeScript project includes", () => {
    const tsconfigPaths = rootWorkspacePackageDirs().flatMap((packageDir) =>
      readdirSync(packageDir)
        .filter((fileName) => /^tsconfig.*\.json$/.test(fileName))
        .map((fileName) => join(packageDir, fileName)),
    );

    for (const tsconfigPath of tsconfigPaths) {
      const tsconfig = readJson(tsconfigPath) as {
        include?: unknown;
        exclude?: unknown;
      };
      if (!hasBroadInclude(tsconfig.include)) {
        continue;
      }

      for (const generatedDir of generatedValidationExcludes) {
        expect(
          excludesGeneratedOutput(tsconfig.exclude, generatedDir),
          `${relative(root, tsconfigPath)} should exclude ${generatedDir}`,
        ).toBe(true);
      }
    }
  });

  it("keeps Vitest discovery scoped to test files and coverage scoped to source files", () => {
    const vitestConfigPaths = [
      join(root, "vitest.config.ts"),
      ...packageConfigPaths("vitest.config.ts"),
    ];

    for (const configPath of vitestConfigPaths) {
      const config = readFileSync(configPath, "utf8");
      expect(config, relative(root, configPath)).toContain("include:");
      expect(config, relative(root, configPath)).not.toMatch(
        /include:\s*\[\s*["']\*\*\/\*["']/,
      );
      expect(config, relative(root, configPath)).not.toMatch(
        /coverage:[\s\S]*include:\s*\[\s*["']\*\*\/\*["']/,
      );
    }
  });

  it("keeps coverage artifacts publishable while excluding them from validation", () => {
    const turbo = readJson(join(root, "turbo.json")) as {
      tasks?: { "test:cov"?: { outputs?: string[] } };
    };
    expect(turbo.tasks?.["test:cov"]?.outputs).toContain("coverage/**");

    const ci = readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8");
    expect(ci).toContain("coverage/**");
    expect(ci).toContain("apps/*/coverage/**");
    expect(ci).toContain("packages/*/coverage/**");
    expect(ci).toContain("apps/*/coverage/lcov.info");
    expect(ci).toContain("packages/*/coverage/lcov.info");

    const codecov = readFileSync(join(root, "codecov.yml"), "utf8");
    expect(codecov).toContain("tests/**");
    expect(codecov).toContain("**/*.spec.ts");
  });
});
