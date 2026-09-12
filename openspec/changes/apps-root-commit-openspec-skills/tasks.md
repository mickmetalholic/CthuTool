## 1. Commit the OpenSpec Skill snapshot

- [x] 1.1 Generate the six core workflows with OpenSpec 1.13.0 for `codex,agents,zcode`; verify each workflow has a tracked `.agents/skills` and `.zcode/skills` file.
- [x] 1.2 Update `AGENTS.md` and `openspec/config.yaml` to identify the generated trees as committed outputs; verify project policy is absent from hand-edited generated Skills.

## 2. Replace repository bootstrap

- [x] 2.1 Remove `setup:ai-tooling`, `check:ai-tooling`, their scripts, and the post-checkout bootstrap; verify the package manifest and hook tests no longer depend on them.
- [x] 2.2 Update AI tooling documentation and affected contract tests for the five agent paths and invocation forms; verify root test, lint, typecheck, and build gates pass.

## 3. Verify the migration

- [x] 3.1 Run `openspec doctor --json`, validate the change and all specs, and check Git whitespace; verify `codex/plugins/cthu-codex` is absent from the PR diff.
