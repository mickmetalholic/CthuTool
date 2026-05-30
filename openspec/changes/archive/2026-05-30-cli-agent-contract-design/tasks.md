## 1. Runtime Contract

- [x] 1.1 Add a shared `CliContext` type and context derivation helper for TTY, `--json`, `--no-interactive`, and `--quiet`.
- [x] 1.2 Add a command error model with stable codes, messages, and exit codes.
- [x] 1.3 Add output helpers for JSON success, JSON command errors, human errors, warnings, and quiet-aware human status.
- [x] 1.4 Add unit tests for context derivation, JSON rendering, human error rendering, and stderr diagnostics behavior.

## 2. scripts Command and Bundled Script Boundary

- [x] 2.1 Add shared contract flags to the `scripts` command and derive `CliContext` at the command boundary.
- [x] 2.2 Preserve interactive script selection when no id is provided and `context.interactive` is true.
- [x] 2.3 Return a `missing_required_argument` error without prompting when no script id is provided and `context.interactive` is false.
- [x] 2.4 Update `runBundledScript` to pass parsed script arguments and `{ cli: context }` to the script default export.
- [x] 2.5 Verify the `citty` argument forwarding behavior for script-specific options and implement separator fallback if required.
- [x] 2.6 Add tests that `scripts` forwards args/context and that missing id fails without hanging in non-interactive mode.

## 3. convert-to-cbz Migration

- [x] 3.1 Update `convert-to-cbz` to accept `(args, context)` through the bundled script contract.
- [x] 3.2 Prompt for `input` only when the shared context is interactive.
- [x] 3.3 Return a `missing_required_argument` command error when `input` is missing in non-interactive mode.
- [x] 3.4 Emit the existing completion card in human mode.
- [x] 3.5 Emit one JSON summary object in JSON mode with command, script, and conversion summary fields.
- [x] 3.6 Add integration coverage for `scripts convert-to-cbz --input ... --json` and non-interactive missing input.

## 4. codex-plugins Migration

- [x] 4.1 Add shared contract flags to `codex-plugins` and derive `CliContext` at the command boundary.
- [x] 4.2 Render plugin status and operation results through human or JSON output paths.
- [x] 4.3 Preserve the multiselect prompt when no selection is provided and `context.interactive` is true.
- [x] 4.4 Keep non-interactive no-selection behavior as status-only exit zero without prompting.
- [x] 4.5 Map unknown plugin selections to an `unknown_selection` command error.
- [x] 4.6 Include install/update, cache sync, and patch bump outcomes in JSON results.
- [x] 4.7 Add integration coverage for `codex-plugins --json`, `--plugin english-coach --json`, and non-interactive status-only behavior.

## 5. Documentation and Verification

- [x] 5.1 Update `apps/cli/README.md` with human and agent usage examples for `scripts`, `convert-to-cbz`, and `codex-plugins`.
- [x] 5.2 Add a concise command authoring checklist for future CLI commands.
- [x] 5.3 Run the CLI test suite for `apps/cli` and fix regressions.
- [x] 5.4 Run OpenSpec validation for `cli-agent-contract-design`.
