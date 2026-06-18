## Why

Installing `chc` for personal use should not require publishing to npm or manually cloning the repository first. A public GitHub-hosted installer plus a CLI self-update command gives a single-command install path and a repeatable update flow.

## What Changes

- Add a repository installer script that can be executed from the public GitHub raw URL or from a local checkout.
- Install and update a managed source checkout under the user's home directory, then build and globally install the root package that exposes `chc`.
- Add a `chc self-update` command that reuses the same Git checkout, dependency install, CLI build, and global install flow.
- Document public one-line installation, version/ref overrides, custom install directories, and the self-update command.

## Capabilities

### New Capabilities

- `apps-cli-self-installation`: Defines the CLI's GitHub-based personal installation and self-update behavior.

### Modified Capabilities

- `apps-cli-agent-contract`: Top-level help includes the new `self-update` command while preserving shared CLI output and error behavior.
- `apps-cli-shell-completion`: Root command completion candidates include the new `self-update` command.

## Impact

- Affects `scripts/install-chc.sh`, `apps/cli/src/command/root.command.ts`, `apps/cli/src/command/self-update.command.ts`, `apps/cli/src/domain/self-update-manager.ts`, shared CLI error codes, and README documentation.
- Requires local install/update environments to provide `git`, Node 24, `npm`, `pnpm`, and `bun`.
- Uses GitHub HTTPS by default so the public repository can be installed without SSH setup.
