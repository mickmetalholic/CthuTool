import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

function readWorkflow(name: string): string {
  return readFileSync(join(root, ".github", "workflows", name), "utf8");
}

describe("CI workflow contract", () => {
  it("runs complete root validation as focused CI jobs", () => {
    const yml = readWorkflow("ci.yml");

    expect(yml).toMatch(/commitlint:/);
    expect(yml).toMatch(/lint:/);
    expect(yml).toMatch(/typecheck:/);
    expect(yml).toMatch(/test:/);
    expect(yml).toMatch(/build:/);
    expect(yml).toMatch(/cli-dist:/);
    expect(yml).toMatch(/coverage:/);

    expect(yml).toMatch(/pnpm\s+install/);
    expect(yml).toMatch(/pnpm\s+run\s+lint/);
    expect(yml).toMatch(/pnpm\s+run\s+typecheck/);
    expect(yml).toMatch(/pnpm\s+run\s+test/);
    expect(yml).toMatch(/pnpm\s+run\s+build/);
    expect(yml).toMatch(/pnpm\s+run\s+check:cli-dist/);
    expect(yml).toMatch(/pnpm\s+run\s+test:cov/);
  });

  it("restores Turbo cache for jobs that run Turbo tasks", () => {
    const workflows = [
      readWorkflow("ci.yml"),
      readWorkflow("desktop-artifacts.yml"),
    ];

    for (const yml of workflows) {
      expect(yml).toContain("actions/cache@v4");
      expect(yml).toContain(".turbo/cache");
      expect(yml).toContain("turbo-${{ runner.os }}");
      expect(yml).toContain("cache: pnpm");
    }
  });

  it("publishes coverage for root-managed package workspaces", () => {
    const yml = readWorkflow("ci.yml");

    expect(yml).toMatch(/pnpm\s+run\s+test:cov/);
    expect(yml).toContain("apps/*/coverage/**");
    expect(yml).toContain("packages/*/coverage/**");
    expect(yml).toContain("apps/*/coverage/lcov.info");
    expect(yml).toContain("packages/*/coverage/lcov.info");
    expect(yml).toContain("fail_ci_if_error: false");
    expect(yml).toMatch(/id-token:\s+write/);
    expect(yml).toMatch(/issues:\s+write/);
  });

  it("keeps validation jobs on read-only repository permissions", () => {
    const yml = readWorkflow("ci.yml");

    for (const job of [
      "commitlint",
      "lint",
      "typecheck",
      "test",
      "build",
      "cli-dist",
    ]) {
      expect(yml).toMatch(
        new RegExp(`${job}:\\n(?:.|\\n)*?permissions:\\n\\s+contents: read`),
      );
    }
  });

  it("packages desktop artifacts for macOS and Windows through the Turbo graph", () => {
    const yml = readWorkflow("desktop-artifacts.yml");

    expect(yml).toContain("macos-latest");
    expect(yml).toContain("windows-latest");
    expect(yml).toContain("packages/app-shell/**");
    expect(yml).toContain("packages/ui/**");
    expect(yml).toContain("turbo.json");
    expect(yml).toMatch(/turbo\s+run\s+typecheck\s+test\s+build/);
    expect(yml).toContain("--filter=@cthutool/desktop...");
    expect(yml).toMatch(/@cthutool\/desktop\s+package:win:from-build/);
    expect(yml).toMatch(/@cthutool\/desktop\s+package:mac:from-build/);
    expect(yml).toContain("actions/upload-artifact@v4");
  });

  it("validates backend images on pull requests and publishes only on main", () => {
    const yml = readWorkflow("backend-image.yml");

    expect(yml).toMatch(/pull_request:/);
    expect(yml).toMatch(/validate:/);
    expect(yml).toMatch(/build-and-push:/);
    expect(yml).toContain("push: false");
    expect(yml).toContain("if: github.event_name != 'pull_request'");
    expect(yml).toContain("${{ env.IMAGE_NAME }}:main");
    expect(yml).toContain("${{ env.IMAGE_NAME }}:${{ github.sha }}");
    expect(yml).toMatch(/concurrency:/);
    expect(yml).toContain("group: backend-image-main");
  });
});
