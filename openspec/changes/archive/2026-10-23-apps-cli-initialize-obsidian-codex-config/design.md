## Context

See `proposal.md` for the motivation. The existing agents service separates setup
preview from application, rechecks topology before writing, and has read-only
status inspection. The implementation extends that path rather than introducing
another command or a synchronized preference store.

This design is recorded after implementation. It covers setup, status, and
filesystem conflict handling across multiple CLI modules.

## Goals / Non-Goals

**Goals:** Initialize a safe per-machine default through the established setup
confirmation, preserve explicit user configuration, and make missing local setup
visible through status.

**Non-Goals:** Change the language-coaching plugin, edit global Codex settings,
toggle hooks dynamically during a conversation, or transport hidden config files
through Obsidian Sync.

## Decisions

1. **Create only when missing.** Write a small regular TOML file with
   `[features].hooks = false`; retain an existing file without parsing or
   rewriting it. Merging hook settings into existing TOML was rejected because
   setup should not replace an explicit preference or disturb comments and
   unrelated settings. Existing `hooks = true` is intentionally preserved.
2. **Reuse preview and confirmation.** Add config creation to setup actions and
   require confirmation even when skill links are already correct. Return
   `codexConfig: { path, created }` so callers can distinguish initialization from
   preservation without inferring it from the link transition.
3. **Inspect before writing.** Include `.codex` and `config.toml` in topology
   comparison, reject redirected parents or non-regular occupied config paths,
   and create using exclusive `wx` mode. Following symlinks or replacing an
   occupied path was rejected because it could affect another config or device
   setup. As with the existing link setup, application is not a filesystem-wide
   transaction; a failure reports surviving state for repair.
4. **Report presence rather than policy compliance.** Add `codexConfigPath` and
   `paths.codexConfigExists` to status and require a regular file for healthy
   setup. Status does not parse TOML or claim that an existing file disables
   hooks. A redirected `.codex` directory is inspected without entering it.
5. **Keep the default local.** Each machine recreates the same small config
   during setup. A visible shared config plus per-device symlink was rejected as
   unnecessary for this fixed default. Documentation explains that a non-Git
   vault should be the chat's working directory for this project layer to load.

## Risks / Trade-offs

- All Codex hooks are disabled by the new default, including future unrelated
  hooks. Users can edit the local config; setup will preserve that choice.
- Existing hook-enabled configs remain enabled. Setup output explicitly reports
  preservation, and status only asserts that the file is present.
- Old configured vaults without the local file become unhealthy until setup is
  rerun. Status includes the path and repair guidance; config creation requires
  the ordinary confirmation.
- The setting is scoped to loaded project configuration. Chats started directly
  in a non-Git vault's subdirectory may not inherit the vault-root file.

## Migration Plan

Deploy the refreshed CLI bundle and rerun `chc obsidian agents setup --vault
<path>` once on each machine. It creates only missing local configuration and
preserves existing files. No local profile schema migration is required.

To undo the default, change `features.hooks` in the local file. Remove the file
only after confirming it still contains solely the generated default and no
user-added settings; removing it makes status request setup again.
