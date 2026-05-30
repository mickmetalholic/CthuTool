# Codex Assets and Config Sync Design

## Context

`apps/cli` currently has a `codex` command that compares, exports, applies, and checks Codex-related configuration. The current implementation treats repository `.codex/` as the repository copy of managed Codex config. That is no longer the desired boundary.

Repository `.codex/` is project-local agent context for this repository. It can contain project-specific instructions and skills that affect Codex while working in this repo, but it is not the storage location for the CLI-managed backup and restore feature.

The CLI-managed Codex configuration and repo-maintained Codex assets should live under a new root-level `codex/` directory. This directory is owned by the backup and restore workflow.

## Goals

- Move the CLI-managed repository root from `.codex/` to `codex/`.
- Keep `.codex/` completely outside this feature.
- Store synced config and repo-maintained Codex assets under `codex/`.
- Split behavior into two source-of-truth flows: repository-owned skills/plugins flow only from repository to local, while local prompts/rules and non-repository install intent are backed up from local to repository.
- Make `export` the regular local backup command for prompts, rules, and non-repository install intent.
- Make `apply` the restore/bootstrap command for backed-up local config and non-repository install intent.
- Make `install` the explicit command for installing repository-owned skills and plugins locally.
- Treat plugin-provided skills as part of their plugin and never manage or report them separately.
- Leave `packages/codex-plugins` untouched for now. A future migration can move existing plugins into `codex/plugins`.

## Non-Goals

- Do not migrate existing `packages/codex-plugins` content in this change.
- Do not copy all local skills from `~/.codex/skills` into the repository.
- Do not copy plugin cache content from `~/.codex/plugins/cache`.
- Do not manage repository `.codex/`.
- Do not implement non-interactive installation of official or curated Codex skills until Codex exposes a stable command or API for it.

## Repository Layout

The managed repository layout is:

```text
codex/
  README.md
  prompts/
  rules/
  skills/
    <skill-name>/
      SKILL.md
      ...
  plugins/
    <plugin-name>/
      .codex-plugin/
        plugin.json
      ...
  skills.manifest.json
  plugins.manifest.json
```

`codex/prompts` and `codex/rules` are synced file trees for local Codex config backup and restore. `codex/skills` and `codex/plugins` are source trees for assets this repository owns. The manifests describe repository-owned sources and local install intent, but the two ownership flows stay separate.

## Ownership Model

The important distinction is ownership, not whether something currently exists on the machine.

`repo` assets are maintained in this repository. Their source of truth is `codex/skills` or `codex/plugins`. They move only from repository to local during `install`. `export` must not copy local skill/plugin files back into these directories, `apply` must not install or refresh them, and export-generated manifests do not need enabled repository entries because the repository directories already define ownership. Existing disabled repository entries may be preserved as explicit opt-outs.

`external` and `marketplace` assets are local install intent. Their source of truth is the user's installed Codex environment, and `export` records that intent in manifests without copying files. `apply` can restore them only when a safe installer/source is available; otherwise it reports the missing restore path.

`system` assets are bundled with Codex or the current runtime. They should be ignored.

Plugin-provided skills are owned by plugins. They should not appear in `skills.manifest.json` or status output; installing or enabling the plugin is enough.

## Manifest Shape

Skill manifest:

```json
{
  "version": 1,
  "skills": [
    {
      "name": "commit-changes",
      "source": "repo",
      "path": "codex/skills/commit-changes",
      "enabled": true
    },
    {
      "name": "ui-ux-pro-max",
      "source": "external",
      "path": "skill:ui-ux-pro-max",
      "enabled": true
    }
  ]
}
```

Plugin manifest:

```json
{
  "version": 1,
  "plugins": [
    {
      "name": "english-coach",
      "source": "repo",
      "path": "codex/plugins/english-coach",
      "enabled": true
    },
    {
      "name": "documents",
      "source": "marketplace",
      "path": "marketplace:documents",
      "enabled": true
    }
  ]
}
```

The initial implementation supports `source: "repo"` fully. It can restore `source: "external"` skills only when a `skill:<name>` entry has a matching source in Codex's local official skill import cache. Marketplace entries are treated as satisfied when the local personal marketplace already contains them; otherwise they are reported until richer source metadata exists.

## Export Behavior

`export` reads from the local Codex home, defaulting to `~/.codex`, and writes to `repoRoot/codex`.

It should:

- Mirror `~/.codex/prompts` to `codex/prompts`.
- Ignore generated prompt command adapters such as OpenSpec `opsx-*.md` files instead of exporting them.
- Mirror `~/.codex/rules` to `codex/rules`.
- Record local user-installed skill directories that contain `SKILL.md` as non-repository install intent in `codex/skills.manifest.json`.
- Record local personal marketplace plugin entries as non-repository install intent in `codex/plugins.manifest.json`.
- Leave repository-owned `codex/skills` and `codex/plugins` source files as repository-owned assets; do not infer or overwrite them from local installed copies.
- Never copy auth, sqlite state, logs, sessions, memories, caches, `config.toml`, plugin caches, or arbitrary local skills.

System skills, plugin-provided skills, empty runtime marker directories, and plugin caches should stay out of manifests and repository files.

## Apply Behavior

`apply` reads from `repoRoot/codex` and restores backed-up config and non-repository install intent to the local Codex environment.

It should:

