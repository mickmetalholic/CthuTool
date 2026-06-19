## 1. Bundle Source of Truth

- [x] 1.1 Generate `apps/cli/dist/index.js` from the current CLI source.
- [x] 1.2 Make sure `apps/cli/dist/index.js` is tracked by Git and included in commits that change CLI runtime behavior.
- [x] 1.3 Add or update verification that detects when the committed bundle is missing or stale.

## 2. Installer Flow

- [x] 2.1 Remove `pnpm` and `bun` prerequisite checks from `scripts/install-chc.sh`.
- [x] 2.2 Remove workspace dependency install and CLI build commands from `scripts/install-chc.sh`.
- [x] 2.3 Add a committed-bundle existence check before global installation.
- [x] 2.4 Install the root package globally without invoking lifecycle scripts that would rebuild on the target machine.

## 3. CLI Lifecycle Commands

- [x] 3.1 Add top-level `chc version` and `chc --version` support.
- [x] 3.2 Add top-level `chc status` for CLI installation state, including version, managed checkout, repository URL, ref, commit, and bundle presence.
- [x] 3.3 Rename the preferred update surface to top-level `chc update` with `--repo`, `--ref`, `--install-dir`, `--json`, and `--quiet` support.
- [x] 3.4 Keep `chc self-update` as a backward-compatible alias for `chc update`.
- [x] 3.5 Remove dependency-install and build steps from update execution.
- [x] 3.6 Add committed-bundle verification to update execution.
- [x] 3.7 Update step reporting, JSON result command names, and failure messages.
- [x] 3.8 Update tests for version, status, first install, existing checkout, tag refs, alias behavior, and missing-bundle failures.

## 4. Documentation

- [x] 4.1 Update root and CLI README prerequisites to list only target-machine install requirements.
- [x] 4.2 Document that development/release machines still need `pnpm` and `bun` to refresh the committed bundle.
- [x] 4.3 Document `chc version`, `chc status`, `chc update`, and `chc --version`.
- [x] 4.4 Document the required release workflow: build CLI, commit source changes, and commit `apps/cli/dist/index.js` together.

## 5. Verification

- [x] 5.1 Run focused lifecycle command and global bin tests.
- [x] 5.2 Run `pnpm --filter @cthutool/cli typecheck`.
- [x] 5.3 Run OpenSpec validation for the change.
- [x] 5.4 Run formatting/lint checks for touched files.
