---
name: review-diff
description: Read-only review of the current git diff, generated-file drift, and scope boundaries. Use before committing or when checking whether a change stayed within its intended ownership.
---

Review the current worktree diff without mutating anything.

**Mutation boundary:** read-only. Do not edit files, commit, push, create a pull request, or run write-capable setup commands.

## Steps

1. Run `git status` and inspect staged and unstaged diffs.
2. Call out scope risks:
   - Changes outside the stated task or OpenSpec change
   - Edits under `codex/plugins/cthu-codex` unless explicitly requested
   - Hand-edits to generated `openspec-*` adapters instead of regenerating via setup
   - Unexpected third-party skill copies or Reasonix personal config
3. Note generated-file drift: ignored adapter trees that should come from `pnpm setup:ai-tooling` rather than manual edits.
4. Summarize findings as defects, risks, and residual gaps. Do not auto-fix.
5. If the user wants a commit or PR afterward, point them to the explicit commit / pull-request workflows; do not invoke those actions from this skill.
