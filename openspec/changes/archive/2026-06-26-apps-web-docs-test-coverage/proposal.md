## Why

`@cthutool/web` and `@cthutool/docs` currently have lightweight smoke coverage. They should gain broader behavior and content validation before either package is considered for coverage gates, while avoiding heavy browser end-to-end infrastructure.

## What Changes

- Expand web tests for utilities, project shell behavior, and basic rendering contracts.
- Expand docs tests for content collection validity, frontmatter, links, and route discoverability.
- Keep both packages visibility-only unless their coverage and behavior tests justify gating.
- Preserve generated output exclusions so docs coverage artifacts do not pollute validation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add web and docs coverage expectations.

## Impact

- `apps/web/tests/**`, `apps/web/src/**`, `apps/docs/tests/**`, and docs/content validation utilities.
- Vitest and Astro validation configuration only as needed.
- Coverage policy documentation and root engineering contract tests.
