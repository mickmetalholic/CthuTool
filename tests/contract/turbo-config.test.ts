import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function readRootPackage() {
  return readJson(join(root, "package.json")) as {
    scripts?: Record<string, string>;
  };
}

function readTurboConfig() {
  return readJson(join(root, "turbo.json")) as {
    tasks?: Record<
      string,
      {
        dependsOn?: string[];
        outputs?: string[];
      }
    >;
  };
}

describe("Turbo orchestration contract", () => {
  it("keeps root validation commands delegated through Turbo", () => {
    const scripts = readRootPackage().scripts ?? {};

    expect(scripts.build).toMatch(/\bturbo\s+run\s+build\b/);
    expect(scripts.typecheck).toMatch(/\bturbo\s+run\s+typecheck\b/);
    expect(scripts.test).toMatch(/\bturbo\s+run\s+test\b/);
    expect(scripts["test:cov"]).toMatch(/\bturbo\s+run\s+test:cov\b/);
  });

  it("declares upstream build dependencies for root validation tasks", () => {
    const tasks = readTurboConfig().tasks ?? {};

    expect(tasks.build?.dependsOn).toContain("^build");
    expect(tasks.typecheck?.dependsOn).toContain("^build");
    expect(tasks.test?.dependsOn).toContain("^build");
    expect(tasks["test:cov"]?.dependsOn).toContain("^build");
  });

  it("builds workspace dependencies before orchestrated runtime tasks", () => {
    const tasks = readTurboConfig().tasks ?? {};

    expect(tasks.dev?.dependsOn).toContain("^build");
    expect(tasks.start?.dependsOn).toContain("^build");
  });

  it("keeps standardized test layer tasks orchestrable", () => {
    const tasks = readTurboConfig().tasks ?? {};

    for (const task of ["test:unit", "test:integration", "test:e2e"]) {
      expect(tasks[task]?.dependsOn).toContain("^build");
      expect(tasks[task]?.outputs).toEqual([]);
    }
  });

  it("declares durable outputs for build and coverage tasks", () => {
    const tasks = readTurboConfig().tasks ?? {};

    expect(tasks.build?.outputs).toEqual(
      expect.arrayContaining([
        "dist/**",
        "out/**",
        ".next/**",
        ".astro/**",
        "release/**",
      ]),
    );
    expect(tasks.test?.outputs).toEqual([]);
    expect(tasks["test:cov"]?.outputs).toContain("coverage/**");
  });
});
