import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");

describe("workspace members contract", () => {
  it("includes root apps and packages while excluding experimental scratches", () => {
    const wsRaw = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    const ws = parseYaml(wsRaw) as { packages?: string[] };
    expect(ws.packages).toEqual(
      expect.arrayContaining(["apps/*", "packages/*"]),
    );
    expect(ws.packages).not.toEqual(
      expect.arrayContaining(["scratches/collection-hub"]),
    );
    expect(ws.packages ?? []).not.toContain("scratches/collection-hub/*");
  });

  it("keeps root package orchestration scoped away from collection hub", () => {
    const pkgRaw = readFileSync(join(root, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };

    for (const script of ["lint", "typecheck", "test", "test:cov", "build"]) {
      expect(pkg.scripts?.[script]).toBeDefined();
      expect(pkg.scripts?.[script]).not.toContain("scratches/collection-hub");
    }
  });
});
