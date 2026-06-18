## 1. Installer

- [x] 1.1 Add a repository shell installer that validates required commands and Node 24.
- [x] 1.2 Make the installer clone or update a managed checkout under `~/.cthutool/source/CthuTool` by default.
- [x] 1.3 Support `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, and `CHC_INSTALL_DIR` overrides.
- [x] 1.4 Build `@cthutool/cli` and install the root package globally as `chc`.

## 2. Self Update Command

- [x] 2.1 Add self-update domain logic for clone/fetch, checkout, branch fast-forward, dependency install, build, and global install.
- [x] 2.2 Add the top-level `chc self-update` command with `--repo`, `--ref`, `--install-dir`, `--json`, and `--quiet` support.
- [x] 2.3 Add `self_update_failed` to the shared CLI command error model.
- [x] 2.4 Register `self-update` in the root command tree and completion candidates.

## 3. Documentation

- [x] 3.1 Document public `curl -fsSL ... | bash` installation in the root README.
- [x] 3.2 Document local checkout installation, override environment variables, and tag/ref installation.
- [x] 3.3 Document `chc self-update` as the normal update path after first install.

## 4. Verification

- [x] 4.1 Add unit coverage for first install and existing-checkout self-update command sequences.
- [x] 4.2 Add integration coverage for root help and completion candidates including `self-update`.
- [x] 4.3 Run focused CLI tests for self-update, completion, and global bin behavior.
- [x] 4.4 Run `pnpm --filter @cthutool/cli typecheck`.
- [x] 4.5 Run Biome checks for touched CLI, docs, and installer files.
