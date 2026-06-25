## Why

`@cthutool/cli` already has a broad Bun test suite, but its coverage output differs from the Vitest packages and includes bundled script/runtime paths that need evaluation before a meaningful threshold gate can be added. CLI should not be forced into Vitest just to match coverage tooling.

## What Changes

- Evaluate Bun coverage output for CLI and record a stable baseline.
- Identify source files, bundled scripts, generated paths, and external script paths that should or should not count toward CLI coverage.
- Decide whether CLI can have a Bun-native threshold gate, should remain visibility-only, or needs further test cleanup first.
- Preserve CLI on Bun test.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add CLI Bun coverage evaluation and gate decision requirements.

## Impact

- `apps/cli/package.json`, CLI Bun coverage configuration, and possibly coverage ignore patterns.
- Coverage policy documentation and root engineering contract tests.
- No migration of CLI tests to Vitest.
