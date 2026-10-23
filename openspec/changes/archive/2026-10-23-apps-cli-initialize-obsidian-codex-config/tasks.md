## 1. Local configuration initialization

- [x] 1.1 Extend setup preview and confirmation for missing Codex config; verify CLI integration coverage requires `--yes` when only the config is missing.
- [x] 1.2 Create the missing TOML file exclusively and preserve existing settings; verify creation, preservation, path conflict, and preview-change integration cases.
- [x] 1.3 Include Codex config presence in read-only JSON and human status; verify missing-file status leaves the file absent and existing `hooks = true` remains healthy.

## 2. Documentation and distribution

- [x] 2.1 Document per-machine setup, existing-file preservation, and vault-root scope; verify the CLI README matches the delivered behavior.
- [x] 2.2 Refresh the committed CLI bundle; verify the installed `chc` creates, preserves, and repairs config files in an isolated temporary vault.

## 3. Validation and specification sync

- [x] 3.1 Run all seven affected Obsidian test files and confirm all 43 tests pass.
- [x] 3.2 Run CLI TypeScript checks, targeted Biome checks, and `git diff --check`; verify no diagnostics remain.
- [x] 3.3 Sync the delta into the main spec, compare every scenario, and pass strict change validation plus main-spec validation (72 specs passed).
- [x] 3.4 Review the exact diff and confirm generated agent skills and the CthuCodex business plugin remain unchanged.
