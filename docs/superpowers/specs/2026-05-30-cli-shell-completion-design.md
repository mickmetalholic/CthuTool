# CLI Shell Completion Design

## Context

The repository exposes a Node-backed `chc` CLI from the root package bin entry. The CLI implementation lives under `apps/cli`, uses `citty` for command definitions, and currently registers top-level command groups such as `codex` and `scripts`.

The current `citty@0.1.6` dependency provides command definitions, argument parsing, usage rendering, and nested subcommands, but it does not provide built-in shell completion generation. Shell completion therefore needs a small project-owned adapter layer.

The CLI also has dynamic command content. The `scripts` command discovers bundled script packages under `apps/cli/src/scripts`, so shell completion should not hard-code those script ids in PowerShell and zsh scripts.

## Goals

- Add shell completion support for PowerShell and zsh.
- Expose a user-facing command that prints shell-specific registration scripts.
- Keep shell-specific adapters thin and generated on demand.
- Keep completion candidate logic inside the CLI so command and script changes are reflected in one place.
- Complete bundled script ids dynamically by reusing existing script discovery.
- Avoid interactive prompts, human status cards, and JSON contract output during completion.
- Document setup commands in `apps/cli/README.md`.

## Non-Goals

- Do not replace `citty` or migrate to a different CLI framework.
- Do not add bash or fish completion in the first implementation.
- Do not commit generated shell adapter files under `.claude/`, `.codex/`, `.cursor/`, or other agent-specific folders.
- Do not implement fuzzy matching, ranking, persistent completion caches, or shell-specific descriptions beyond what the shell bridge can support safely.
- Do not make shell completion depend on Bun at runtime. The global `chc` command remains Node-backed.

## Recommended Approach

Add a dynamic CLI-backed completion protocol.

The CLI should expose:

```text
chc completion powershell
chc completion zsh
chc __complete [words...]
```

`chc completion <shell>` prints a shell registration script for the selected shell. That script registers native shell completion for `chc` and calls back into `chc __complete` whenever completion candidates are needed.

`chc __complete` is an internal command. It accepts the current command words from the shell adapter and prints completion candidates in a stable, line-oriented format. The first version can use plain candidate values, one per line. Descriptions can be added later if both shell adapters support them consistently.

## Alternatives Considered

### Static Shell Scripts

Static PowerShell and zsh scripts would be quick to add, but every CLI command, flag, and bundled script id change would require manually updating shell-specific files. This is fragile for a CLI that already discovers bundled scripts dynamically.

### CLI-Backed Dynamic Completion

This keeps the shell adapters small and centralizes candidate generation in TypeScript. It reuses the `citty` command definitions and bundled script discovery. This is the recommended path because it has the lowest long-term maintenance cost.

### CLI Framework Migration

Switching from `citty` to a framework with built-in completion could reduce custom code later, but it is too invasive for this feature. The existing CLI already has command contracts, tests, and bundled script behavior built around `citty`.

## Command Surface

The public command group is `completion`.

Expected usage:

```powershell
chc completion powershell
```

```zsh
chc completion zsh
```

PowerShell users can load it in their profile with:

```powershell
chc completion powershell | Out-String | Invoke-Expression
```

zsh users can load it in `~/.zshrc` with:

```zsh
eval "$(chc completion zsh)"
```

The internal command is `__complete`. It should be hidden from normal help if practical. If `citty` does not support hidden commands, the command can exist without README promotion and with a description that marks it internal.

## Completion Candidate Rules

Candidate generation should traverse the current command path:

- At the root, complete top-level command names such as `codex`, `scripts`, and `completion`.
- Under `codex`, complete subcommands such as `status`, `export`, and `apply`.
- Under `completion`, complete supported shell names: `powershell` and `zsh`.
- Under `scripts`, complete discovered bundled script ids when no script id has been selected.
- For each command, complete declared long flags from its `citty` args.
- Do not suggest flags that already appear in the command line unless the flag can reasonably be repeated. Version 1 can treat all known flags as non-repeatable.
- Preserve existing shell file/path completion behavior when there is no CLI candidate to provide.

Common flags should include the shared CLI contract flags where available:

```text
--json
--no-interactive
--quiet
```

Command-specific flags should come from the command definitions. For example, `codex status` should include `--details` and config path override flags, while `scripts` should include `--script`.

## Architecture

Add a reusable main command module, for example `apps/cli/src/main-command.ts`, so runtime execution and completion introspection use the same command tree.

Add a small completion domain module, for example `apps/cli/src/domain/shell-completion.ts`, that owns:

- Resolving command metadata from `citty` command definitions.
- Finding the active command path from words supplied by the shell.
- Extracting subcommand names and argument flags.
- Calling bundled script discovery for `scripts` command candidates.
- Formatting candidates for shell adapters.

Add a command module, for example `apps/cli/src/command/completion.command.ts`, that owns:

- `completion powershell`
- `completion zsh`
- `__complete`

Keep command modules thin. The shell script text can live near the command module or in a small renderer module. It should not be generated into repository agent folders.

## Completion Protocol

The shell adapter should call:

```text
chc __complete <word-0> <word-1> ... <current-word>
```

The command should write candidates to stdout, one candidate per line, and write no human status text. Expected failures should produce no candidates and exit successfully where that gives the best shell experience. Unexpected internal failures may exit non-zero, but should keep stderr quiet unless the user invokes `__complete` directly for debugging.

Examples:

```text
chc __complete ""
codex
scripts
completion
```

```text
chc __complete codex ""
status
export
apply
```

```text
chc __complete scripts ""
convert-to-cbz
hello-world
second-script
```

## Error Handling

Completion must be conservative. If the command path is unknown, script discovery fails, or the shell passes an unexpected word shape, the CLI should return no candidates rather than breaking the user's shell prompt.

The public `completion` command should fail with the existing command error style when an unsupported shell is requested.

`__complete` should not prompt, even if the `scripts` command would normally prompt in an interactive terminal. Completion is always a non-interactive lookup.

## Testing

Add focused tests for:

- `chc completion powershell` outputs a PowerShell registration script containing `Register-ArgumentCompleter` and a call to `chc __complete`.
- `chc completion zsh` outputs a zsh completion function and `compdef`.
- `chc completion fish` or another unsupported shell fails clearly.
- Root completion returns top-level commands.
- `codex` completion returns its nested subcommands.
- `completion` completion returns `powershell` and `zsh`.
- `scripts` completion returns discovered bundled script ids.
- Flag completion includes shared contract flags and command-specific flags.
- Completion does not trigger prompts and does not write human status text to stderr.

## Documentation

Update `apps/cli/README.md` with a Shell Completion section showing:

```powershell
chc completion powershell | Out-String | Invoke-Expression
```

```zsh
eval "$(chc completion zsh)"
```

The README should mention that completion depends on the globally installed or linked `chc` command, so users should run `npm install -g .` or `npm link` and build the CLI first.

## Open Questions

- Should descriptions be added to candidates after the basic one-candidate-per-line protocol is stable?
- Should bash and fish be added after PowerShell and zsh prove the protocol?
- Should `__complete` be formally documented for contributors as an internal protocol?
