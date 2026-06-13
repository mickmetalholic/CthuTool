const preset = require('../../jest.preset.cjs');

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
};
