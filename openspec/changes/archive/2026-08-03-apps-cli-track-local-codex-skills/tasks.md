## 1. Backend Provenance Contract

- [x] 1.1 Extend the installed-skill backend model with a validated local GitHub candidate containing repository, selector or skill path, and optional recorded ref while preserving existing managed-installation fields.
- [x] 1.2 Parse supported version 3 lock metadata into canonical GitHub candidates and fail closed for malformed GitHub entries without adopting well-known, non-GitHub, manual, plugin, system, or provenance-incomplete skills.
- [x] 1.3 Add pinned-backend contract fixtures and tests for GitHub candidate extraction, selector normalization, recorded refs, unsupported sources, and contract mismatches.

## 2. Unified Inventory and Plan Model

- [x] 2.1 Build inventory from the union of manifest entries and eligible local GitHub candidates, deduplicate manifest-backed names, and classify absent candidates as `local_only`.
- [x] 2.2 Add `track` to valid actions and plan items so local-only rows cycle between no action and Track while existing managed states retain their current transitions.
- [x] 2.3 Include eligible local-only rows and Track actions in read-only JSON output while keeping unsupported local skills absent from both human and JSON inventories.

## 3. Interactive Tracking Workflow

- [x] 3.1 Render local-only rows in the managed action table and distinguish the empty-inventory guidance from a displayed table submitted with every row at no action.
- [x] 3.2 Collect an explicit branch-versus-pin choice and ref for each selected Track item, use supported backend metadata only as defaults, and validate the chosen GitHub source and selector before plan review.
- [x] 3.3 Render Track as a manifest-only plan effect with full source metadata and retain default-negative confirmation and clean cancellation.
- [x] 3.4 Execute confirmed Track items as atomic version 2 manifest upserts without invoking install, update, remove, or local file-copy operations, preserving per-item partial-success reporting.

## 4. Documentation and Verification

- [x] 4.1 Add unit tests for union inventory classification, local-only action cycling, unsupported-source exclusion, metadata completion, Track manifest writes, cancellation, and partial failures.
- [x] 4.2 Add CLI integration coverage for an empty manifest with eligible local GitHub skills, empty-state guidance, read-only JSON inventory, reviewed Track execution, and unchanged unmanaged local state.
- [x] 4.3 Update CLI documentation to explain local-only tracking, manifest-only effects, provenance eligibility, excluded local sources, and Add-versus-Track behavior.
- [x] 4.4 Run targeted Biome checks, CLI TypeScript type checking, affected unit and integration tests, rebuild and verify the committed CLI bundle, and run `git diff --check`.
- [x] 4.5 Run strict OpenSpec validation and status checks for `apps-cli-track-local-codex-skills`, and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
