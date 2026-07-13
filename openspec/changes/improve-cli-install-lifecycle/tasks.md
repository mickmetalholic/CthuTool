## 1. Completion Installation

- [x] 1.1 Add managed zsh profile enable, status, disable, migration, and completion candidates.
- [x] 1.2 Make the installer enable zsh completion automatically with an explicit opt-out and backward-compatible warning behavior.
- [x] 1.3 Add isolated zsh lifecycle and installer contract coverage.

## 2. CLI Lifecycle

- [x] 2.1 Detect the running CLI source checkout and report local or remote status with accurate Git and bundle metadata.
- [x] 2.2 Remove the `self-update` alias and consolidate update failures on `update_failed`.
- [x] 2.3 Commit the Node bin shim as executable and verify its mode in integration coverage.
- [x] 2.4 Rebuild and commit the Node runtime bundle.

## 3. Documentation

- [x] 3.1 Update root and package CLI documentation for automatic completion, status detection, and the single update command.
- [x] 3.2 Update docs-site installation, command reference, module, and architecture pages.
- [x] 3.3 Keep generated agent adapter files unchanged.

## 4. Verification

- [x] 4.1 Run focused completion, global-bin, lifecycle manager, and installer contract tests.
- [x] 4.2 Run CLI type checking, formatting, shell syntax, generated completion syntax, and committed bundle consistency checks.
- [x] 4.3 Validate the OpenSpec change and confirm main specs remain unchanged until archival.
