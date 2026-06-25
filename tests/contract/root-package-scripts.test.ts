import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const standardWorkspaceScripts = [
  "build",
  "test",
  "test:cov",
  "typecheck",
  "lint",
] as const;

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

function normalizeScript(script: string | undefined): string {
  return script?.toLowerCase() ?? "";
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
    for (const packageJsonPath of rootWorkspacePackageJsonPaths()) {
      const pkg = readJson(packageJsonPath) as {
        name?: string;
        scripts?: Record<string, string>;
      };
      for (const script of standardWorkspaceScripts) {
        expect(pkg.scripts?.[script]).toEqual(expect.any(String));
      }
    }
  });

  it("rejects placeholder standard validation scripts", () => {
    for (const packageJsonPath of rootWorkspacePackageJsonPaths()) {
      const pkg = readJson(packageJsonPath) as {
        name?: string;
        scripts?: Record<string, string>;
      };
      for (const script of standardWorkspaceScripts) {
        const command = normalizeScript(pkg.scripts?.[script]);
        expect(command).not.toContain("no tests configured");
        expect(command).not.toContain("no coverage configured");
        expect(command).not.toContain("not configured");
        expect(command).not.toMatch(/\b(exit\s+0|true)\b/);
      }
    }
  });

  it("keeps CLI on Bun test and uses Vitest for other package runtime tests", () => {
    for (const packageJsonPath of rootWorkspacePackageJsonPaths()) {
      const pkg = readJson(packageJsonPath) as {
        name?: string;
        scripts?: Record<string, string>;
      };
      const test = normalizeScript(pkg.scripts?.test);
      if (pkg.name === "@cthutool/cli") {
        expect(test).toMatch(/(bun|run-bun\.sh)\s+test/);
      } else {
        expect(test).toContain("vitest");
      }
    }
  });

  it("keeps type-only validation in typecheck instead of test", () => {
    for (const packageJsonPath of rootWorkspacePackageJsonPaths()) {
      const pkg = readJson(packageJsonPath) as {
        name?: string;
        scripts?: Record<string, string>;
      };
      const test = normalizeScript(pkg.scripts?.test);
      expect(test).not.toMatch(/\btsc\b.*--noemit/);
    }
  });
});
