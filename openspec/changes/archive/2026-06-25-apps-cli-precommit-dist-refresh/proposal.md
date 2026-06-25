## Why

CLI source changes require `apps/cli/dist/index.js` to be refreshed before commit, but relying on developers to remember the build step is error-prone. The pre-commit path should automatically refresh and stage the CLI bundle when staged CLI source inputs change.

## What Changes

- Add a pre-commit guard that detects staged changes affecting the CLI runtime bundle.
- When relevant CLI inputs are staged, run the CLI build, stage `apps/cli/dist/index.js`, and verify the committed bundle is current.
- Keep the automation scoped to local commit-time validation; installer and target-machine flows still do not run `pnpm` or `bun`.
- Add contract coverage for the pre-commit behavior so future lint-staged or hook changes do not regress the safeguard.
- Document the automatic pre-commit refresh alongside the existing manual `pnpm --filter @cthutool/cli build` and `pnpm run check:cli-dist` commands.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: Root engineering configuration adds a pre-commit safeguard that refreshes and stages the CLI dist bundle when staged CLI source inputs change.

## Impact

- Affects root commit hooks or hook-invoked scripts, `package.json`/lint-staged configuration if used for hook wiring, root contract tests, README documentation, and the committed CLI dist freshness workflow.
- Does not change `chc` runtime behavior, public installer behavior, update behavior, or target-machine prerequisites.
