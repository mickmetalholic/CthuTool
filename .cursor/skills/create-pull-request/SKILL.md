---
name: create-pull-request
description: Rebase the current branch onto main, draft PR content, push the branch, and create a pull request with gh.
disable-model-invocation: true
license: MIT
compatibility: Requires git and GitHub CLI.
metadata:
  author: project
  version: "1.0"
---

Create a pull request for the completed work on the current branch.

**Invocation**: `/create-pull-request`

**Steps**

1. **Rebase**

   Run:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

   If merge conflicts occur, stop and wait for the user to resolve them manually. Continue
   only after the user runs `git rebase --continue`.

2. **Analyze changes**

   After the rebase succeeds, run both commands to understand all commits and code changes:

   ```bash
   git log origin/main..HEAD
   git diff origin/main...HEAD
   ```

3. **Generate PR content**

   Draft a pull request title and description in English based on the commit history and diff.

   The PR description must be Markdown and include these sections:

   - **Context & Objective**: Why this change is being made and what problem it solves.
   - **Core Changes**: What was implemented and which core logic/files were modified.
   - **Testing & Notes**: Suggestions for the code reviewer, testing steps, or edge cases.

4. **Push branch**

   Check whether the current branch tracks a remote branch. If not, run:

   ```bash
   git push -u origin HEAD
   ```

   Otherwise run:

   ```bash
   git push
   ```

5. **Create the PR**

   Use GitHub CLI to create the pull request with the generated title and body. Prefer writing
   the PR description to `.git/.tmp-pr-body.md` and passing it with `--body-file`.

   ```bash
   gh pr create --base main --head <current-branch> --title "<generated-title>" --body-file .git/.tmp-pr-body.md
   ```

   Remove `.git/.tmp-pr-body.md` after the PR is created.

6. **Final output**

   Return the created PR URL and a short confirmation summary. Do not ask the user to copy
   content manually.
