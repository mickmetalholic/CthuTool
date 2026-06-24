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
  {
    name: "@cthutool/app-shell",
    configPath: "packages/app-shell/vitest.config.ts",
    runner: "vitest",
  },
  {
    name: "@cthutool/obsidian-enhancer",
    configPath: "packages/obsidian-enhancer/vitest.config.ts",
    runner: "vitest",
  },
  {
    name: "@cthutool/ui",
    configPath: "packages/ui/vitest.config.ts",
    runner: "vitest",
  },
] as const;

function readText(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function thresholdRegex(metric: string, value: number): RegExp {
  return new RegExp(`${metric}:\\s*${value}\\b`);
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
        expect(config).toContain("bun test");
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

  it("keeps coverage thresholds out of hidden CI shell logic", () => {
    const ci = readText(".github/workflows/ci.yml");

    expect(ci).not.toMatch(/thresholds?:\s*\{/);
    expect(ci).not.toMatch(/coverage-threshold/i);
    expect(ci).toContain("pnpm run test:cov");
  });
});
