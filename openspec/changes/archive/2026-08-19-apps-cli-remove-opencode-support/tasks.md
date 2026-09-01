## 1. Remove the OpenCode runtime surface

- [x] 1.1 Remove the `opencode` registration and import from `apps/cli/src/command/root.command.ts`, then delete `apps/cli/src/command/opencode.command.ts`.
- [x] 1.2 Delete `apps/cli/src/domain/opencode-config-manager.ts` and remove all runtime imports of its types and functions.
- [x] 1.3 Simplify `apps/cli/src/infra/codex-config-paths.ts` to retain only Codex and shared repository paths, removing OpenCode roots, config selection, overrides, and default-path detection.
- [x] 1.4 Audit CLI source and command wiring for stale OpenCode symbols or options, ensuring Codex plugin discovery, installation, and skill management continue to use the remaining path model.

## 2. Update executable behavior tests

- [x] 2.1 Remove the OpenCode configuration integration suite and its temporary-config fixtures.
- [x] 2.2 Update command discovery, root-command, shell-completion, and global-bin integration tests so `opencode` is absent from public commands, help, and completion results.
- [x] 2.3 Remove OpenCode-specific path assertions from `codex-config-paths` tests while retaining coverage for Codex defaults, overrides, and repository path safety.
- [x] 2.4 Add or retain a regression assertion that Codex commands and `chc codex install` remain discoverable after the OpenCode registration is removed.

## 3. Remove user-facing OpenCode references and refresh artifacts

- [x] 3.1 Remove OpenCode command examples and configuration instructions from `apps/cli/README.md` and `apps/docs/src/content/docs/reference/cli.md`.
- [x] 3.2 Remove OpenCode setup steps from `apps/docs/src/content/docs/modules/codex-plugin.md` and `codex/plugins/cthu-codex/README.md`, preserving Codex plugin installation guidance.
- [x] 3.3 Regenerate the committed CLI bundle with the repository's existing build workflow and verify it no longer exposes the OpenCode command.
- [x] 3.4 Remove the `apps-cli-opencode-shared-assets` entry from `openspec/specs/README.md` while retaining the Codex skill-management entry.
- [x] 3.5 After implementation verification, archive the change so the `apps-cli-opencode-shared-assets` active specification is retired through the OpenSpec workflow.

## 4. Verification

- [x] 4.1 Run focused Biome checks for changed CLI source, tests, and documentation.
- [x] 4.2 Run the CLI TypeScript type check and affected unit/integration tests.
- [x] 4.3 Run the CLI distribution consistency check and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
- [x] 4.4 Run a repository search over non-archived source, tests, and docs for unintended OpenCode references, then run `git diff --check`.
- [x] 4.5 Run `openspec validate apps-cli-remove-opencode-support --type change --strict --no-interactive` and confirm all change artifacts are complete.
