import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = join(__dirname, "..", "..");
const standardWorkspaceScripts = [
  "build",
  "test",
  "test:cov",
  "typecheck",
  "lint",
] as const;
const approvedTestSubscripts = new Set([
  "cov",
  "debug",
  "e2e",
  "integration",
  "unit",
  "watch",
]);
const testLayerScripts = ["test:unit", "test:integration", "test:e2e"] as const;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function rootWorkspacePackageJsonPaths(): string[] {
  return ["apps", "packages"].flatMap((area) =>
    readdirSync(join(root, area), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, area, entry.name, "package.json")),
  );
}

function rootWorkspacePackages(): Array<{
  dir: string;
  manifestPath: string;
  name?: string;
  scripts?: Record<string, string>;
}> {
  return rootWorkspacePackageJsonPaths().map((manifestPath) => {
    const pkg = readJson(manifestPath) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    return {
      dir: dirname(manifestPath),
      manifestPath,
      name: pkg.name,
      scripts: pkg.scripts,
    };
  });
}

function normalizeScript(script: string | undefined): string {
  return script?.toLowerCase() ?? "";
}

function packageTestCommandSurface(pkg: {
  scripts?: Record<string, string>;
}): string {
  return ["test", ...testLayerScripts]
    .map((script) => pkg.scripts?.[script])
    .filter(Boolean)
    .map((script) => normalizeScript(script))
    .join(" && ");
}

function packageTestLayers(pkg: {
  scripts?: Record<string, string>;
}): typeof testLayerScripts[number][] {
  return testLayerScripts.filter((script) => pkg.scripts?.[script]);
}

describe("root package.json scripts contract", () => {
  it("exposes build that delegates to turbo run build", () => {
    const pkg = readJson(join(root, "package.json")) as {
      scripts?: { build?: string };
    };
    expect(pkg.scripts?.build).toBeDefined();
    const build = pkg.scripts?.build ?? "";
    expect(build).toMatch(
      /turbo(\.exe)?\s+run\s+build|exec\s+turbo(\.exe)?\s+run\s+build/,
    );
  });

  it("exposes lint that delegates workspace package linting to turbo", () => {
    const pkg = readJson(join(root, "package.json")) as {
      scripts?: { lint?: string };
    };
    expect(pkg.scripts?.lint).toBeDefined();
    const lint = pkg.scripts?.lint ?? "";
    expect(lint).toMatch(
      /turbo(\.exe)?\s+run\s+lint|exec\s+turbo(\.exe)?\s+run\s+lint/,
    );
  });

  it("requires standard scripts for every root workspace package", () => {
    for (const pkg of rootWorkspacePackages()) {
      for (const script of standardWorkspaceScripts) {
        expect(pkg.scripts?.[script]).toEqual(expect.any(String));
      }
    }
  });

  it("rejects placeholder standard validation scripts", () => {
    for (const pkg of rootWorkspacePackages()) {
      for (const script of [...standardWorkspaceScripts, ...testLayerScripts]) {
        const command = normalizeScript(pkg.scripts?.[script]);
        if (!command) {
          continue;
        }
        expect(command).not.toContain("no tests configured");
        expect(command).not.toContain("no coverage configured");
        expect(command).not.toContain("not configured");
        expect(command).not.toMatch(/\b(exit\s+0|true)\b/);
      }
    }
  });

  it("keeps CLI on Bun test and uses Vitest for other package runtime tests", () => {
    for (const pkg of rootWorkspacePackages()) {
      const test = packageTestCommandSurface(pkg);
      if (pkg.name === "@cthutool/cli") {
        expect(test).toMatch(/(bun|run-bun\.sh)\s+test/);
      } else {
        expect(test).toContain("vitest");
      }
    }
  });

  it("keeps type-only validation in typecheck instead of test", () => {
    for (const pkg of rootWorkspacePackages()) {
      const test = packageTestCommandSurface(pkg);
      expect(test).not.toMatch(/\btsc\b.*--noemit/);
    }
  });

  it("uses the approved test layer script vocabulary", () => {
    for (const pkg of rootWorkspacePackages()) {
      const packageLabel = relative(root, pkg.dir);
      for (const script of Object.keys(pkg.scripts ?? {})) {
        if (!script.startsWith("test:")) {
          continue;
        }

        const subscript = script.slice("test:".length);
        expect(approvedTestSubscripts.has(subscript), packageLabel).toBe(true);
      }
    }
  });

  it("preserves runner policy for test layer scripts", () => {
    for (const pkg of rootWorkspacePackages()) {
      for (const script of packageTestLayers(pkg)) {
        const command = normalizeScript(pkg.scripts?.[script]);
        if (pkg.name === "@cthutool/cli") {
          expect(command).toMatch(/(bun|run-bun\.sh)\s+test/);
          expect(command).not.toContain("vitest");
        } else {
          expect(command).toContain("vitest");
        }
      }
    }
  });

  it("keeps layered package test scripts as the full package default", () => {
    for (const pkg of rootWorkspacePackages()) {
      const layers = packageTestLayers(pkg);
      if (layers.length === 0) {
        continue;
      }

      const test = normalizeScript(pkg.scripts?.test);
      for (const layer of layers) {
        expect(test, pkg.name).toContain(layer);
      }
    }
  });

  it("documents the initial CLI and backend test layer split", () => {
    const packages = new Map(rootWorkspacePackages().map((pkg) => [pkg.name, pkg]));

    expect(packageTestLayers(packages.get("@cthutool/cli") ?? {})).toEqual([
      "test:unit",
      "test:integration",
    ]);
    expect(packageTestLayers(packages.get("@cthutool/backend") ?? {})).toEqual([
      "test:unit",
      "test:e2e",
    ]);
  });

  it("requires coverage scripts to use real package-local coverage runners", () => {
    for (const pkg of rootWorkspacePackages()) {
      const testCoverage = normalizeScript(pkg.scripts?.["test:cov"]);

      if (pkg.name === "@cthutool/cli") {
        expect(testCoverage).toMatch(/(bun|run-bun\.sh)\s+test/);
        expect(testCoverage).toContain("--coverage");
        expect(testCoverage).toContain("--coverage-reporter=lcov");
        expect(testCoverage).toContain("--coverage-dir=coverage");
      } else {
        expect(testCoverage).toContain("vitest");
        expect(testCoverage).toContain("--coverage");
      }
    }
  });

  it("requires non-CLI Vitest packages to emit lcov and summary coverage artifacts", () => {
    for (const pkg of rootWorkspacePackages()) {
      if (pkg.name === "@cthutool/cli") {
        continue;
      }

      const configPath = join(pkg.dir, "vitest.config.ts");
      const config = readFileSync(configPath, "utf8");
      const packageLabel = relative(root, pkg.dir);

      expect(existsSync(configPath), packageLabel).toBe(true);
      expect(config, packageLabel).toContain("coverage");
      expect(config, packageLabel).toContain("lcov");
      expect(config, packageLabel).toContain("json-summary");
    }
  });
});
