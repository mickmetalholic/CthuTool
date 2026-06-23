## Why

The current GitHub installer requires every target machine to have `pnpm` and `bun` so it can build `apps/cli/dist/index.js` locally. For a personal public-repository CLI, committing the built CLI bundle makes install and CLI self-management lighter and closer to a normal global tool install.

## What Changes

- Commit the generated `apps/cli/dist/index.js` bundle as the runtime artifact consumed by `apps/cli/bin/chc.mjs`.
- Change the installer to clone or update the managed checkout and install the root package globally without running workspace dependency installation or CLI build.
- Replace the public update surface with top-level `chc update`, and keep `chc self-update` only as a backward-compatible alias.
- Add top-level `chc version`, `chc status`, and `chc --version` for CLI version and installation-state inspection.
- Change update execution to fetch/pull the configured ref and reinstall the root package globally without running `pnpm install` or `bun build`.
- Use an install path that does not trigger root package lifecycle scripts that would rebuild the CLI on target machines.
- Update documentation and tests to reflect the lighter target-machine prerequisites and the source-of-truth rule for committed build output.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-self-installation`: Installation, version/status inspection, and update use committed prebuilt CLI output instead of building on the target machine.

## Impact

- Affects `scripts/install-chc.sh`, CLI root command registration, `apps/cli/src/domain/self-update-manager.ts`, related command tests, README installation prerequisites, and version control treatment of `apps/cli/dist/index.js`.
- Target install/update machines no longer need `pnpm` or `bun`; development/release machines still need them to regenerate the committed bundle.
- Release discipline changes: CLI source changes must be accompanied by a refreshed `apps/cli/dist/index.js` in the same commit.
