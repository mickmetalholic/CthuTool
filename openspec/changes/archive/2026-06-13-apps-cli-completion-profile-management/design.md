## Context

`chc completion powershell` prints a PowerShell `Register-ArgumentCompleter` script, and users can load it for the current session with `chc completion powershell | Out-String | Invoke-Expression`. Persistent setup currently requires editing `$PROFILE` manually. That is easy to get slightly wrong, and disabling it later requires remembering which line was added.

The CLI should manage only the part it owns. User profiles often contain unrelated shell setup, so persistence must use a clearly marked block and deletion must be limited to that block.

## Goals / Non-Goals

**Goals:**
- Provide explicit commands for persistent PowerShell completion lifecycle management.
- Keep the operation idempotent: enabling twice should not duplicate profile content; disabling twice should be safe.
- Preserve existing script-generation behavior and shell completion protocol behavior.
- Report the target profile path and status in a user-readable way.

**Non-Goals:**
- Automatically modifying zsh startup files in this change.
- Managing arbitrary user-authored `chc completion powershell` lines that predate this command.
- Enabling completion implicitly during install.

## Decisions

### Use `completion enable|disable|status powershell`

The new commands live under the existing `completion` group because they manage completion lifecycle, not general CLI configuration.

Alternative considered: a top-level `chc completion-enable` command. That would be simpler to parse but would scatter completion behavior across the CLI and make completion discovery less natural.

### Manage a marker block instead of a bare line

The profile entry should be wrapped in markers such as:

```powershell
# >>> cthutool chc completion >>>
chc completion powershell | Out-String | Invoke-Expression
# <<< cthutool chc completion <<<
```

This gives disable a precise ownership boundary. It also allows the command to replace an older managed block if the loading line changes in the future.

Alternative considered: append a single line and remove matching lines. That is riskier because a user might have added a custom wrapper or comment that also mentions `chc completion powershell`.

### Resolve the PowerShell profile path through PowerShell

The CLI should resolve `$PROFILE.CurrentUserCurrentHost` by invoking the active PowerShell executable when possible, then create the containing directory and profile file as needed. This keeps behavior aligned with PowerShell rather than hardcoding Windows profile paths.

If profile path resolution fails, the command should return a clear error and include the manual one-liner as a fallback.

## Risks / Trade-offs

- Profile path resolution depends on a PowerShell executable being available -> report a clear failure instead of guessing a path.
- Marker block deletion will not remove older manually added lines -> safer default; `status` can distinguish managed installation from no managed block.
- Running `enable` changes user shell startup behavior -> require an explicit command and print the exact profile path touched.

## Migration Plan

Existing users can continue using `chc completion powershell | Out-String | Invoke-Expression` manually. After this change, they can run `chc completion enable powershell` to install a managed block and `chc completion disable powershell` to remove that managed block.
