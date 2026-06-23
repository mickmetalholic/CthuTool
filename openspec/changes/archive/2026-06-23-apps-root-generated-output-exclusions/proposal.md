## Why

Generated artifacts such as `coverage`, `dist`, `out`, `.next`, and `.astro` can leak into package validation tools after test or coverage runs. This creates noisy typecheck or lint output and makes validation depend on whether a developer has recently generated artifacts locally.

The recent test governance work made coverage generation more common across root-managed packages, so generated-output boundaries need to be explicit before coverage and test contracts are tightened further.

## What Changes

- Standardize generated-output exclusions for root-managed validation commands.
- Ensure package typecheck, lint, docs checks, and runtime test discovery do not inspect coverage reports or build outputs as source input.
- Add root engineering contract coverage that generated output directories are ignored by relevant tools.
- Keep generated artifacts cacheable and publishable where needed, without letting them become validation inputs.
- Preserve the root workspace boundary that excludes `scratches/collection-hub`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: define generated-output exclusion requirements for root-managed validation.

## Impact

- Root and package TypeScript, Astro, Vitest, Biome, and ignore configuration where generated directories are currently visible to validation.
- Root engineering contract tests for generated-output policy.
- No changes to application runtime behavior.
- No changes under `scratches/collection-hub`.

## Sequencing

This should be implemented before coverage artifact contracts or quality gates, because those changes rely on stable coverage generation without validation noise.
