## 1. Path Model

- [x] 1.1 Update Codex config path resolution so config sync commands use `repoRoot/codex` as the repository-managed root.
- [x] 1.2 Keep local Codex home path resolution separate from the repository-managed root.
- [x] 1.3 Keep repository plugin path resolution internal to `export` and `apply` without exposing a `chc codex plugins` command.
- [x] 1.4 Add path boundary checks that reject repository writes outside `repoRoot/codex` and local writes outside the local Codex home.
- [x] 1.5 Treat omitted command-group invocations such as `chc` and `chc codex` as help requests that exit successfully.

## 2. Export Behavior

- [x] 2.1 Mirror local prompts to `codex/prompts`.
- [x] 2.2 Mirror local rules to `codex/rules`.
- [x] 2.3 Keep repository-owned skill/plugin source files one-way from `codex/skills` and `codex/plugins` to local.
- [x] 2.4 Record local user skill intent and local personal marketplace intent during export.
- [x] 2.5 Record local personal skills/plugins without copying their files into repository-owned asset directories.
- [x] 2.6 Ensure export does not copy auth files, sqlite state, sessions, memories, logs, temp files, config files, or plugin caches.

## 3. Apply Behavior

- [x] 3.1 Mirror `codex/prompts` to the local Codex prompts directory.
- [x] 3.2 Mirror `codex/rules` to the local Codex rules directory.
- [x] 3.3 Keep `chc codex apply` focused on prompts, rules, and non-repository install intent.
- [x] 3.4 Add `chc codex install` to install enabled `source: "repo"` skills from manifest paths or directories under `codex/skills`.
- [x] 3.7 Register enabled `source: "repo"` plugins from manifest paths or directories under `codex/plugins` and synchronize installed repository plugins into the local Codex personal plugin cache.
- [x] 3.5 Treat apply as restore/bootstrap: install supported external skill entries from Codex's local official skill import cache and report unavailable external/marketplace entries.
- [x] 3.6 Preserve unmanaged personal skills, plugin-provided skills, system skills, config files, and runtime state.
- [x] 3.8 Require explicit confirmation before apply overwrites or deletes local managed prompt/rule files.

## 4. Status And Safety

- [x] 4.1 Update `chc codex status` to compare local prompts and rules against `codex/prompts` and `codex/rules`.
- [x] 4.2 Update `chc codex status` to separate repository-owned install gaps, local backup intent gaps, and unsupported restore intent while keeping plugin-provided skills out of user-visible output.
- [x] 4.3 Add structured `chc codex status` comparison output without mutating files.
- [x] 4.4 Remove the user-visible `chc codex diff` command and route detailed comparison needs through `status`.
- [x] 4.5 Fold repository safety checks into `chc codex status`, including unsafe files and directories under `codex/`: `auth.json`, `cap_sid`, `config.toml`, sqlite files, caches, sessions, memories, logs, and temp directories.
- [x] 4.6 Remove the user-visible `chc codex doctor` command and keep repository `.codex` ignored.

## 5. Tests And Documentation

- [x] 5.1 Update unit tests for default paths and path boundary failures.
- [x] 5.2 Update export tests for `codex/prompts`, `codex/rules`, local backup manifests, and local backup intent gap reporting.
- [x] 5.3 Update apply and install tests for separated config restore, repository-owned asset installation, unsupported entries, and preserved unmanaged state.
- [x] 5.4 Update status tests to assert `codex/` behavior, `.codex/` exclusion, detailed output, and folded safety checks.
- [x] 5.5 Add regression coverage proving `chc codex plugins` is no longer registered.
- [x] 5.7 Add regression coverage proving `chc codex diff` and `chc codex doctor` are no longer registered.
- [x] 5.6 Update CLI documentation and help text for the `codex/` repository layout.

## 6. Enhanced Detailed Status Presentation

- [x] 6.1 Add a dedicated human renderer for `chc codex status` instead of using the compact status renderer.
- [x] 6.2 Render a clear status header with local Codex home and repository `codex/` roots.
- [x] 6.3 Render a scannable area summary for prompts and rules with added, removed, modified, and unchanged counts.
- [x] 6.4 Render changed prompt and rule paths grouped by state with stable ordering and bounded output.
- [x] 6.5 Render sections for repository-owned install gaps, local backup intent gaps, and unsupported restore intent, without a separate plugin-provided skill section.
- [x] 6.6 Detect enabled repository-owned skills and plugins that are present in manifests or repository directories but not yet applied locally.
- [x] 6.7 Render missing local install sections for repository-owned skills and plugins in `chc codex status`.
- [x] 6.8 Keep `chc codex status --json` output free of ANSI styling or decorative text, including any new comparison fields.
- [x] 6.9 Add unit or integration coverage for the enhanced human status output, including missing repository-owned installs, bounded path lists, and JSON stability.
- [x] 6.10 Update CLI documentation with an example of the enhanced `chc codex status` output.
