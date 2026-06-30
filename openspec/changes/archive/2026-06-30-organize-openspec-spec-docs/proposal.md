## Why

The main OpenSpec specifications validate successfully, but the spec set has grown to 56 capabilities and is becoming hard to navigate without an explicit map. Several specs still carry archived-change placeholder Purpose sections or inconsistent document structure, and the backend browser specs now need documentation cleanup around the newer `BrowserService` aggregate boundary rather than the older runtime-boundary conflict.

## What Changes

- Normalize main spec document structure so every `openspec/specs/<capability>/spec.md` has a clear top-level title, a useful Purpose, and consistent section spacing.
- Replace archived-change placeholder Purpose text with concise capability summaries.
- Add `openspec/specs/README.md` as a non-normative capability map that groups existing first-level capability directories by area prefix and summarizes ownership boundaries, including the current backend browser, browser protocol/client SDK, observability, GitOps, apps, packages, Codex plugin, and collection-hub areas.
- Preserve existing capability directory names and area prefixes; do not rename `collection-hub-*` or other already clear area-prefixed specs.
- Do not restructure specs into nested subdirectories; OpenSpec CLI support remains centered on `openspec/specs/<capability>/spec.md` and `openspec/changes/<change>/specs/<capability>/spec.md`.
- Review low-signal capability specs for consolidation, limited to retired, placeholder, or boundary-only specs where the requirement belongs more naturally inside an existing owning capability; record consolidation candidates in the design and tasks rather than merging capability directories in this change.
- Avoid merging large or actively evolving product/module capabilities solely to reduce directory count; large specs should be handled by clearer mapping first and split later only when ownership or change cadence requires it.
- Leave `openspec/changes/archive/**` historical artifacts unchanged.
- Clean up backend browser documentation around the current aggregate boundary:
  - `BrowserService` is the backend business-facing facade for approved browser workflows.
  - `DesktopBrowserRuntimeModule` remains the lower-level backend client for typed desktop browser runtime operations.
  - Content/auth specs should avoid stale public-boundary wording that suggests backend business modules import content/auth internals directly.
- Keep the change documentation-focused: no application code, public APIs, runtime behavior, package dependencies, or generated adapter folders are changed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-backend-browser-content`: Clean up residual public-boundary wording so content workflows are described as exposed through `BrowserService` while content helpers remain internal implementation details.
- `apps-backend-browser-service`: Clarify the aggregate browser boundary as the capability-map anchor for backend browser workflows.

## Impact

- Affected artifacts are limited to OpenSpec documents under `openspec/specs/**`, the non-normative capability map at `openspec/specs/README.md`, and this change's OpenSpec artifacts.
- No source code, APIs, database schemas, package dependencies, build scripts, or runtime configuration are expected to change.
- Future OpenSpec work should get clearer capability summaries and fewer contradictory backend browser boundary requirements.
- Potential future consolidation of retired or boundary-only specs will require a separate scoped change because OpenSpec delta application updates requirement content but does not provide a first-class capability-directory merge operation.
