---
description: Analyzes staged git changes and automatically generates a commit message based on project rules.
globs: *
alwaysApply: false
---

Perform the following steps to commit the currently staged changes:

1. **Analyze Staged Changes**: Run `git diff --cached` in the terminal to review the exact code changes that are currently staged.
2. **Read Guidelines**: Read the commit message formatting rules specified in the `.cursor\rules\git-commit-convention.mdc` file.
3. **Generate Message**: Based on the staged changes and strictly following the rules read in step 2, generate a precise, descriptive, and well-structured commit message in **English**.
4. **Execute Commit**: Automatically run the command `git commit --trailer "Made-with: Cursor" -m "<your_generated_commit_message>"` in the terminal to complete the commit.
