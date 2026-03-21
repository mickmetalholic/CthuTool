import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

describe("CI workflow contract", () => {
  it("runs pnpm install and pnpm run check at repo root", () => {
    const yml = readFileSync(
      join(root, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    expect(yml).toMatch(/pnpm\s+install/);
    expect(yml).toMatch(/pnpm\s+run\s+check/);
  });
});
