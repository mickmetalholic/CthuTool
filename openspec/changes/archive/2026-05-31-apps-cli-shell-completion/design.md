## Context

The CLI currently exposes a root `chc` command through the root package bin entry. The implementation is TypeScript under `apps/cli`, built to `apps/cli/dist/index.js`, and executed by a Node-backed bin shim.

Commands are defined with `citty`. The active `citty@0.1.6` dependency supports nested commands, argument definitions, usage rendering, and parsing, but not shell completion generation. The CLI also has dynamic command content because `chc scripts` discovers bundled scripts from the repository.

## Goals / Non-Goals

**Goals:**

- Support interactive shell completion for PowerShell and zsh.
- Keep shell adapter scripts generated on demand through `chc completion`.
- Keep candidate generation inside the CLI so command and script changes are reflected automatically.
- Reuse existing `citty` command definitions and bundled script discovery.
- Avoid prompts, human status output, and JSON contract output during completion.
- Keep runtime support Node-backed, matching the global `chc` command.

**Non-Goals:**

- Do not replace `citty`.
- Do not support bash or fish in the first implementation.
- Do not commit generated shell adapter files under agent-specific folders.
- Do not add fuzzy search, persistent caches, or ranked suggestions.
- Do not make completion depend on Bun in installed usage.

## Decisions

1. Add a public `completion` command group.
   - Rationale: Users need a discoverable command that prints shell setup scripts without copying files from the repository.
   - Alternative considered: Check generated completion files into the repo. This would drift and conflicts with the agent adapter policy.

2. Add an internal `__complete` command for shell adapters.
   - Rationale: PowerShell and zsh differ in registration syntax, but both can call a CLI process to retrieve candidates.
   - Alternative considered: Encode all candidates in shell scripts. This would duplicate CLI structure in each shell.

3. Extract the root command tree into a reusable module.
   - Rationale: Runtime execution and completion should use the same command definitions. A shared command tree avoids drift between help, parsing, and completion.
   - Alternative considered: Maintain a separate completion tree. This is simpler initially but easy to forget when commands change.

4. Return plain newline-delimited candidates from `__complete`.
   - Rationale: A line-oriented protocol is easy to consume from PowerShell and zsh and easy to test.
   - Alternative considered: JSON output. It is more extensible, but shell adapters would need extra parsing and this output is not part of the user-facing JSON contract.

5. Complete bundled script ids dynamically.
   - Rationale: The `scripts` command already has discovery logic. Completion should reflect the same set of available scripts.
   - Alternative considered: Hard-code current script ids. This would become stale as scripts are added or removed.

## Architecture

The implementation should add three pieces:

1. `main-command` module
   - Exports the root `citty` command definition.
   - Registers existing `codex` and `scripts` command groups.
   - Registers the new `completion` command group and internal `__complete` command.

2. Completion domain module
   - Resolves command metadata from `citty` command definitions.
   - Tracks the active command path from the words supplied by the shell adapter.
   - Suggests subcommands when the cursor is in command position.
   - Suggests flags from command `args` when the current word starts with `-`.
   - Suggests dynamic bundled script ids for `chc scripts`.
   - Filters candidates by the current word prefix.

3. Completion command module
   - Implements `chc completion powershell`.
   - Implements `chc completion zsh`.
   - Implements `chc __complete`.
   - Renders shell adapter scripts that call back into `chc __complete`.

## Candidate Behavior

At the root, completion should include public command groups:

```text
codex
scripts
completion
```

Under `codex`, completion should include registered subcommands such as:

```text
status
export
apply
```

Under `completion`, completion should include:

```text
powershell
zsh
```

Under `scripts`, completion should include discovered script ids when no script has been selected yet.

For flags, completion should include long flags declared in the active command's `args`, including shared CLI contract flags such as:

```text
--json
--no-interactive
--quiet
```

Command-specific flags should come from their command definitions, such as `--details` for `codex status` and `--script` for `scripts`.

## Completion Protocol

Shell adapters should call:

```text
chc __complete <word-0> <word-1> ... <current-word>
```

`__complete` should write one candidate per stdout line. It should not write normal command output, progress, prompts, or JSON contract responses.

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

Completion should fail quietly where possible. If the shell passes unexpected words, command traversal cannot resolve a path, or dynamic script discovery fails, `__complete` should return no candidates and avoid stderr noise.

The public `completion` command should use normal CLI error handling for unsupported shell names.

Completion must never trigger interactive script selection prompts.

## Documentation

Add a Shell Completion section to `apps/cli/README.md`:

```powershell
chc completion powershell | Out-String | Invoke-Expression
```

```zsh
eval "$(chc completion zsh)"
```

The section should note that the global or linked `chc` command must be available first.

## Risks / Trade-offs

- [Risk] Candidate generation can drift from runtime commands if a separate tree is introduced. Mitigation: export and reuse the actual root command definition.
- [Risk] Shell escaping can be brittle. Mitigation: keep shell scripts small and add tests that assert the scripts call `chc __complete`.
- [Risk] Dynamic script discovery might be slow if many scripts are added. Mitigation: rely on current lightweight discovery first; add caching only if measured.
- [Risk] Internal `__complete` might appear in help if `citty` cannot hide commands. Mitigation: mark it clearly as internal and avoid documenting it as a user command.

## Rollback

If shell completion causes issues, remove the `completion` and `__complete` command registrations. Existing `codex` and `scripts` behavior should remain unaffected because completion is additive.
