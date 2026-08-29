---
name: project-verify
description: Select and run targeted validation for changed files while respecting CthuTool protected-service and no-unrequested-build rules. Use after making or reviewing a code change.
---

Verify the current change with the smallest safe command set.

**Mutation boundary:** may run read-only or targeted validation commands after stating them. Do not start, stop, or restart protected local services. Do not run full `build` / `dev` / `start` unless the user explicitly asks. Do not commit, push, or open a pull request.

## Steps

1. Inspect `git status` and the relevant diff to identify changed paths.
2. Choose targeted checks based on what changed:
   - TypeScript/JavaScript under an app or package → prefer that package's lint and typecheck when available
   - OpenSpec artifacts → `openspec validate --all` and/or `openspec doctor --json`
   - AI tooling / skills / adapters → `pnpm check:ai-tooling`
   - Always consider `git diff --check` for whitespace errors
3. State the exact commands you will run and why they are proportionate.
4. Run only those commands (or stop and ask if a broader build is truly required).
5. Report pass/fail per command with concise diagnostics.
6. If AI tooling setup files changed, confirm `codex/plugins/cthu-codex` was not modified.
