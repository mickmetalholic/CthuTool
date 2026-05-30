## Context

The CLI is a Bun/TypeScript command surface built with `citty`. It currently exposes `scripts` and `codex-plugins` from `apps/cli/src/index.ts`. Both commands already contain local prompt gating through dependency-injected `isInteractive` helpers, but each command decides its own output, error, and execution behavior.

The `scripts` command discovers bundled script packages, resolves a script id from either a positional argument or `--script`, and invokes `runBundledScript(pkg)` with no script arguments. The first target bundled script, `convert-to-cbz`, currently reads its own `args` parameter but is invoked without parsed command arguments from the parent command. It prompts for `--input` unconditionally when the input is missing.

The `codex-plugins` command lists plugin status, optionally prompts for selections, and installs or refreshes selected plugins. It has explicit selection flags, but its machine-readable contract is not yet defined and human status text is always printed to stdout.

## Goals / Non-Goals

**Goals:**

- Establish a shared `CliContext` that captures TTY, interactivity, JSON output, and quiet output for command implementations.
- Make prompt usage depend on `context.interactive`, not direct `process.stdin.isTTY` checks inside commands or scripts.
- Provide strict JSON stdout for commands that opt into `--json`.
- Keep human output readable and preserve existing interactive workflows.
- Forward parsed script arguments and CLI context from `scripts` to bundled scripts.
- Prove the contract through `scripts`, `convert-to-cbz`, and `codex-plugins` tests.

**Non-Goals:**

- Replacing `citty`.
- Redesigning every bundled script API before the first migration.
- Turning the CLI into a long-running service.
- Adding remote execution, scheduling, or plugin discovery outside the repository.
- Removing human-oriented prompts or formatted human output.

## Decisions

### Shared Runtime Helpers

Add a small CLI runtime layer under `apps/cli/src/runtime/` or an equivalent local boundary:

- `CliContext` with `isTty`, `interactive`, `json`, and `quiet`.
- `createCliContext(args, deps)` or similar, where `deps` supplies TTY state for tests.
- output helpers for JSON success, JSON error, human warning/error, and optional quiet human text.
- a `CliError` model with code, message, and exit code.

Rationale: the commands are small enough that a large framework would be noise, but centralizing context and output keeps agent behavior consistent.

Alternative considered: keep adding flags directly in each command. That would be faster for one command but repeats the exact logic the change is meant to make contractual.

### Command-Level Context Injection

Commands should construct `CliContext` at the command boundary and pass it down through dependencies and domain-facing functions. Command code may still receive raw `args` from `citty`, but prompt decisions and output rendering must use the context.

Rationale: this keeps tests simple and prevents bundled scripts from reaching for process globals. It also matches the existing test-friendly dependency style in `createScriptsCommand` and `createCodexPluginsCommand`.

Alternative considered: a process-global singleton context. That would simplify call signatures but make tests and nested script execution more brittle.

### JSON Stdout Is Exclusive

When `context.json` is true, stdout should contain exactly one JSON value for the command result or deliberate command error. Warnings and diagnostics that are not part of the response contract stay on stderr.

Rationale: agents commonly parse stdout. Mixing human status lines with JSON makes the contract unreliable.

Alternative considered: write all errors to stderr, including JSON errors. This preserves traditional stream separation but makes agent parsing less predictable for expected command failures.

### Bundled Script Contract

Update `runBundledScript` to accept parsed script arguments and a bundled script context:

```ts
type BundledScriptContext = {
  readonly cli: CliContext;
};
```

Script default exports should move toward `(args, context) => void | Promise<void>`. `convert-to-cbz` becomes the first migrated script.

Rationale: bundled scripts need a reliable way to receive parsed arguments and prompt/output policy from the parent CLI.

Alternative considered: let each bundled script parse `process.argv`. That would make direct execution convenient, but it duplicates command parsing and makes `scripts` unable to guarantee agent behavior.

### Script Argument Forwarding

Prefer supporting the natural command form:

```bash
cthutool-cli scripts convert-to-cbz --input ./samples --format jpg
```

If `citty` cannot preserve unknown options after the script id, add support for an explicit separator form as a fallback:

```bash
cthutool-cli scripts convert-to-cbz -- --input ./samples --format jpg
```

Rationale: the natural form is friendlier for humans and agents, but the implementation should stay honest about parser limits.

Alternative considered: require every bundled script option to be declared on the parent `scripts` command. That would make the parent command grow every time a script changes.

## Risks / Trade-offs

- [Risk] `citty` may normalize or reject unknown script-specific options before the command can forward them. -> Mitigation: verify parser behavior early and document the separator fallback if needed.
- [Risk] JSON mode could accidentally include existing human status output from discovery or install paths. -> Mitigation: centralize rendering and add integration tests that parse stdout as JSON.
- [Risk] Existing tests assert human text that changes during output refactoring. -> Mitigation: preserve human messages where practical and add JSON-specific tests separately.
- [Risk] `convert-to-cbz` direct execution may diverge from `scripts` execution. -> Mitigation: keep its default export callable with explicit args/context and provide minimal defaults only where needed.

## Migration Plan

1. Add runtime context, error, and output helpers with unit tests.
2. Add shared flags to the command surfaces that need the contract.
3. Update `scripts` to derive context, preserve interactive selection, and fail without prompting when a script id is missing in non-interactive mode.
4. Update `runBundledScript` to pass parsed args and `{ cli: context }`.
5. Migrate `convert-to-cbz` to honor context, support non-interactive missing-input failure, and emit JSON summaries.
6. Update `codex-plugins` to render status/results through human or JSON output modes.
7. Update README and command authoring guidance.

Rollback is straightforward because changes are local to `apps/cli`: revert the runtime helper usage and restore direct command output if the contract proves too large for the first iteration.

## Open Questions

- Confirm the exact `citty` behavior for unknown options after a positional script id.
- Decide whether `--quiet` should suppress all status-only human output or only optional progress text for each command.
- Decide whether direct execution of bundled script entry files remains a supported public path or only a development convenience.
