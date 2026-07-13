## 1. Shared Command Registration

- [x] 1.1 Add a thin command registration model for Citty definitions, public/compat/internal visibility, and help/run bare behavior, then construct the root command tree from those registrations.
- [x] 1.2 Make root help, root completion, and bare-command routing consume registration metadata; remove command-name visibility filters and the omitted-command whitelist.
- [x] 1.3 Add invariant tests proving public static operations agree across dispatch, help, and completion while compatibility and internal operations remain callable but hidden.

## 2. Completion Command Tree

- [x] 2.1 Centralize supported completion shells and their adapter renderers so validation, help, and completion candidates share one definition.
- [x] 2.2 Refactor `completion` into real `powershell`, `zsh`, `enable`, `disable`, and `status` child commands and remove parent-level lifecycle `rawArgs` parsing.
- [x] 2.3 Update completion integration tests to cover bare group help, child dispatch, derived candidates, unsupported shells, and unchanged adapter/profile behavior.

## 3. Bundled Script Discovery

- [x] 3.1 Add shared bounded catalog rendering, `scripts list` human/JSON output, and reserved-id validation for static `list` and `run` operations.
- [x] 3.2 Add the canonical `scripts run <id>` flow and interactive missing-id behavior while retaining `scripts <id>` and `scripts --script <id>` compatibility routing through the same runner.
- [x] 3.3 Render dynamic `AVAILABLE SCRIPTS` group help and make help, list, completion, selection, and execution consume the same discovery provider; add consistency and failure-path tests.

## 4. Documentation and Verification

- [x] 4.1 Update root, CLI, and docs-site command documentation with the canonical completion tree, `scripts list`, `scripts run`, available-script help, and preserved shorthand forms.
- [x] 4.2 Refresh the committed CLI runtime bundle and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
- [x] 4.3 Run CLI formatting/lint, type checking, full CLI tests, committed-bundle verification, docs build, OpenSpec strict validation, and command help/completion smoke tests.
