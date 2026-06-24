## Why

Coverage is now visible across root-managed runtime test suites, but visibility alone does not prevent regressions. At the same time, immediately applying uniform thresholds would be noisy because packages have different maturity levels and some currently rely on smoke tests.

The repository should add gradual, package-aware coverage quality gates after artifact generation is stable.

## What Changes

- Introduce coverage thresholds only for packages with sufficient existing coverage signal.
- Start with conservative thresholds for mature suites such as backend, config, and agent-protocol.
- Keep smoke-test-heavy packages visible but non-blocking until their coverage grows.
- Add policy documentation for when a package graduates from visibility-only to gated coverage.
- Ensure CI failure messages identify the package and threshold that failed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add gradual package-aware coverage quality gate requirements.

## Impact

- Vitest and Bun coverage configuration for selected packages.
- CI coverage job behavior and developer feedback.
- Root engineering contract tests for threshold policy where practical.
- No blanket repository-wide coverage threshold.
- No changes under `scratches/collection-hub`.

## Sequencing

This should happen after generated-output exclusions and coverage artifact contracts are complete. It may also benefit from test command layering, but it does not require every package to have layer scripts first.
