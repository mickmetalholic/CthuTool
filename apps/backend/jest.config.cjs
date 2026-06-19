const preset = require('../../jest.preset.cjs');

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: '.',
  testMatch: ['**/e2e/**/*.e2e-spec.ts', '**/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@cthutool/agent-protocol$': '<rootDir>/../../packages/agent-protocol/src',
    '^@cthutool/config$': '<rootDir>/../../packages/config/src',
  },
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
};
