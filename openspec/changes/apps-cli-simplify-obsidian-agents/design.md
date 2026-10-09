## Context

See proposal.md for motivation. The current command collects an ID before the vault path and stores version-2 profiles keyed by ID with a default profile. The config reader also accepts version 1. The service includes directory-adoption transitions, checks for `.git`, and appends an unconditional synchronization warning. Human status prints flat `key: value` lines; status currently selects one profile and has a single-result JSON shape.

The existing CLI uses picocolors, @clack/prompts, and shared output helpers that respect JSON and quiet mode. Status must remain read-only, work without an interactive terminal, and remain useful for missing vaults. No plugin or generated adapter changes are needed.

## Goals / Non-Goals

**Goals:** Centralize vault path identity and selection, keep filesystem inspection independent of presentation, and provide a polished terminal report with an equally predictable machine contract.

**Non-Goals:** Obsidian API integration, remote synchronization measurement, automatic directory migration, live status dashboards, or project-wide redesign of CLI rendering.

## Decisions

### 1. Use canonical vault paths as identity

Persist version 3 as `{ version: 3, vaults: [{ vaultPath, sourcePath }] }`. Derive `.agents` from the vault path. Store neither authored IDs nor a default. For setup, resolve the existing vault with realpath before lookup; resolve source paths under the selected vault and retain the existing visible-inside-vault validation.

For status, use a realpath match when the requested vault exists and a normalized absolute-path match against stored paths when it is missing. Unfiltered status always includes missing entries. Sort entries using a deterministic path comparison rather than locale-dependent ordering. Canonical identity is machine-local; a relocated vault is a new path that must be set up again.

Alternatives: Generated IDs preserve an unnecessary concept; basenames collide; raw paths duplicate symlink aliases.

### 2. Keep current link configurations without retaining Git-era compatibility

Read version-2 configurations by extracting only vault/source paths, ignoring IDs and the default. Canonicalize accessible vaults, retain normalized stored paths for unavailable vaults, and coalesce identical vault/source entries. If equivalent vault entries disagree on source, report a configuration conflict instead of guessing. Status does not rewrite disk; successful setup writes version 3 atomically.

Remove version-1 parsing. Report the unsupported local config path and instructions to back it up/move it aside before rerunning setup. This does not inspect or migrate any Git metadata. Keeping the current link configuration avoids forcing users to recreate already-valid links; retaining version-1 behavior would keep the compatibility the user explicitly removed.

### 3. Make selection explicit and path-based

Setup always collects the vault first unless `--vault` supplies it, then loads that vault's source configuration. Non-interactive setup requires `--vault`. Changing vault path creates or updates that path's entry and never implicitly edits the previous vault.

Status without `--vault` inspects all entries; with it, status inspects one matching entry. Unknown selections report setup-required guidance without fallback. Explicitly reject `--profile` before work starts, since an unknown option must not be silently ignored by the argument parser.

### 4. Remove all real-directory adoption branches

Remove `adopt_existing_agents`, `replace_empty_agents`, directory rename/rollback machinery used solely for adoption, and related legacy tests. Any real directory at `.agents`, including an empty one, blocks setup before creating source directories or writing configuration. Preserve all content and report manual relocation guidance. Keep missing-link creation, correct-link reuse, and explicitly confirmed incorrect/broken-link repair. Unrelated `.git` contents receive no special treatment.

Alternative: Keeping adoption as a convenience was considered and explicitly rejected by the user.

### 5. Render a report with a clear visual hierarchy

Use a command-local status formatter over structured inspection results. Reuse shared quiet/JSON handling and picocolors; do not add a table or dashboard dependency. Use a bold heading, muted separators and labels, green `READY` and amber `NEEDS ATTENTION` badges, aligned detail labels, and blank space between vault sections. Health is always stated in words, never color alone. Derive the display name from the basename but always show the full path to distinguish identical names.

Illustrative wide-terminal output (the actual terminal adds restrained color and emphasis):

```text
Obsidian Agents
2 vaults  /  1 ready  /  1 needs attention

Personal                                      READY
----------------------------------------------------
  Vault      /Users/me/Notes/Personal
  Source     /Users/me/Notes/Personal/Agents
  Link       /Users/me/Notes/Personal/.agents
             -> /Users/me/Notes/Personal/Agents
  Type       Symbolic link
  Contents   Skills OK  /  State OK

Work                                NEEDS ATTENTION
----------------------------------------------------
  Vault      /Users/me/Notes/Work
  Source     /Users/me/Notes/Work/Agents
  Link       /Users/me/Notes/Work/.agents
             Missing
  Contents   Skills OK  /  State OK

  Action     Create the missing link:
             chc obsidian agents setup --vault /Users/me/Notes/Work
```

Use terminal columns for layout, with a bounded content width and a conservative fallback for redirected streams. Narrow output puts the badge on its own line and wraps values onto indented continuation lines. Measure display width rather than raw string length, including CJK characters and ignoring styling. Never ellipsize paths or repair instructions. Redirected output uses readable plain sections without ANSI/control sequences or animation. Honor NO_COLOR; color enablement otherwise follows existing CLI conventions.

Empty configuration shows a short setup invitation. A real `.agents` directory gets manual relocation guidance before a retry command, rather than recommending setup alone. Quote generated path arguments safely for the current platform so spaces and special characters remain usable.

Alternatives: A dense table makes long paths awkward; heavily boxed panels consume narrow terminal space; spinners are unnecessary for local inspection.

### 6. Separate execution success from topology health in JSON

Keep the command envelope and return `result: { summary: { total, healthy, needsAttention }, vaults: [...] }` for zero, one, and many results. Each entry includes `vaultPath`, `sourcePath`, `agentsPath`, `configured`, `healthy`, `paths`, `source`, `link`, and `issues` derived only from actual inspection. Remove `profile`, `legacy`, `consistency`, and the old fixed `warnings` representation. Setup returns path-based configuration data without an ID.

`ok: true` and exit code 0 still mean inspection completed, even if topology needs attention. Invocation/configuration failures keep the existing CLI error behavior. An explicit unconfigured path is represented as a configured-false entry with setup guidance; an unfiltered empty registry has zero entries. Human output and JSON derive from the same status model.

## Risks / Trade-offs

- JSON and `--profile` callers break -> Document the new path selector and array envelope, and add contract tests for zero/one/many results.
- A missing directory cannot be canonicalized -> Retain stored identity and use normalized-path matching for diagnostics; never drop it from all-vault status.
- Old aliases disagree on source -> Fail with both source paths and explicit reconciliation guidance; do not choose the former default silently.
- Fancy terminal layout can hide information -> Use restrained formatting, textual health labels, full wrapped values, and plain redirected output.
- Removing adoption removes convenience -> Give accurate occupied-directory guidance and verify setup leaves every existing file and directory intact.

## Migration Plan

Implement config/model changes, selection and service simplification, then the formatter and JSON envelope. Convert version 2 in memory on read and persist version 3 only after successful setup. Remove Git-era and directory-adoption documentation and tests; replace them with the new conflict contract and path selection tests.

For rollback after a version-3 write, restore a saved version-2 local configuration or recreate configuration using the restored CLI. No vault content migration occurs, so links and source contents remain available. Keep this local configuration transition distinct from the removed `.agents` content migration.
