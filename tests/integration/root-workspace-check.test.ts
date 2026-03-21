import { spawn } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const skip =
  process.env.SKIP_ROOT_WORKSPACE_CHECK === "true" ||
  process.env.SKIP_ROOT_WORKSPACE_CHECK === "1";

const run = skip ? describe.skip : describe;

run("root workspace check (integration)", () => {
  it(
    "pnpm run check exits 0 from repo root",
    async () => {
      const code = await new Promise<number>((resolve, reject) => {
        const child = spawn("pnpm", ["run", "check"], {
          cwd: root,
          stdio: "inherit",
          env: process.env,
        });
        child.on("error", reject);
        child.on("close", (c) => resolve(c ?? 1));
      });
      expect(code).toBe(0);
    },
    120_000,
  );
});
