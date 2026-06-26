import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");

const thresholdGatedPackages = {
  "@cthutool/backend": {
    configPath: "apps/backend/vitest.config.ts",
    thresholds: {
      statements: 75,
      branches: 70,
      functions: 80,
      lines: 75,
    },
  },
  "@cthutool/config": {
    configPath: "packages/config/vitest.config.ts",
    thresholds: {
      statements: 75,
      branches: 60,
      functions: 90,
      lines: 75,
    },
  },
  "@cthutool/agent-protocol": {
    configPath: "packages/agent-protocol/vitest.config.ts",
    thresholds: {
      statements: 90,
      branches: 90,
      functions: 85,
      lines: 90,
    },
  },
  "@cthutool/obsidian-enhancer": {
    configPath: "packages/obsidian-enhancer/vitest.config.ts",
    thresholds: {
      statements: 75,
      branches: 65,
      functions: 85,
      lines: 75,
    },
  },
  "@cthutool/app-shell": {
    configPath: "packages/app-shell/vitest.config.ts",
    thresholds: {
      statements: 85,
      branches: 65,
      functions: 70,
      lines: 85,
    },
  },
  "@cthutool/ui": {
    configPath: "packages/ui/vitest.config.ts",
    thresholds: {
      statements: 80,
      branches: 85,
      functions: 75,
      lines: 80,
    },
  },
} as const;

const visibilityOnlyPackages = [
  {
    name: "@cthutool/cli",
    configPath: "apps/cli/package.json",
    runner: "bun",
  },
  {
    name: "@cthutool/desktop",
    configPath: "apps/desktop/vitest.config.ts",
    runner: "vitest",
  },
  {
    name: "@cthutool/docs",
    configPath: "apps/docs/vitest.config.ts",
    runner: "vitest",
  },
  {
    name: "@cthutool/web",
    configPath: "apps/web/vitest.config.ts",
    runner: "vitest",
  },
] as const;

function readText(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function thresholdRegex(metric: string, value: number): RegExp {
  return new RegExp(`${metric}:\\s*${value}\\b`);
}

function expectBunTestRunner(scriptConfig: string): void {
  expect(scriptConfig).toMatch(/(bun|run-bun\.sh)\s+test/);
}

describe("coverage quality gate policy", () => {
  it("documents the initial threshold-gated package list", () => {
    const policy = readText("docs/coverage-quality-gates.md");

    for (const [packageName, gate] of Object.entries(thresholdGatedPackages)) {
      expect(policy).toContain(packageName);
      for (const value of Object.values(gate.thresholds)) {
        expect(policy).toContain(`| ${value} `);
      }
    }
  });

  it("keeps thresholds visible in package runner configuration", () => {
    for (const [packageName, gate] of Object.entries(thresholdGatedPackages)) {
      const config = readText(gate.configPath);

      expect(config, packageName).toContain("thresholds");
      for (const [metric, value] of Object.entries(gate.thresholds)) {
        expect(config, packageName).toMatch(thresholdRegex(metric, value));
      }
    }
  });

  it("keeps visibility-only packages free of percentage thresholds", () => {
    const policy = readText("docs/coverage-quality-gates.md");

    for (const pkg of visibilityOnlyPackages) {
      expect(policy).toContain(pkg.name);

      const config = readText(pkg.configPath);
      if (pkg.runner === "bun") {
        expectBunTestRunner(config);
        expect(config).toContain("--coverage");
      } else {
        expect(config, pkg.name).toContain("coverage");
        expect(config, pkg.name).not.toContain("thresholds");
      }
    }
  });

  it("documents coverage gate graduation criteria and CLI runner differences", () => {
    const policy = readText("docs/coverage-quality-gates.md");

    expect(policy).toContain("Graduation Criteria");
    expect(policy).toContain("stable package-local coverage artifacts");
    expect(policy).toContain("meaningful behavioral tests");
    expect(policy).toContain("current baseline");
    expect(policy).toContain("Root engineering contract tests");
    expect(policy).toContain("@cthutool/cli");
    expect(policy).toContain("Bun coverage");
  });

  it("documents CLI Bun coverage baseline and LCOV filtering decision", () => {
    const policy = readText("docs/coverage-quality-gates.md");
    const cliPackageJson = readText("apps/cli/package.json");
    const filterScript = readText("apps/cli/tools/filter-coverage-lcov.mjs");

    expect(policy).toContain("69.17 functions");
    expect(policy).toContain("75.55");
    expect(policy).toContain("package-owned `src/**` files");
    expect(policy).toContain("`src/scripts/**`");
    expect(policy).toContain("test setup");
    expect(policy).toContain("external plugin scripts");
    expect(policy).toContain("temporary `cthutool-script-*`");
    expect(policy).toContain("not threshold-gated yet");

    expectBunTestRunner(cliPackageJson);
    expect(cliPackageJson).toContain("--coverage");
    expect(cliPackageJson).toContain("filter-coverage-lcov.mjs");
    expect(filterScript).toContain("SF:src/");
    expect(filterScript).not.toContain("cthutool-script-");
  });

  it("documents shared frontend package baselines and threshold decisions", () => {
    const policy = readText("docs/coverage-quality-gates.md");

    expect(policy).toContain("@cthutool/app-shell");
    expect(policy).toContain("@cthutool/ui");
    expect(policy).toContain("frontend behavior tests");
    expect(policy).toContain("| `@cthutool/app-shell` | 92.40 | 72.22 | 76.47 | 92.40 | 85 | 65 | 70 | 85 |");
    expect(policy).toContain("| `@cthutool/ui` | 84.22 | 92.50 | 81.08 | 84.22 | 80 | 85 | 75 | 80 |");
  });

  it("documents web and docs baselines while keeping them visibility-only", () => {
    const policy = readText("docs/coverage-quality-gates.md");

    expect(policy).toContain("@cthutool/web");
    expect(policy).toContain("@cthutool/docs");
    expect(policy).toContain("current web application surface");
    expect(policy).toContain("very small source baseline");
    expect(policy).toContain("too little source surface");
    expect(policy).toContain("stable percentage");
    expect(policy).toMatch(
      /100 statements,\s+100 branches,\s+100 functions,\s+and 100\s+lines/,
    );
    expect(policy).toMatch(/100\s+statements and 100 lines/);
  });

  it("keeps coverage thresholds out of hidden CI shell logic", () => {
    const ci = readText(".github/workflows/ci.yml");

    expect(ci).not.toMatch(/thresholds?:\s*\{/);
    expect(ci).not.toMatch(/coverage-threshold/i);
    expect(ci).toContain("pnpm run test:cov");
  });

  it("keeps Codecov statuses informational beside package-local gates", () => {
    const codecov = readText("codecov.yml");
    const policy = readText("docs/coverage-quality-gates.md");

    expect(codecov).toMatch(
      /project:[\s\S]*default:[\s\S]*informational:\s*true/,
    );
    expect(codecov).toMatch(
      /patch:[\s\S]*default:[\s\S]*informational:\s*true/,
    );
    expect(policy).toContain("Codecov project and patch statuses");
    expect(policy).toContain("package-aware gates");
  });
});
