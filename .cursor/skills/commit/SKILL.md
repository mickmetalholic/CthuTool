---
name: commit
description: Analyze staged git changes, generate an English Conventional Commit message, and commit with the Cursor trailer.
disable-model-invocation: true
license: MIT
compatibility: Requires git.
metadata:
  author: project
  version: "1.2"
---

Commit the currently staged changes.

**Invocation**: `/commit`

**Steps**

1. **Analyze staged changes**

   Run `git diff --cached` to review the exact code changes that are currently staged.

   If no changes are staged, stop and tell the user to stage files before running `/commit`.

2. **Load commit rules from repository config**

   Do not hardcode commit rules in this skill. Run:

   ```bash
   node .cursor/skills/commit/scripts/print-rules.mjs
   ```

   The script reads `commitlint.config.cjs` and the resolved commitlint configuration,
   then prints the enforced rules and exempt message patterns.

   Apply every enforced rule when generating the commit message.

3. **Generate the commit message**

   Based on the staged changes, generate a precise, descriptive, well-structured commit
   message in English that satisfies the loaded rules.

4. **Validate before committing**

   Validate the proposed message and fix any violations before proceeding:

   ```bash
   node .cursor/skills/commit/scripts/print-rules.mjs validate "<generated_commit_message>"
   ```

5. **Create the commit**

   Run:

   ```bash
   git commit --trailer "Made-with: Cursor" -m "<generated_commit_message>"
   ```

   Use additional `-m` arguments for a body or footer when needed.

6. **Final output**

   Return the created commit hash and the commit subject.
