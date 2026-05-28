# CLI Agent Contract Design

## Context

The CLI currently supports two command families:

- `scripts`, which discovers bundled script packages and can prompt for script selection.
- `codex-plugins`, which discovers and installs local Codex plugins and can prompt for plugin selection.

Both commands already contain pieces of an agent-friendly design. They detect non-TTY sessions and avoid some prompts, and `codex-plugins` supports explicit selections through flags. The gap is that these behaviors are local to each command rather than expressed as a whole-CLI contract. Bundled scripts also need a clear way to receive parsed command arguments and execution context.

## Goal

Make the CLI usable by humans, agents, and CI without splitting it into separate tools.

The human path should stay convenient:

- Prompts are allowed when the terminal is interactive.
- Text output can be readable and status-oriented.
- Existing command examples should remain natural.

The agent path must be deterministic:

- No command should wait for input in non-interactive mode.
- Required inputs must be expressible as flags or positional arguments.
- Missing required inputs must fail with a non-zero exit code.
- Machine-readable output must be available through a stable JSON mode.
- Errors and warnings must not be mixed into JSON stdout.

## Non-Goals

- Replace `citty`.
- Redesign every bundled script API upfront.
- Make the CLI a long-running service.
- Add remote execution, scheduling, or plugin discovery outside the current repository.
- Remove human-oriented prompts and formatted output.

## Proposed Approach

Adopt a whole-CLI agent contract and implement it as a thin runtime layer shared by commands.

The CLI should expose common execution flags:

- `--json` requests machine-readable stdout.
- `--no-interactive` disables prompts even when a TTY is available.
- `--quiet` suppresses non-essential human text where the command supports it.

The runtime should derive a command context:

```ts
type CliContext = {
  readonly isTty: boolean;
  readonly interactive: boolean;
  readonly json: boolean;
  readonly quiet: boolean;
};
```

Commands should accept the context through their dependency boundary rather than reading `process.stdin.isTTY` directly in each implementation. Existing direct console output can be migrated incrementally, but JSON mode should be strict from the first implementation.

## Command Behavior

### Global Rules

Every command must follow these rules:

- If `context.interactive` is false, do not call prompt APIs.
- If required input is missing in non-interactive mode, fail with a usage-style error and exit non-zero.
- If `--json` is set, stdout must contain one valid JSON value.
- Human warnings and errors go to stderr.
- JSON results should include enough fields for agents to decide the next step without scraping prose.

### `scripts`

The `scripts` command should support:

```bash
cthutool-cli scripts
cthutool-cli scripts convert-to-cbz --input ./samples --format jpg
cthutool-cli scripts convert-to-cbz --input ./samples --json
cthutool-cli scripts --script convert-to-cbz --input ./samples --no-interactive
```

Expected behavior:

- With no script id and interactive mode, show the existing selection prompt.
- With no script id and non-interactive mode, fail with a clear message.
- Pass remaining command arguments and `CliContext` to the selected bundled script.
- Preserve the current explicit id and `--script` behavior.

Bundled script default exports should move toward this shape:

```ts
type BundledScriptContext = {
  readonly cli: CliContext;
};

type BundledScriptMain<TArgs = unknown> = (
  args: TArgs,
  context: BundledScriptContext,
) => void | Promise<void>;
```

### `convert-to-cbz`

`convert-to-cbz` should be the first bundled script proving the contract.

Behavior:

- If `--input` is present, run directly.
- If `--input` is missing and interactive mode is enabled, prompt for it.
- If `--input` is missing and interactive mode is disabled, fail without prompting.
- In JSON mode, emit a conversion summary object.
- In human mode, keep the existing completion card.

Suggested JSON shape:

```json
{
  "ok": true,
  "command": "scripts",
  "script": "convert-to-cbz",
  "summary": {
    "totalFiles": 0,
    "successCount": 0,
    "failureCount": 0,
    "outputRoot": "",
    "durationMs": 0
  }
}
```

### `codex-plugins`

`codex-plugins` should also support the shared contract:

```bash
cthutool-cli codex-plugins --json
cthutool-cli codex-plugins --plugin english-coach --json
cthutool-cli codex-plugins --all --sync-cache --no-interactive
```

