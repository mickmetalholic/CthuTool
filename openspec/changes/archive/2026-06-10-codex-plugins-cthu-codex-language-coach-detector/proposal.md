## Why

The CthuCodex language-coach hook already uses a local `UserPromptSubmit` gate, but its current English-dominance heuristic is too shallow for common Codex prompts that include pasted code, command lines, identifiers, logs, or a long body followed by a short user question. Better Phrase demonstrates that this class of prompt coaching works best when cheap deterministic filtering prevents both noisy trigger behavior and unnecessary model context.

## What Changes

- Strengthen the `codex/plugins/cthu-codex` language-coach hook detector with local prompt cleanup before language routing.
- Ignore fenced code blocks, inline code spans, and slash/bang command lines before evaluating whether English prose is present.
- Avoid triggering on code-like identifier lists such as camelCase hooks, all-caps constants, and versioned technology tokens.
- Add a tail-only heuristic so a long pasted body followed by a short trailing user question is evaluated by the trailing user intent, not the whole paste.
- Expand integration tests for the hook with cases adapted from the Better Phrase detector model: pure Chinese, short acknowledgements, code-only text, commands, fenced English, English prose, English-dominant mixed prose, Chinese-dominant mixed prose, and long paste plus short tail.
- Preserve the current English-coach scope: no default Chinese-to-English translation, no new skill, no Anki behavior in the hook, and no change to `chc codex install` ownership boundaries.

## Capabilities

### New Capabilities
- `codex-plugins-cthu-codex-language-coach`: Defines the CthuCodex language-coach hook routing contract, including prompt cleanup, prose detection, silence behavior, and injected coaching context.

### Modified Capabilities
None.

## Impact

- Updates `codex/plugins/cthu-codex/scripts/language-coach.mjs`.
- Expands `apps/cli/tests/integration/language-coach-hook.test.ts`.
- May update `codex/plugins/cthu-codex/README.md` to document that the hook uses deterministic local filtering and intentionally does not translate Chinese by default.
- Does not introduce new runtime dependencies.
- Does not change plugin installation, MCP server behavior, Anki tools, or repository-managed Codex asset boundaries.
