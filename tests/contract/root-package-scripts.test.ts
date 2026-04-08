import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

describe("root package.json scripts contract", () => {
  it("exposes build that delegates to turbo run build", () => {
    const pkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as { scripts?: { build?: string } };
    expect(pkg.scripts?.build).toBeDefined();
    const build = pkg.scripts?.build ?? "";
    expect(build).toMatch(/turbo(\.exe)?\s+run\s+build|exec\s+turbo(\.exe)?\s+run\s+build/);
  });

  it("exposes check that runs biome check at repo root", () => {
    const pkg = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as { scripts?: { check?: string } };
    expect(pkg.scripts?.check).toBeDefined();
    const check = pkg.scripts?.check ?? "";
    expect(check).toMatch(/biome(\.exe)?\s+check/);
  });
});
