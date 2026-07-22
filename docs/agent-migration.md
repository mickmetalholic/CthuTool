# Migrate CthuDesktop data to the local Agent

The local Agent performs a one-time, non-destructive migration of supported
CthuDesktop settings and browser profiles. Migration runs before the Agent
acquires its browser profile ownership lock.

## Source and destination

Legacy roots are detected at:

- macOS: `~/Library/Application Support/CthuDesktop`
- Windows: `%APPDATA%\CthuDesktop`

The Agent copies data into the selected environment namespace below its
user-scoped data root. Each environment has separate `config.json`,
`agent-secret`, `browser-profiles`, `runtime`, and `logs` paths.

Only `deviceName`, `connectionEnabled`, and the optional host Chrome executable
path are transformed from legacy config. Browser profile files are copied with
their relative layout. The following legacy values are deliberately not
migrated:

- old Agent/device identifiers
- old credentials, tokens, or Agent secrets
- appearance and legacy window state
- legacy environment definitions or arbitrary backend URLs

## Environment resolution

The normalized legacy backend URL must match exactly one environment in the
trusted release catalog. The migration never guesses between zero or multiple
matches and never targets a custom development environment.

When selection is required:

```bash
chc agent env list
chc agent env set <environment-id>
chc agent start
```

An explicit selection chooses the target trusted environment on the next Agent
start. The legacy backend URL is not added to or used in place of the signed
catalog.

## New Agent secret

Legacy credentials are not a trust source for the new service. Configure a new
static secret for each environment:

```bash
printf '%s\n' "$AGENT_SECRET" | chc agent env set-secret <environment-id> --secret-stdin
```

For a file input, the file must be user-private. Human and JSON status output
show only `configured` or `missing` and never return the secret.

## Safety and retry behavior

Migration uses an exclusive per-environment lock and refuses to run while the
target browser profile lock is active. It stages and hashes profile files,
preflights destination conflicts, validates the committed copy, atomically
writes its marker, and removes interrupted staging directories. A repeated run
with a valid marker is a no-op.

The legacy root is never changed or deleted. Existing Agent-owned config is not
overwritten. If a destination profile file has different content, migration
fails instead of replacing it.

Use the redacted diagnostic report for the next action:

```bash
chc agent doctor
chc agent logs --lines 200
```

Common repair paths are:

- no or ambiguous environment match: select an environment and restart
- active profile lock: stop the tray/Agent, then start again
- interrupted migration: run the Agent again after resolving the reported
  filesystem problem
- missing secret: configure a fresh secret through stdin or a protected file

## Rollback

Because source data is retained, the last CthuDesktop build can continue to use
the original root during the authorized rollback window from 2026-07-22 through
2026-08-21. Do not point CthuDesktop at the new Agent-owned directory. The
rollback candidates are the
macOS/Windows artifacts from GitHub Actions run `28499984304` at commit
`66c7f4ec20540158fb897d39cb4c56d6de5f2c3c`; GitHub currently expires them on
2026-09-29. They are unsigned CI artifacts, not production releases. No new
CthuDesktop artifacts are published after the 2026-07-22 cutover.
