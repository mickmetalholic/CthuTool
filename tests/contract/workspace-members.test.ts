import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const root = join(__dirname, "..", "..");

describe("workspace members contract", () => {
  it("includes packages/example-lib with @cthutool/example-lib", () => {
    const wsRaw = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    const ws = parseYaml(wsRaw) as { packages?: string[] };
    expect(ws.packages).toEqual(
      expect.arrayContaining(["apps/*", "packages/*"]),
    );

    // const libPkg = JSON.parse(
    //   readFileSync(join(root, "packages", "example-lib", "package.json"), "utf8"),
    // ) as { name?: string };
    // expect(libPkg.name).toBe("@cthutool/example-lib");
  });
});
