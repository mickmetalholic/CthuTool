## 1. Test Coverage

- [x] 1.1 Expand `apps/cli/tests/integration/language-coach-hook.test.ts` with helper assertions for silent `{}` output and coaching-context output.
- [x] 1.2 Add inert-input tests for empty input, invalid JSON, pure Chinese, Chinese-dominant mixed text, short acknowledgements, slash/bang command lines, fenced English, inline-code-only English, and code-like identifier lists.
- [x] 1.3 Add active-input tests for English prose, English-dominant mixed prose, imperative English without obvious function words, prose mixed with identifiers, and long pasted context followed by a short English question.
- [x] 1.4 Add tail-only tests for long pasted context followed by a trivial acknowledgement and for balanced multi-sentence prose that should be evaluated as a whole.

## 2. Detector Implementation

- [x] 2.1 Refactor `codex/plugins/cthu-codex/scripts/language-coach.mjs` so prompt extraction remains tolerant of `user_prompt`, `prompt`, and `message`.
- [x] 2.2 Add prompt cleanup that removes fenced code blocks, inline code spans, and command lines beginning with `/` or `!` before language detection.
- [x] 2.3 Add trailing-intent extraction for the long-body-plus-short-tail prompt shape.
- [x] 2.4 Replace the current raw English-dominance check with prose detection that requires sufficient English signal, preserves English-dominant mixed prose, and rejects all-code-like token lists.
- [x] 2.5 Preserve the existing `hookSpecificOutput.additionalContext` payload and silent `{}` behavior for non-triggering inputs.

## 3. Documentation and Verification

- [x] 3.1 Update `codex/plugins/cthu-codex/README.md` if needed to clarify that the language coach uses deterministic local filtering and does not translate Chinese by default.
- [x] 3.2 Run `pnpm --filter @cthutool/cli test -- language-coach-hook` or the closest supported focused Bun test command for the hook integration test.
- [x] 3.3 Run `pnpm --filter @cthutool/cli test` if the focused test command is unavailable or insufficient.
- [x] 3.4 Run `git diff --check` to catch whitespace issues in the change.
