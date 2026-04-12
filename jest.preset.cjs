/**
 * Shared Jest defaults for root contract tests and packages.
 * Package-specific config stays in jest.config.cjs beside each package.
 */
/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  coverageReporters: ["text-summary", "lcov", "html", "json-summary"],
};
