---
description: Fetches origin, rebases the current branch onto main, and drafts a structured Pull Request description.
globs: *
alwaysApply: false
---

I have completed the tasks on this branch. Please perform the following steps sequentially:

1. **Rebase**: Execute `git fetch origin` and `git rebase origin/main` in the terminal. (If there are merge conflicts, please pause the terminal execution and wait for me to manually resolve them and run `git rebase --continue`).
2. **Analyze Changes**: Once the rebase is successfully completed, run `git log origin/main..HEAD` in the terminal to retrieve the latest commits of the current branch relative to the main branch.
3. **Generate PR Content**: Based on the code differences and commit history, draft a Pull Request title and description in **English**. 
4. **Format Requirements**: The PR description must be formatted in Markdown and strictly include the following sections:
   - **Context & Objective**: Why this change is being made and what problem it solves.
   - **Core Changes**: What was implemented and which core logic/files were modified.
   - **Testing & Notes**: Suggestions for the Code Reviewer, testing steps, or any edge cases to keep in mind.

Please present the drafted PR title and description directly in this chat so I can copy them.
