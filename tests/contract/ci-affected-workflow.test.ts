import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const script = join(root, "scripts", "ci", "affected-workflow.mjs");

function runAffected(target: string, changedFiles: string[]): string {
  return execFileSync(process.execPath, [script, target], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CI_CHANGED_FILES: changedFiles.join("\n"),
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_EVENT_PATH: "",
      GITHUB_OUTPUT: "",
    },
  });
}

function expectChanged(target: string, changedFiles: string[]) {
  expect(runAffected(target, changedFiles)).toContain("changed=true");
}

function expectUnchanged(target: string, changedFiles: string[]) {
  expect(runAffected(target, changedFiles)).toContain("changed=false");
}

describe("CI affected workflow detector", () => {
  it("marks backend images affected by backend and recursive workspace dependencies", () => {
    expectChanged("backend-image", ["apps/backend/src/main.ts"]);
    expectChanged("backend-image", ["packages/agent-protocol/src/index.ts"]);
    expectChanged("backend-image", ["packages/config/src/index.ts"]);
    expectChanged("backend-image", ["k8s/deployment.yaml"]);
    expectUnchanged("backend-image", ["packages/ui/src/index.ts"]);
  });

  it("marks desktop artifacts affected by desktop and recursive workspace dependencies", () => {
    expectChanged("desktop-artifacts", ["apps/desktop/src/main/index.ts"]);
    expectChanged("desktop-artifacts", ["packages/agent-protocol/src/index.ts"]);
    expectChanged("desktop-artifacts", ["packages/app-shell/src/index.ts"]);
    expectChanged("desktop-artifacts", ["packages/ui/src/index.ts"]);
    expectChanged("desktop-artifacts", ["tsconfig.json"]);
    expectUnchanged("desktop-artifacts", ["apps/backend/src/main.ts"]);
  });

  it("marks CLI distribution affected only by bundle inputs", () => {
    expectChanged("cli-dist", ["apps/cli/src/index.ts"]);
    expectChanged("cli-dist", ["scripts/run-bun.sh"]);
    expectChanged("cli-dist", ["pnpm-lock.yaml"]);
    expectUnchanged("cli-dist", ["apps/backend/src/main.ts"]);
  });
});
