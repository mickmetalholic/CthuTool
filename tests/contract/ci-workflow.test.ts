import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

describe("CI workflow contract", () => {
  it("runs pnpm install, lint, typecheck, and tests at repo root", () => {
    const yml = readFileSync(
      join(root, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    expect(yml).toMatch(/pnpm\s+install/);
    expect(yml).toMatch(/pnpm\s+run\s+lint/);
    expect(yml).toMatch(/pnpm\s+run\s+typecheck/);
    expect(yml).toMatch(/pnpm\s+run\s+test/);
  });

  it("publishes coverage for root-managed package workspaces", () => {
    const yml = readFileSync(
      join(root, ".github", "workflows", "ci.yml"),
      "utf8",
    );

    expect(yml).toMatch(/pnpm\s+run\s+test:cov/);
    expect(yml).toContain("apps/*/coverage/**");
    expect(yml).toContain("packages/*/coverage/**");
    expect(yml).toContain("apps/*/coverage/lcov.info");
    expect(yml).toContain("packages/*/coverage/lcov.info");
  });

  it("packages desktop artifacts for macOS and Windows", () => {
    const yml = readFileSync(
      join(root, ".github", "workflows", "desktop-artifacts.yml"),
      "utf8",
    );

    expect(yml).toContain("macos-latest");
    expect(yml).toContain("windows-latest");
    expect(yml).toMatch(/@cthutool\/desktop\s+typecheck/);
    expect(yml).toMatch(/@cthutool\/desktop\s+test/);
    expect(yml).toMatch(/@cthutool\/desktop\s+build/);
    expect(yml).toMatch(/@cthutool\/desktop\s+package:win/);
    expect(yml).toMatch(/@cthutool\/desktop\s+package:mac/);
    expect(yml).toContain("actions/upload-artifact@v4");
  });
});
