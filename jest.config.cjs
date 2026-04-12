const preset = require("./jest.preset.cjs");

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: [
    "apps/**/src/**/*.ts",
    "packages/**/src/**/*.ts",
    "!**/*.d.ts",
    "!**/?(*.)+(spec|test|e2e-spec).ts",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },
};
