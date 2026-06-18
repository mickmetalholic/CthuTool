---
name: commit
description: Analyze staged git changes, generate an English Conventional Commit message, and commit with the Cursor trailer.
disable-model-invocation: true
license: MIT
compatibility: Requires git.
metadata:
  author: project
  version: "1.0"
---

Commit the currently staged changes.

**Invocation**: `/commit`

**Steps**

1. **Analyze staged changes**

   Run `git diff --cached` to review the exact code changes that are currently staged.

   If no changes are staged, stop and tell the user to stage files before running `/commit`.

2. **Apply commit guidelines**

   Follow these rules, which must stay aligned with `commitlint.config.cjs`:

   - Use Conventional Commits: `type(scope): subject`.
   - `scope` is optional; when present, use kebab-case.
   - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
     `build`, `ci`, `chore`.
   - Write the subject in English imperative mood, with a lowercase first letter and no
     trailing period.
   - If a body is needed, separate it from the subject with a blank line and write it in
     English.
   - Keep every body and footer line at or below 100 characters.
   - If a footer is needed, write it in English.
   - Do not include CJK characters in the subject, body, or footer.
   - For breaking changes, use an English `BREAKING CHANGE:` footer.
   - Do not rewrite exempt git-generated messages such as merge commits or `Revert "..."`
     messages into Conventional Commit format.

3. **Generate the commit message**

   Based on the staged changes, generate a precise, descriptive, well-structured commit
   message in English.

   Ensure the message satisfies the repository commitlint configuration.

4. **Create the commit**

   Run:

   ```bash
   git commit --trailer "Made-with: Cursor" -m "<generated_commit_message>"
   ```

   Use additional `-m` arguments for a body or footer when needed.

5. **Final output**

   Return the created commit hash and the commit subject.
