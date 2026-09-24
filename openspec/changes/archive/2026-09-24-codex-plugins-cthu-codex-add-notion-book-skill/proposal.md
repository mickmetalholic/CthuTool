## Why

The personal Notion Book Library needs a lightweight, explicitly invoked skill for routine entry maintenance. Its book identity, shared relations, template/icon consistency, and manual cover workflow need durable guidance without imposing a fixed interaction format.

## What Changes

- **BREAKING**: Replace `notion-maintain-books` with `notion-manage-books` to the CthuCodex business plugin, using the existing `notion-` naming family and explicit-only invocation.
- Support natural-language create, read, update, and reversible delete requests against the configured Book Library.
- Update plugin README and docs to the sole manual book entrypoint; keep page bodies for personal notes.
- Preserve personal records and shared relations, check duplicates and edition identity, and report limited query coverage or uncertain writes honestly.
- Use the database template for creation and preserve its conventions on updates; repair the shared icon if template application fails without duplicating page content.
- Return a verified cover image or direct image link for each new book, or report that none was found.
- Exclude database view management, including the user's personal download view, and avoid scripts, service changes, or fixed input formats.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-book-library-skill`: Explicit-only, lightweight Book Library maintenance with template/icon consistency and manual cover handoff.

### Modified Capabilities

None.

## Impact

- Source: `codex/plugins/cthu-codex/skills/notion-manage-books/SKILL.md` and `agents/openai.yaml`. A draft already exists in the working tree; this change formalizes its acceptance criteria.
- Runtime dependencies: existing connected Notion tools and public metadata/image lookup when needed; no new backend, MCP server, or package dependency.
- This change explicitly targets the business plugin. Remove the former book skill and update its documentation. Generated OpenSpec adapters, unrelated skills and changes, and live Notion records remain outside this planning work. Plugin installation or publication is not part of this change.
