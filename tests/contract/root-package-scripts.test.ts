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

  it("exposes lint that runs biome check at repo root", () => {
    const pkg = readJson(join(root, "package.json")) as {
      scripts?: { lint?: string };
    };
    expect(pkg.scripts?.lint).toBeDefined();
    const lint = pkg.scripts?.lint ?? "";
    expect(lint).toMatch(/biome(\.exe)?\s+check/);
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
});
