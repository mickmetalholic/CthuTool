## 1. Plugin Source Migration

- [x] 1.1 Create `codex/plugins/language-coach` from the existing `packages/codex-plugins/plugins/english-coach` source.
- [x] 1.2 Rename the plugin manifest identity to `language-coach` and display text to `Language Coach`.
- [x] 1.3 Remove the plugin-level `package.json` so the plugin is a plain repository directory.
- [x] 1.4 Delete `packages/codex-plugins` after the new plugin source and tests are in place.
- [x] 1.5 Refresh `pnpm-lock.yaml` so the removed `packages/codex-plugins` importer is gone.

## 2. Cross-Platform Hook

- [x] 2.1 Port `scripts/english-coach.ps1` to `codex/plugins/language-coach/scripts/language-coach.mjs`.
- [x] 2.2 Update `hooks/hooks.json` to use a portable `node "<PLUGIN_ROOT>/scripts/language-coach.mjs"` command.
- [x] 2.3 Add hook command normalization that replaces `<PLUGIN_ROOT>` with the resolved plugin root before writing runtime hook files.
- [x] 2.4 Ensure normalized hook commands never contain `pwsh.exe`, `packages/codex-plugins`, or machine-specific source placeholders.
- [x] 2.5 Add direct Node hook tests for English prose, empty input, invalid JSON, and non-English input.

## 3. CLI Plugin Workflow

- [x] 3.1 Change the default Codex plugin root to `repoRoot/codex/plugins`.
- [x] 3.2 Update `chc codex plugins` help text and examples from `english-coach` to `language-coach`.
- [x] 3.3 Ensure installing `language-coach` writes a marketplace entry pointing at `codex/plugins/language-coach`.
- [x] 3.4 Ensure cache sync writes content under `language-coach/<version>`.
- [x] 3.5 Ensure `--bump-patch` updates `.codex-plugin/plugin.json` without requiring a plugin `package.json`.
- [x] 3.6 Ensure selecting `english-coach` fails through existing unknown-selection behavior.

## 4. Specs, Docs, And Tests

- [x] 4.1 Update OpenSpec canonical examples from `english-coach` to `language-coach`.
- [x] 4.2 Update CLI README and repository docs that mention `packages/codex-plugins` or `english-coach`.
- [x] 4.3 Update unit tests for discovery, marketplace path calculation, install results, cache sync, and patch bumping.
- [x] 4.4 Update integration tests for `chc codex plugins`, JSON output, non-interactive output, cache sync, and global binary behavior.
- [x] 4.5 Add regression coverage that the built-in default no longer discovers `packages/codex-plugins/plugins`.
- [x] 4.6 Run focused CLI test suites and hook script tests.
