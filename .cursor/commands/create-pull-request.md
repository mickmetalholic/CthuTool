---
description: Fetches origin, rebases the current branch onto main, drafts PR content, and creates a Pull Request via gh.
globs: *
alwaysApply: false
---

I have completed the tasks on this branch. Please perform the following steps sequentially:

1. **Rebase**: Execute `git fetch origin` and `git rebase origin/main` in the terminal. If merge conflicts occur, stop and wait for me to resolve them manually, then continue after I run `git rebase --continue`.
2. **Analyze Changes**: After the rebase succeeds, run both `git log origin/main..HEAD` and `git diff origin/main...HEAD` to understand all commits and code changes on this branch.
3. **Generate PR Content**: Based on the commit history and code diff, draft a Pull Request title and description in **English**.
4. **Format Requirements**: The PR description must be Markdown and strictly include these sections:
   - **Context & Objective**: Why this change is being made and what problem it solves.
   - **Core Changes**: What was implemented and which core logic/files were modified.
   - **Testing & Notes**: Suggestions for the Code Reviewer, testing steps, or any edge cases to keep in mind.
5. **Push Branch (if needed)**: Check whether the current branch is already tracking a remote branch. If not, run `git push -u origin HEAD`; otherwise run `git push`.
6. **Create PR via gh (prefer body file)**: Use GitHub CLI to directly create the pull request with the generated title/body. Prefer writing the PR description to a temporary Markdown file and using `--body-file`.
   - PowerShell example:
     - `@'`
     - `<generated-body-markdown>`
     - `'@ | Set-Content -Path .git/.tmp-pr-body.md`
     - `gh pr create --base main --head <current-branch> --title "<generated-title>" --body-file .git/.tmp-pr-body.md`
   - If needed, remove the temp file after creation: `Remove-Item .git/.tmp-pr-body.md`.
7. **Final Output**: Do not ask me to copy content manually. Return the created PR URL and a short confirmation summary in this chat.
