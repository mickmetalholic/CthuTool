## 1. Command Surface

- [x] 1.1 Add `apps/cli/src/command/codex.command.ts` with `status`, `diff`, `export`, `apply`, `doctor`, and `plugins` subcommands.
- [x] 1.2 Register the `codex` command group in `apps/cli/src/index.ts`.
- [x] 1.3 Move or wrap the existing `codex-plugins` command so `chc codex plugins` preserves current plugin behavior.
- [x] 1.4 Remove the top-level `chc codex-plugins` command after `chc codex plugins` preserves plugin behavior.

## 2. Path and Safety Infrastructure

- [x] 2.1 Add `apps/cli/src/infra/codex-config-paths.ts` for repository root, repository `.codex`, home root, local Codex home, marketplace, plugin source, and cache path resolution.
- [x] 2.2 Add reusable path-boundary assertions that refuse writes outside repository `.codex` or the local Codex home target.
- [x] 2.3 Add unit tests for path resolution and outside-root write refusal on relative and absolute paths.

## 3. Config Domain

- [x] 3.1 Add `apps/cli/src/domain/codex-config-manager.ts` with read-only comparison for `prompts` and `rules`.
- [x] 3.2 Implement manifest readers and writers for version 1 `skills.manifest.json` and `plugins.manifest.json`.
- [x] 3.3 Implement safe `export` logic that mirrors only local `.codex/prompts` and `.codex/rules` into repository `.codex` and writes manifests.
- [x] 3.4 Implement safe `apply` logic that mirrors only repository `.codex/prompts` and `.codex/rules` into local `.codex`.
- [x] 3.5 Implement plugin manifest apply behavior by reusing `codex-plugin-manager` marketplace entry updates for enabled plugins.
- [x] 3.6 Implement conservative skill manifest apply behavior for supported repository-local sources and report unsupported sources.
- [x] 3.7 Implement `doctor` detection for unsafe repository `.codex` files and directories.

## 4. Command Output and JSON Contract

- [x] 4.1 Wire `codex status` to render prompt/rule counts, unmanaged local manual skills, unmanaged personal plugins, and read-only `config.toml` notices.
- [x] 4.2 Wire `codex diff` to render a diff-oriented read-only comparison using the same domain comparison data.
- [x] 4.3 Wire `codex export`, `codex apply`, and `codex doctor` with human-readable summaries and correct exit codes.
- [x] 4.4 Ensure `--json`, `--quiet`, and `--no-interactive` follow the existing CLI contract for all new Codex subcommands.

## 5. Tests

- [x] 5.1 Add unit tests for prompt/rule tree comparison and unchanged/added/removed/modified classification.
- [x] 5.2 Add unit tests for safe export and apply mirror behavior using temporary fixtures.
- [x] 5.3 Add unit tests for skills and plugins manifest generation.
- [x] 5.4 Add unit tests for doctor detection of unsafe files and directories.
- [x] 5.5 Add integration tests that `chc codex plugins` preserves existing plugin install and cache sync behavior.
- [x] 5.6 Add integration tests that `codex status` and `codex diff` report differences without writing files.
- [x] 5.7 Add integration tests that `codex export`, `codex apply`, and `codex doctor` perform the specified writes or failures.

## 6. Documentation and Verification

- [x] 6.1 Update `apps/cli/README.md` examples from `codex-plugins` to `codex plugins` and document the new Codex config commands.
- [x] 6.2 Update `packages/codex-plugins/README.md` package scripts or examples to use the official `codex plugins` surface.
- [x] 6.3 Add or update repository `.codex/README.md` to describe managed files and unsafe runtime state boundaries if the file is absent or stale.
- [x] 6.4 Run the relevant CLI test suite and typecheck commands.
- [x] 6.5 Run `openspec status --change codex-config-cli` and confirm the change is apply-ready.
