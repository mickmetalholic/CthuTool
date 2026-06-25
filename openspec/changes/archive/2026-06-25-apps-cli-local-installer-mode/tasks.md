## 1. Installer Mode Selection

- [x] 1.1 Add installer mode parsing for `auto`, `local`, and `remote` modes, with `auto` as the default.
- [x] 1.2 Detect local checkout mode from the installer script path and derive the repository root from `scripts/install-chc.sh`.
- [x] 1.3 Treat stdin/raw execution as remote managed mode so `curl -fsSL ... | bash` keeps cloning or updating `~/.cthutool/source/CthuTool`.
- [x] 1.4 Validate local checkout mode by checking the derived root has the expected package and CLI bundle paths before global installation.
- [x] 1.5 Preserve remote managed checkout behavior for repository URL, ref, install-dir overrides, fetch, checkout, and fast-forward pull.
- [x] 1.6 Keep global installation centralized through `npm install -g --ignore-scripts <selected-source>`.

## 2. Documentation

- [x] 2.1 Update the root README to distinguish public raw installation from local checkout installation.
- [x] 2.2 Update `apps/cli/README.md` with the local development flow: `scripts/install-chc.sh` plus `pnpm --filter @cthutool/cli dev`.
- [x] 2.3 Document the explicit remote managed restore command after a local checkout install.
- [x] 2.4 Document installer mode override semantics and how they interact with existing repository/ref/install-dir overrides.

## 3. Tests and Verification

- [x] 3.1 Add or update focused installer tests covering public raw/stdin detection selecting remote managed mode.
- [x] 3.2 Add or update focused installer tests covering local script execution selecting the script repository root.
- [x] 3.3 Add or update focused installer tests covering explicit local and remote mode overrides.
- [x] 3.4 Add or update focused installer tests proving local checkout mode does not clone, fetch, checkout, pull, or mutate the managed checkout.
- [x] 3.5 Verify the selected source must contain `apps/cli/dist/index.js` before global installation in both modes.
- [x] 3.6 Run the relevant shell installer tests, affected CLI tests, `pnpm run check:cli-dist`, and OpenSpec validation for `apps-cli-local-installer-mode`.
