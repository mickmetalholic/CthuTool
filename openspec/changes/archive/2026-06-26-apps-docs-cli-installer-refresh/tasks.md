## 1. Source Review

- [x] 1.1 Review `scripts/install-chc.sh`, CLI root commands, `apps/cli/README.md`, and CLI installer/distribution specs.

## 2. User Installation Docs

- [x] 2.1 Update `client/cli.md` for target prerequisites, committed bundle behavior, installer modes, overrides, update commands, and uninstall path.
- [x] 2.2 Update `modules/cli.md` with current install/update/runtime behavior and spec links.
- [x] 2.3 Update `reference/cli.md` to prefer `chc update`, list `version/status/update`, and keep `self-update` as an alias.

## 3. Validation

- [x] 3.1 Run focused docs validation or equivalent docs index/build/typecheck steps.
- [x] 3.2 Run `openspec validate apps-docs-cli-installer-refresh --strict`.
