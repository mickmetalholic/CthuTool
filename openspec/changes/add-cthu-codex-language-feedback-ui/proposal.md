## Why

Language-coach feedback currently appears as a fenced text block at the start of an otherwise normal response, so the correction is easy to miss and has no stable structure for richer presentation. CthuCodex needs a progressive-enhancement UI boundary now so the feedback can become visually prominent and gain additional display variants without repeatedly changing the prompt hook contract.

## What Changes

- Add a CthuCodex language-feedback MCP Apps surface that renders structured English corrections as an inline, theme-aware card on compatible hosts.
- Define a versioned language-feedback payload with the original prose, best natural rewrite, categorized notes, and a presentation variant so future compact, diff, learning, and vocabulary views can share one contract.
- Change the language-coach instructions injected by the existing `UserPromptSubmit` hook so the model uses the language-feedback presentation tool when it is available.
- Preserve a prominent Markdown fallback when the UI tool is unavailable, the host does not render MCP Apps resources, or the tool call fails.
- Keep deterministic English-prose detection in the existing hook and keep correction generation in the active Codex model; the new MCP server only validates and presents model-produced feedback.
- Keep the presentation path read-only in this change. Copy controls may operate locally in the component, but Anki creation, persistent preferences, telemetry, and correction history remain out of scope.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-language-feedback-ui`: Defines the structured language-feedback contract, MCP Apps resource and presentation tool, inline card behavior, display variants, local interactions, and text fallback for hosts without component rendering.

### Modified Capabilities

- `codex-plugins-cthu-codex-language-coach`: Changes injected coaching instructions from a fenced-text-only response contract to progressive enhancement through the language-feedback UI tool with a prominent Markdown fallback.

## Impact

- Updates `codex/plugins/cthu-codex/scripts/language-coach.mjs` while preserving its existing English-prose detector and silent behavior for non-triggering prompts.
- Adds a dedicated CthuCodex UI MCP server and versioned component assets under `codex/plugins/cthu-codex`, registered separately from the existing Anki MCP server in `.mcp.json`.
- Adds focused tests for MCP tool metadata, payload validation, UI resource delivery, hook instructions, and fallback behavior; existing language-coach detector tests remain authoritative for routing.
- Updates the CthuCodex plugin documentation and user-facing docs to describe supported hosts, progressive enhancement, and fallback behavior.
- May add build-time UI dependencies and a bundled component artifact, but does not add network access, mutate external data, change Anki tools, or alter unrelated plugin skills and hooks.
