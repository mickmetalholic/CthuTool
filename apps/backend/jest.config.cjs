const preset = require('../../jest.preset.cjs');

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: '.',
  testMatch: ['<rootDir>/e2e/**/*.e2e-spec.ts', '<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
};
