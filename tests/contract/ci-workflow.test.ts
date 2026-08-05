import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

function workflowPath(name: string): string {
  return join(root, ".github", "workflows", name);
}

function readWorkflow(name: string): string {
  return readFileSync(workflowPath(name), "utf8");
}

function hasWorkflow(name: string): boolean {
  return existsSync(workflowPath(name));
}

describe("CI workflow contract", () => {
  it("uses area workflow filenames with explicit display names", () => {
    expect(readWorkflow("ci.yml")).toMatch(/^name: CI$/m);
    expect(readWorkflow("cli.yml")).toMatch(/^name: CLI Distribution$/m);
    expect(readWorkflow("backend.yml")).toMatch(/^name: Backend Image$/m);

    expect(hasWorkflow("backend-image.yml")).toBe(false);
    expect(hasWorkflow("desktop-artifacts.yml")).toBe(false);
    expect(hasWorkflow("desktop.yml")).toBe(false);
  });

  it("uses npmjs in GitHub Actions while preserving the local registry mirror", () => {
    expect(readFileSync(join(root, ".npmrc"), "utf8")).toContain(
      "registry=https://mirrors.cloud.tencent.com/npm/",
    );

    for (const yml of [
      readWorkflow("ci.yml"),
      readWorkflow("cli.yml"),
      readWorkflow("agent-release.yml"),
    ]) {
      expect(yml).toContain(
        "NPM_CONFIG_REGISTRY: https://registry.npmjs.org/",
      );
    }
  });

  it("runs complete root validation as focused CI jobs", () => {
    const yml = readWorkflow("ci.yml");

    expect(yml).toMatch(/commitlint:/);
    expect(yml).toMatch(/lint:/);
    expect(yml).toMatch(/typecheck:/);
    expect(yml).toMatch(/test:/);
    expect(yml).toMatch(/build:/);
    expect(yml).toMatch(/coverage:/);
    expect(yml).not.toMatch(/cli-dist:/);

    expect(yml).toMatch(/pnpm\s+install/);
    expect(yml).toMatch(/pnpm\s+run\s+lint/);
    expect(yml).toMatch(/pnpm\s+run\s+typecheck/);
    expect(yml).toMatch(/pnpm\s+run\s+test/);
    expect(yml).toMatch(/pnpm\s+run\s+build/);
    expect(yml).toMatch(/pnpm\s+run\s+test:cov/);
    expect(yml).not.toMatch(/pnpm\s+run\s+check:cli-dist/);
  });

  it("keeps CLI distribution checks required-safe in a dedicated workflow", () => {
    const yml = readWorkflow("cli.yml");
    const ciYml = readWorkflow("ci.yml");

    expect(yml).toMatch(/pull_request:/);
    expect(yml).toMatch(/push:/);
    expect(yml).toMatch(/workflow_dispatch:/);
    expect(yml).toMatch(/cli-dist:/);
    expect(yml).toContain("node scripts/ci/affected-workflow.mjs cli-dist");
    expect(yml).toContain("Skip CLI distribution check");
    expect(yml).toContain("if: steps.affected.outputs.changed != 'true'");
    expect(yml).toContain("if: steps.affected.outputs.changed == 'true'");
    expect(yml).toMatch(/pnpm\s+run\s+check:cli-dist/);
    expect(yml).not.toContain("cli-dist-changes:");
    expect(yml).not.toContain("dorny/paths-filter");

    expect(ciYml).not.toMatch(/cli-dist:/);
    expect(ciYml).not.toContain("check:cli-dist");
  });

  it("cancels superseded workflow runs for pull request updates", () => {
    for (const yml of [
      readWorkflow("ci.yml"),
      readWorkflow("cli.yml"),
      readWorkflow("backend.yml"),
    ]) {
      expect(yml).toMatch(/concurrency:/);
      expect(yml).toContain(
        "${{ github.event.pull_request.number || github.ref }}",
      );
      expect(yml).toContain("cancel-in-progress: true");
    }
  });

  it("restores Turbo cache for jobs that run Turbo tasks", () => {
    const workflows = [readWorkflow("ci.yml")];

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
    expect(yml).toContain("coverage/**");
    expect(yml).toContain("apps/*/coverage/**");
    expect(yml).toContain("packages/*/coverage/**");
    expect(yml).toContain("coverage/lcov.info");
    expect(yml).toContain("apps/*/coverage/lcov.info");
    expect(yml).toContain("packages/*/coverage/lcov.info");
    expect(yml).toContain("fail_ci_if_error: false");
    expect(yml).toMatch(/id-token:\s+write/);
    expect(yml).toMatch(/issues:\s+write/);
    expect(yml).toContain("coverage/coverage-summary.json");
    expect(yml).toContain("apps/backend/coverage/coverage-summary.json");
    expect(yml).toContain("missingSummaries");
    expect(yml).toContain("core.setFailed");
    expect(yml).not.toContain(
      ".filter(([, summaryPath]) => fs.existsSync(summaryPath))",
    );
  });

  it("keeps validation jobs on read-only repository permissions", () => {
    const ciYml = readWorkflow("ci.yml");
    const cliYml = readWorkflow("cli.yml");

    for (const job of ["commitlint", "lint", "typecheck", "test", "build"]) {
      expect(ciYml).toMatch(
        new RegExp(`${job}:\\n(?:.|\\n)*?permissions:\\n\\s+contents: read`),
      );
    }
    expect(cliYml).toMatch(
      /cli-dist:\n(?:.|\n)*?permissions:\n\s+contents: read/,
    );
  });

  it("validates backend images on pull requests and publishes only on main", () => {
    const yml = readWorkflow("backend.yml");

    expect(yml).toMatch(/pull_request:/);
    expect(yml).toMatch(/validate:/);
    expect(yml).toMatch(/build-and-push:/);
    expect(yml).toContain(
      "node scripts/ci/affected-workflow.mjs backend-image",
    );
    expect(yml).toContain("Skip backend image validation");
    expect(yml).toContain("Skip backend image publish");
    expect(yml).toContain("if: steps.affected.outputs.changed != 'true'");
    expect(yml).toContain("if: steps.affected.outputs.changed == 'true'");
    expect(yml).toContain("push: false");
    expect(yml).toContain("if: github.event_name != 'pull_request'");
    expect(yml).toContain("${{ env.IMAGE_NAME }}:main");
    expect(yml).toContain("${{ env.IMAGE_NAME }}:${{ github.sha }}");
    expect(yml).toContain("group: backend-image-main");
    expect(yml).toContain("cancel-in-progress: false");
    expect(yml).toMatch(
      /build-and-push:\n(?:.|\n)*?permissions:\n\s+contents: read\n\s+packages: write/,
    );
    expect(yml).not.toContain("Pin deployment manifest to commit image");
    expect(yml).not.toContain("Commit deployment manifest update");
    expect(yml).not.toContain("git add k8s/deployment.yaml");
    expect(yml).not.toContain("git push");
  });
});
