import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";

import { buildWorkspaceDependencies } from "../../scripts/build-workspace-dependencies.mjs";

const root = join(__dirname, "..", "..");

function workspaceManifests(): string[] {
  return ["apps", "packages"].flatMap((area) =>
    readdirSync(join(root, area), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, area, entry.name, "package.json"))
      .filter((manifestPath) => existsSync(manifestPath)),
  );
}

describe("workspace dependency builds", () => {
  it("includes the build helper in the scoped backend image context", () => {
    const dockerfile = readFileSync(join(root, "apps/backend/Dockerfile"), "utf8");

    expect(dockerfile).toContain(
      "COPY scripts/build-workspace-dependencies.mjs scripts/",
    );
  });

  it("guards every explicit workspace dependency build from Turbo races", () => {
    for (const manifestPath of workspaceManifests()) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        scripts?: Record<string, string>;
      };
      const buildDependencies = manifest.scripts?.["build:deps"];
      if (buildDependencies) {
        expect(buildDependencies).toContain(
          "scripts/build-workspace-dependencies.mjs",
        );
      }
    }
  });

  it("lets Turbo own dependency builds while a task is running", () => {
    const run = vi.fn();

    const status = buildWorkspaceDependencies(["@cthutool/agent-protocol"], {
      env: { TURBO_HASH: "task-hash" },
      run,
    });

    expect(status).toBe(0);
    expect(run).not.toHaveBeenCalled();
  });

  it("builds dependencies for standalone package commands", () => {
    const run = vi.fn().mockReturnValue({ status: 0 });
    const env = { PATH: "/bin" };

    const status = buildWorkspaceDependencies(
      ["@cthutool/agent-protocol", "@cthutool/config"],
      { env, platform: "linux", run },
    );

    expect(status).toBe(0);
    expect(run).toHaveBeenNthCalledWith(
      1,
      "pnpm",
      ["--filter", "@cthutool/agent-protocol", "build"],
      { env, stdio: "inherit" },
    );
    expect(run).toHaveBeenNthCalledWith(
      2,
      "pnpm",
      ["--filter", "@cthutool/config", "build"],
      { env, stdio: "inherit" },
    );
  });

  it("stops after the first failed dependency build", () => {
    const run = vi.fn().mockReturnValueOnce({ status: 2 });

    const status = buildWorkspaceDependencies(
      ["@cthutool/agent-protocol", "@cthutool/config"],
      { env: {}, platform: "win32", run },
    );

    expect(status).toBe(2);
    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith(
      "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        "pnpm",
        "--filter",
        "@cthutool/agent-protocol",
        "build",
      ],
      { env: {}, stdio: "inherit" },
    );
  });
});