Expected behavior:

- With no selection and interactive mode, preserve the multiselect prompt.
- With no selection and non-interactive mode, list status and exit zero.
- With `--plugin` or `--all`, install/update explicitly selected plugins.
- In JSON mode, output status and result objects rather than prose.

Suggested JSON shape for status-only:

```json
{
  "ok": true,
  "command": "codex-plugins",
  "plugins": [
    {
      "name": "english-coach",
      "displayName": "English Coach",
      "status": "installed",
      "targetPath": "./packages/codex-plugins/plugins/english-coach"
    }
  ],
  "results": []
}
```

## Error Handling

Use a small command error model instead of ad hoc thrown strings at command boundaries.

```ts
type CliError = {
  readonly code: string;
  readonly message: string;
  readonly exitCode: number;
};
```

Recommended codes:

- `missing_required_argument`
- `unknown_selection`
- `ambiguous_selection`
- `discovery_failed`
- `script_load_failed`
- `script_execution_failed`
- `invalid_option`

Human mode should render concise messages. JSON mode should render:

```json
{
  "ok": false,
  "error": {
    "code": "missing_required_argument",
    "message": "script id is required in non-interactive mode"
  }
}
```

Error JSON should be written to stdout only when `--json` is requested and the process is deliberately producing machine-readable output. Diagnostic warnings still belong on stderr.

## Data Flow

```text
argv
  |
  v
citty command parser
  |
  v
shared CliContext
  |
  +--> command implementation
         |
         +--> prompt only if context.interactive
         |
         +--> domain operation
         |
         +--> human renderer or JSON renderer
```

For bundled scripts:

```text
scripts command
  |
  +--> resolve script package
  |
  +--> parse/forward script args
  |
  +--> runBundledScript(pkg, args, context)
          |
          +--> script default export(args, { cli: context })
```

## Testing Strategy

Add tests in small layers:

- Unit test context derivation from args and TTY state.
- Unit test output rendering for success and error JSON.
- Unit test `runBundledScript` passes args and context to the script export.
- Integration test `scripts` without id fails in non-interactive mode.
- Integration test `scripts convert-to-cbz --input ... --json` does not prompt.
- Integration test `codex-plugins --json` emits parseable JSON.
- Integration test `codex-plugins --plugin ... --json` emits parseable results.

Existing integration tests should continue to pass. Tests should avoid relying on terminal color or prompt rendering.

## Rollout Plan

1. Add shared context and output helpers.
2. Add global flags to top-level command definitions where supported by `citty`.
3. Migrate `scripts` to pass context and script args.
4. Migrate `convert-to-cbz` as the first bundled script consumer.
5. Migrate `codex-plugins` status and install output.
6. Update README with human and agent examples.
7. Add a short command authoring checklist for future CLI commands.

## Open Decisions

### Argument Forwarding

The implementation should confirm the cleanest `citty` pattern for forwarding script-specific args after the selected script id. If `citty` cannot preserve unknown options cleanly, use an explicit separator:

```bash
cthutool-cli scripts convert-to-cbz -- --input ./samples --format jpg
```

The preferred user-facing form remains:

```bash
cthutool-cli scripts convert-to-cbz --input ./samples --format jpg
```

### JSON Error Stream

JSON command errors should be written to stdout when `--json` is set, because agents commonly parse stdout. Fatal diagnostics that are not part of the response contract should stay on stderr.

### Non-Interactive `codex-plugins`

When no plugin is selected in non-interactive mode, the command should list status and exit zero. This matches the current behavior and makes status inspection useful for agents.

## Acceptance Criteria

- `cthutool-cli codex-plugins --json` prints one parseable JSON object and exits zero when plugins can be discovered.
- `cthutool-cli codex-plugins --plugin english-coach --json` prints install/update results as JSON.
- `cthutool-cli scripts` still supports interactive script selection in a TTY.
- `cthutool-cli scripts` fails without hanging when run without a script id in non-interactive mode.
- `cthutool-cli scripts convert-to-cbz --input ./samples --json` does not prompt and prints one parseable JSON object.
- Missing required inputs in non-interactive mode produce non-zero exit codes.
- README documents both human and agent usage.
