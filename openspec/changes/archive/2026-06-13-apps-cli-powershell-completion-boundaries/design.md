## Context

The existing shell completion implementation uses a simple line-oriented protocol:

```text
chc __complete <word-0> <word-1> ... <current-word>
```

That model works when the shell can pass an empty current word as an actual empty argument. On Windows, the global `chc` command is commonly reached through a `.cmd` shim, including Volta-managed shims. Those shims can drop empty string arguments, so `chc __complete browser ""` can arrive as `chc __complete browser`.

PowerShell also uses each completion candidate's `CompletionText` as the replacement for the active word. If `chc browse` completes to `browser` without a trailing space, the cursor remains on the `browser` word. A second Tab treats `browser` as the replaceable current word, so child commands such as `auth` can replace it and produce `chc auth`.

## Goals / Non-Goals

**Goals:**

- Keep the internal completion protocol line-oriented and easy to test.
- Make PowerShell command candidates advance the cursor into the next command position.
- Preserve correct nested completion after a completed command path such as `chc browser `.
- Avoid relying on Windows command shims to preserve empty string arguments.
- Keep zsh behavior unchanged unless it shows the same boundary failure.

**Non-Goals:**

- Do not redesign completion candidate output as JSON.
- Do not add shell-specific static command lists.
- Do not introduce persistent completion caches.
- Do not add support for new shells.

## Decisions

1. Keep `__complete browser` as current-word completion.
   - Rationale: Without an explicit empty word, `browser` is still the active token. Returning `browser` lets the shell finish the token safely.
   - Alternative considered: Treat exact command matches as nested completion. This fixes `chc browser <Tab>` in one case but lets the next candidate replace `browser`, producing `chc auth`.

2. Let the PowerShell adapter append trailing spaces for non-flag candidates.
   - Rationale: Completing command names, shell names, and script ids should advance to the next token. Flags should not get automatic spacing because users may keep typing flag names or use `--flag=value`.
   - Alternative considered: Make `__complete` return shell-specific candidate metadata. That would complicate the simple protocol and duplicate shell concerns in the domain layer.

3. Use an adapter-owned sentinel for empty current words.
   - Rationale: PowerShell can pass a non-empty marker through `.cmd` shims reliably. The internal command can translate that marker back to an empty string before candidate generation.
   - Alternative considered: Quote `""` differently in the generated script. This still depends on shim-specific argument handling.

## Candidate Flow

For command-position completion:

```text
PowerShell line: chc browse
Adapter call:    chc __complete browse
Protocol result: browser
CompletionText:  browser<space>
Final line:      chc browser<space>
```

For nested completion after a completed command path:

```text
PowerShell line: chc browser<space>
Adapter call:    chc __complete browser __cthutool_empty_completion_word__
Internal words:  browser ""
Protocol result: auth, doctor, install
CompletionText:  auth<space>, doctor<space>, install<space>
```

## Risks / Trade-offs

- [Risk] The sentinel could conflict with a real user token. Mitigation: use a long project-specific marker that is only emitted by generated shell adapters.
- [Risk] Automatically adding spaces to all non-flag candidates could be wrong for future value completions. Mitigation: current completion only returns commands, shell names, and script ids for non-flag candidates; revisit if value completion is added.
- [Risk] PowerShell behavior differs from zsh. Mitigation: isolate this behavior in the PowerShell adapter and keep the internal protocol stable.

## Rollback

Remove the PowerShell adapter's trailing-space candidate text and empty-word marker translation. The CLI would return to the previous generic line-oriented behavior, but the PowerShell boundary bug would return.
