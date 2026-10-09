## 1. Path-based configuration

- [x] 1.1 Replace ID/default-profile storage with version-3 vault/source entries and canonical vault identity; verify targeted config tests cover repeat setup, symlink aliases, distinct same-name vaults, and missing stored paths.
- [x] 1.2 Read current version-2 link configurations without IDs/default selection, deduplicate equivalent entries, reject conflicting sources, and remove version-1 support; verify tests cover read-only conversion, actionable unsupported-format errors, atomic successful writes, and conflicting aliases.
- [x] 1.3 Collect/select the vault before the source in setup, require `--vault` non-interactively, and reject `--profile`; verify command tests confirm no ID prompt, actionable argument errors, and independent multi-vault setup.

## 2. Simplified topology inspection and setup

- [x] 2.1 Remove real `.agents` directory adoption and empty-directory replacement transitions while retaining link creation/reuse/repair; verify empty and populated real directories block setup before any mutation and preserve all contents.
- [x] 2.2 Remove Git metadata checks, legacy output, consistency data, and constant synchronization warnings; verify targeted tests show identical local topology behavior with/without unrelated `.git` content and no obsolete fields in setup/status output.
- [x] 2.3 Add all-vault inspection and canonical `--vault` filtering with deterministic ordering and actual local issue data; verify tests cover zero/one/many vaults, mixed health, missing vaults, unknown selection, and no fallback to a default.

## 3. Status presentation and contracts

- [x] 3.1 Implement the command-local report formatter with overview counts, restrained color, textual badges, aligned full paths, separated vault sections, and tailored action guidance; verify readable healthy/broken/conflict/empty fixtures against the design example.
- [x] 3.2 Support narrow terminals, CJK display width, long paths, safe repair-command quoting, NO_COLOR, redirected output, and quiet mode; verify focused formatter tests plus manual wide/narrow and colored/plain CLI previews preserve all diagnostic information.
- [x] 3.3 Introduce the stable summary-plus-vaults JSON status envelope and ID-free setup results; verify zero/one/many contract tests, absence of presentation styling and removed fields, and unchanged execution-success versus topology-health exit semantics.

## 4. Documentation and verification

- [x] 4.1 Update the CLI README with path-based setup, all-vault/filtered status examples, the JSON envelope, current-config conversion, unsupported Git-era config guidance, and occupied-directory handling; verify no instructions still advertise IDs, default profiles, Git metadata diagnostics, or automatic directory adoption.
- [x] 4.2 Run targeted Obsidian config/topology/command/formatter tests, CLI type checking, and scoped Biome checks from the verified worktree/branch; verify all affected behavior passes and status leaves config/vault snapshots unchanged.
- [x] 4.3 Run `openspec validate apps-cli-simplify-obsidian-agents --strict` and `git diff --check`; verify the change is valid and generated `.agents/skills`, `.zcode/skills`, protected `codex/plugins/cthu-codex`, and neighboring changes remain unchanged. No OpenSpec regeneration is required.
