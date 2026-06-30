## Context

The current main OpenSpec set contains 56 first-level capabilities and validates successfully. The main maintenance problem is not parser correctness; it is discoverability and stale wording left by archived changes. The current set includes newer backend browser boundaries such as `apps-backend-browser-service`, `apps-backend-browser-public-api`, `packages-browser-runtime-protocol`, and `packages-browser-client-sdk`, plus several observability capabilities that did not exist when this cleanup was first proposed.

OpenSpec 1.3.1 discovers specs as `openspec/specs/<capability>/spec.md` and active change deltas as `openspec/changes/<change>/specs/<capability>/spec.md`. Nested area directories under `openspec/specs/` would not be first-class capabilities for listing, validation, archive, or apply flows. Project policy also prefers ownership-visible area prefixes rather than generic names.

## Goals / Non-Goals

**Goals:**

- Make the current 56-capability spec set easier to browse through a non-normative `openspec/specs/README.md` capability map.
- Preserve OpenSpec-compatible first-level capability directories and ownership-visible prefixes.
- Replace placeholder Purpose text and normalize missing top-level titles in main specs.
- Clean up backend browser wording so business-facing browser workflows consistently point at `BrowserService`, while `DesktopBrowserRuntimeModule` remains the lower-level runtime client.
- Record possible future consolidation candidates without deleting or merging capability directories in this change.

**Non-Goals:**

- Do not restructure `openspec/specs/` into nested subdirectories.
- Do not edit archived changes under `openspec/changes/archive/**`.
- Do not modify application code, package dependencies, generated agent adapter files, public APIs, runtime behavior, or build configuration.
- Do not merge or delete capability directories in this change.

## Decisions

1. Keep first-level capability directories and add a capability map.

   `openspec/specs/README.md` will group existing specs by area prefix and explain ownership boundaries. This gives humans the navigation benefit of subdirectories without breaking OpenSpec commands. The alternative, moving specs into nested area folders, was rejected because current OpenSpec discovery only treats first-level directories containing `spec.md` as capabilities.

2. Treat the capability map as non-normative.

   Requirement behavior remains in each capability's `spec.md`. The map should summarize purpose, ownership, and related specs, but it must not introduce new product requirements. This avoids a second source of truth.

3. Limit normative deltas to backend browser boundary wording.

   Main specs already validate, and most cleanup is editorial. The only requirement-level change in this cleanup is to align browser content/service wording with the current `BrowserService` aggregate boundary. This keeps the change small enough to review while still removing stale public-boundary language.

4. Defer capability consolidation.

   Specs such as `apps-backend-browser-agent-capture`, `apps-backend-browser-automation`, `apps-backend-agent-state`, and the small GitOps specs are possible future consolidation candidates. They should not be merged here because OpenSpec has no first-class capability-directory merge operation, and deleting capability directories is a larger governance decision than adding a map and normalizing docs.

## Risks / Trade-offs

- [Risk] The capability map can drift from individual specs. Mitigation: keep it short, link to capability names, and update it only as part of OpenSpec changes that add, remove, or meaningfully move specs.
- [Risk] Purpose rewrites may accidentally imply new behavior. Mitigation: keep Purpose text descriptive and avoid SHALL/MUST language outside Requirements.
- [Risk] Backend browser docs may still contain implementation-internal names after this cleanup. Mitigation: tasks include targeted searches for `BrowserContentModule`, `BrowserContentService`, and stale browser-automation references after edits.
- [Risk] Deferring consolidation leaves small specs in place. Mitigation: the capability map will make their status visible, and a later dedicated consolidation change can handle directory removal with explicit manual cleanup tasks.

## Migration Plan

1. Create delta specs for the backend browser wording that changes normative requirements.
2. Add the capability map and normalize main spec titles/Purpose sections during implementation.
3. Validate main specs and the active change with OpenSpec.
4. Leave follow-up consolidation candidates documented, but do not delete capability directories in this change.

## Open Questions

- Should a future consolidation change merge retired backend browser marker specs into `apps-backend-browser-service` or `apps-backend-desktop-browser-runtime`?
- Should the small GitOps specs stay separate because they map to different cluster ownership surfaces, or become one broader GitOps delivery capability?