- Mirror `codex/prompts` to `~/.codex/prompts`.
- Preserve generated prompt command adapters such as OpenSpec `opsx-*.md` files when applying prompts.
- Mirror `codex/rules` to `~/.codex/rules`.
- Ignore repository-owned `source: "repo"` skills and plugins; those are handled by `install`.
- Install `source: "external"` skills in `skill:<name>` form from Codex's local official skill import cache when that source is available.
- Leave system skills alone.
- Leave plugin-provided skills alone and keep them out of user-visible config sync output.
- Treat already registered personal marketplace plugin entries as satisfied.
- Report unsupported or unavailable external/marketplace entries clearly rather than pretending they were restored.

For repository-owned skills, the first implementation may keep the current local target if that is what Codex in this environment reads. A later compatibility pass can move the target toward the documented `$HOME/.agents/skills` location if that becomes the chosen policy.

For repository-owned plugins, the safest behavior is to write or update the personal marketplace entry and let Codex install from marketplace semantics. Direct cache writes should remain an internal compatibility detail of `install`, not a second user-facing source of truth.

## Install Behavior

`install` reads repository-owned assets from `repoRoot/codex` and installs them to the local Codex environment.

It should:

- Install `source: "repo"` skills from their manifest paths.
- Register or install `source: "repo"` plugins from their manifest paths.
- Treat repository skill and plugin directories as enabled repository intent before export generates manifests, unless a manifest entry explicitly disables them.
- Synchronize installed repository plugin cache entries.
- Leave `codex/prompts` and `codex/rules` untouched.

## Status

`status` should compare local `prompts` and `rules` against `codex/prompts` and `codex/rules`, excluding generated prompt command adapters such as OpenSpec `opsx-*.md` files.

It should also report:

- repository-owned skills or plugins that are present in repository source trees or manifests but not installed locally
- local backup intent gaps for personal skills or marketplace plugins that exist locally but are not yet tracked
- unsupported restore intent for external or marketplace entries that cannot currently be restored
- plugin-provided skills are silent implementation details of their owning plugins
- repository-owned plugins present under `codex/plugins`
- repository-owned skills and plugins present under `codex/skills` or `codex/plugins` but not yet installed locally, even before manifests exist
- unsafe runtime files or directories under `repoRoot/codex`

Default human `status` output should provide the structured review view previously planned for `diff`, including grouped changed paths, install gaps, unsupported intent, unsafe repository state, and a next-action hint. JSON mode should stay machine-readable.

## Repository Safety

Repository safety should be checked by `status`, not a separate `doctor` command. `status` should inspect `repoRoot/codex`, not `repoRoot/.codex`, and report runtime state inside `codex/`, including:

- `auth.json`
- `cap_sid`
- `*.sqlite`, `*.sqlite-shm`, `*.sqlite-wal`
- `cache/`
- `plugins/cache/`
- `logs/` or `log/`
- `tmp/` or `.tmp/`
- `sessions/`
- `archived_sessions/`
- `memories/`
- `config.toml`

It should not inspect or report repository `.codex/`, because that directory belongs to project-local agent context.

## CLI Impact

The user-visible command surface should be:

```bash
chc codex status
chc codex export
chc codex apply
chc codex install
```

Path options should be renamed internally for clarity, but the public flags can remain compatible:

- `--repo-root` still chooses the repository root.
- `--codex-home` still chooses local Codex home.

`chc codex status` replaces the planned `diff` view and the planned `doctor` check. `chc codex plugins` should not be exposed; repository plugin restoration is handled by `install`.

## Migration Plan

1. Add `repoManagedCodexRoot = repoRoot/codex` to the path model and stop using `repoRoot/.codex` for this feature.
2. Update unit tests for default paths, export, apply, status review output, and status safety checks.
3. Update integration tests to expect `codex/prompts`, `codex/rules`, and `codex/auth.json` in temp repos.
4. Change export manifest generation to record local user-installed skill/plugin intent without reverse-syncing repository-owned assets.
5. Change apply to read non-repository manifest intent from `codex/`.
5.1 Add install to read repository-owned assets from `codex/skills` and `codex/plugins`.
6. Update README text and command docs.
7. Add status reporting for manifest-tracked and unsupported local user skill/plugin intent.
8. Remove user-visible `diff`, `doctor`, and `plugins` subcommands from the codex command group.

## Test Plan

- Unit: path defaults resolve `repoRoot/codex`.
- Unit: export copies prompts and rules into `codex/`.
- Unit: export records local user skill intent without copying local skill files.
- Unit: export generates plugin manifest intent from local personal marketplace entries without adding repository-owned plugin entries.
- Unit: apply does not install repository-owned skills or plugins.
- Unit: install installs repository-owned skills from `codex/skills`.
- Unit: install registers repository-owned plugins from `codex/plugins`.
- Unit: status reports unsafe files under `codex/`.
- Integration: `codex status` is read-only.
- Integration: `codex export`, `codex apply`, `codex install`, and `codex status` operate on `codex/`.
- Regression: `codex plugins`, `codex diff`, and `codex doctor` are no longer registered.

## Open Questions

- Should repository-owned skills restore to `~/.codex/skills` for current compatibility, or to `$HOME/.agents/skills` to match current Codex docs?
- Should external skill/plugin entries record richer source metadata when Codex exposes stable installers?
- Should repository-owned plugins be installed by marketplace only, or should direct cache sync remain an internal compatibility step during `install`?
