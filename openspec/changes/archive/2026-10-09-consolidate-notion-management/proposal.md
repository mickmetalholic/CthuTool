## Why

Eleven separately invoked library skills duplicate the same CRUD and presentation rules. A single manual entry point can load only the library guidance needed for the user's request.

## What Changes

- Replace eleven `notion-manage-*` entry points with `notion-manage`.
- Move library-specific schema and safeguards into linked reference files; load Classical Work guidance only for Works matching.
- Preserve the optional music resolver under the unified skill and update documentation, tests, and current capability entry-point contracts.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-management`: Explicit routing and shared CRUD across personal libraries.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-book-library-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-channel-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-comic-library-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-album-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-movie-library-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-drama-library-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-game-library-skill`: Unified entry point.
- `codex-plugins-cthu-codex-notion-knowledge-skill`: Unified entry point.

## Impact

Requested business plugin, its docs, resolver integration-test paths, and scoped OpenSpec contracts. Existing library behavior and manual-only invocation remain. No Notion data or installed plugin changes.
