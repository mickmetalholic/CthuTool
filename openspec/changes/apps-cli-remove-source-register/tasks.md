## 1. Source command and registration

- [x] 1.1 Remove the register command adapter and discovery entry; verify help, completion, and removed-command regression tests.
- [x] 1.2 Publish automatic development registration after successful local/managed switches; verify dot/path/worktree, already-active, managed round-trip, and failure-preservation tests.

## 2. Documentation and skill

- [x] 2.1 Replace register instructions in CLI docs, recovery hints, and the CthuCodex workflow reference; verify no active instructions recommend the removed command and validate the skill.
- [x] 2.2 Sync only this change's source-switching delta into the main spec and pass strict OpenSpec validation; confirm generated adapters and neighboring changes are unchanged.

## 3. Verification and delivery

- [x] 3.1 Rebuild committed CLI bundles with pinned Bun and pass affected tests, CLI lint/typecheck, bundle consistency, and docs checks.
- [x] 3.2 Review the final scoped diff and record verification results; confirm only the selected change, implementation, docs, skill, and bundles are staged.

## Verification results

- Source manager, command discovery, interaction, source integration, completion, and global bin: 66 passed, 1 zsh-only test skipped on Windows.
- CLI lint/typecheck, pinned Bun 1.3.11 build and bundle consistency: passed.
- Docs index/build/typecheck, Skill validation, strict change validation, and all 68 main specs: passed.
- Final diff leaves generated adapters and neighboring changes unchanged.
