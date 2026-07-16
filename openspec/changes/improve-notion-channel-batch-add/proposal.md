## Why

The Notion channel skill still inspects channel descriptions and recent content even when the user has already supplied an exact tag, adding unnecessary work and latency. It also accepts only one channel per invocation, making larger Channel Library updates repetitive and inconsistent to review.

## What Changes

- Separate minimal channel identity lookup from content inspection so an exact user-supplied existing tag skips category inference and any second confirmation.
- Extend `$notion-add-channel` to accept one or more YouTube or Bilibili channel URLs in the same invocation.
- Support batch-level default tags with optional per-channel overrides, while continuing to use only current Notion `Tags` options.
- Load the live Notion schema and templates once per invocation, detect duplicates both within the input batch and in the database, and inspect content only for non-duplicate channels that still lack tags.
- Consolidate unresolved or inferred tag decisions before writing, preflight the batch, create the ready entries together, and report verification results per channel.
- Preserve the existing explicit-only invocation policy and single-channel compatibility.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-channel-skill`: Add the explicit-tag fast path and define multi-channel parsing, validation, duplicate prevention, confirmation, creation, and reporting behavior.

## Impact

- Affected plugin source: `codex/plugins/cthu-codex/skills/notion-add-channel/` and the CthuCodex plugin cachebuster metadata.
- Affected documentation: `apps/docs/src/content/docs/modules/codex-plugin.md`.
- Affected specification: `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md` through this change's delta spec.
- External systems remain the Notion connector plus YouTube and Bilibili metadata; no new runtime dependency or MCP server is introduced.
