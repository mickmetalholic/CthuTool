import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");

describe("workspace members contract", () => {
  it("includes only root app and package workspace globs", () => {
    const wsRaw = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    const ws = parseYaml(wsRaw) as { packages?: string[] };
    expect(ws.packages).toEqual(["apps/*", "packages/*"]);
  });

  it("keeps root package orchestration scoped to workspace packages", () => {
    const pkgRaw = readFileSync(join(root, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };

    for (const script of ["lint", "typecheck", "test", "test:cov", "build"]) {
      expect(pkg.scripts?.[script]).toBeDefined();
      expect(pkg.scripts?.[script]).toMatch(/turbo|jest|biome/);
    }
  });
});
