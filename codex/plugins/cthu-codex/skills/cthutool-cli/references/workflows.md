# CthuTool CLI workflows

Use only the section relevant to the current task. Check that operation's live
help before execution, particularly on older installations.

## CLI source

- Inspect `chc source status --json` and `chc source list --json` to identify
  the active path and source kind (`main`, `worktree`, `managed`).
- For an authorized CLI update, use `chc source update --check --json` first,
  then `chc source update --json --no-interactive` if an update is available.
  Verify the resulting source status. Preserve the existing repository/ref
  unless the user selected another one.
- For authorized switching, use `chc source use <selector> --json --no-interactive`.
  `local` selects the registered main checkout, `remote` the managed checkout,
  `.` the current checkout, and `worktree:<id>` a live listed worktree.
  `source register <path>` remembers a development checkout.
- Switching relinks global npm state. It does not build source changes or
  update Git. Selecting an absent managed source can install it. A local/worktree
  source may be dirty; updates still reject unsafe tracked changes or divergence.
  Do not stash, reset, clean, or rebase as an automatic update workaround.
- A checkout must have its built runtime bundle. Switch away before removing
  an active worktree. Do not silently select a different source if it is missing.

## Local Agent

- Read `chc agent status --json` and, for diagnosis,
  `chc agent doctor --json`. Inspect per-check status; command success alone
  does not prove the Agent/backend/browser is healthy.
- Authorized lifecycle operations are `install`, `update`, `start`, `stop`,
  and `restart`. Use `chc agent update` for the runtime, not `source update`.
  Verify version, tray state, setup, and relevant connectivity after changes.
  Report rollback explicitly if a new release fails readiness.
- Agent install/update uses one latest self-use release. Do not supply removed
  `--channel` or remote `--version` selectors, or use `agent env`.
- `chc agent settings` opens native configuration and starts the tray when
  needed. The user enters the exact HTTPS deployment Origin there. Do not
  invent CLI Origin/Secret flags. The deployed Web console is a separate action
  in native settings; do not print or persist a launch ticket.
- `chc agent logs --lines 200 --json` reads recent redacted logs.
  `--follow` is a human stream without JSON. Autostart is managed through
  `chc agent autostart enable|disable|status`.
- Default `uninstall` preserves configuration, profiles, and logs.
  Add `--purge --yes --no-interactive` only for an explicitly authorized purge.

## Codex skills and plugins

- `chc codex skills --json` is a read-only eligible GitHub skill inventory.
  The bare manager is interactive: it presents state-valid actions and a plan.
  Do not invent unattended `add`, `update`, or `remove` subcommands.
- The manager handles manifest-backed GitHub skills and eligible local GitHub
  installations with proven source metadata. It does not absorb arbitrary
  locally authored skills or manage plugin-provided/system skills.
- `chc codex install` installs repository plugins, registers/enables them, and
  synchronizes their cache. It does not install standalone skills.
  Use `--repo-root <path>` for a one-run source override.
  `--change-source --repo-root <path>` changes the remembered default.
- JSON/non-interactive plugin installation requires an available configured
  source or explicit repository path. Report missing source guidance instead
  of choosing an unrelated checkout.
- If installation reports `codex_plugin_cache_busy`, preserve the locked cache.
  Explain that the user must exit Codex and rerun installation; do not terminate
  the active host or delete its cache automatically. A successful source install
  does not prove the current thread has loaded the new plugin; use a fresh thread
  or restart to discover it.

## Obsidian vault links

- Inspect all configured vaults with `chc obsidian agents status --json`, or
  select one with `--vault "<path>"`. Read `result.summary`, `result.vaults`,
  each vault's `healthy`, and `issues`. An unconfigured vault can be reported
  successfully with `configured: false`.
- For authorized setup, specify `--vault "<path>" --yes --no-interactive`.
  The visible source defaults to `<vault>/Agents`; use the live `--sourcePath`
  option only when another visible source was chosen.
- Setup links `<vault>/.agents` to the visible source and
  `<vault>/.claude/skills` to its `skills` directory. Verify both with status.
  Obsidian Sync transports source content; CLI status does not prove remote sync.
- Occupied real directories are conflicts. Report exact paths and a relocation
  decision; do not merge, move, or remove their contents as a link repair shortcut.

## Bundled scripts and CBZ conversion

- Discover with `chc scripts list --json`; get target help with
  `chc scripts run <id> --help`. Prefer canonical `run` over compatibility forms.
  `contrib-sample`, `hello-world`, and `second-script` are examples.
- For authorized conversion, a typical call is:

  ```sh
  chc scripts run convert-to-cbz --input "<directory>" --json --no-interactive
  ```

- Preserve explicit input/output paths. Output defaults to `<input>/.output`,
  retains relative directories, and skips existing targets. Use `--output` when
  selected; use `--overwrite` only when replacement is authorized.
- PDF conversion requires Poppler's `pdfinfo`, `pdfimages`, and `pdftoppm`.
  EPUB-only extraction does not need Poppler. Install dependencies only when that
  is in scope; help remains usable without them.
- Fixed-layout EPUBs use referenced images in spine order. Text-only EPUB, MOBI,
  loose image directories, and PDFs nested inside archives need other handling;
  do not imply this converter supports them.
- Native PDF image extraction preserves scans when possible. Format, quality,
  and DPI affect rendered pages. Consult live help for supported values/defaults;
  the legacy `epubConcurrency` option has no separate scheduling effect.
- Inspect `summary.convertedCount`, `skippedCount`, `failureCount`, `totalFiles`,
  and output root. A zero-work success is not a completed conversion of expected
  sources. Report per-file failures and verify intended CBZ outputs.

## Shell completion

- `chc completion powershell` or `chc completion zsh` prints an adapter.
- `chc completion status <shell>` inspects persistent configuration.
- Authorized `enable <shell>` / `disable <shell>` changes shell configuration.
  Verify with status. Do not evaluate generated adapters or edit profiles during
  an inspection request. Other shells have no managed adapter in this CLI.
