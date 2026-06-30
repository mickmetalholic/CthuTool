## 1. Spec Inventory And Map

- [x] 1.1 Inventory current first-level `openspec/specs/<capability>/spec.md` directories and group them by ownership-visible area prefix.
- [x] 1.2 Create `openspec/specs/README.md` as a non-normative capability map covering backend browser, browser protocol/client SDK, observability, GitOps, apps, packages, Codex plugin, and collection-hub areas.
- [x] 1.3 Mark retired, placeholder, or boundary-only specs as consolidation candidates in the capability map without deleting or moving their directories.
- [x] 1.4 Confirm the map links to existing capability names and does not introduce SHALL/MUST product requirements.

## 2. Main Spec Documentation Cleanup

- [x] 2.1 Replace archived-change placeholder Purpose text in main specs with concise descriptive Purpose sections.
- [x] 2.2 Add missing top-level `# <capability> Specification` headings to specs that currently start at `## Purpose`.
- [x] 2.3 Preserve existing first-level capability directory names and avoid nested `openspec/specs/<area>/<capability>/` layouts.
- [x] 2.4 Leave `openspec/changes/archive/**` unchanged.

## 3. Backend Browser Boundary Wording

- [x] 3.1 Apply the `apps-backend-browser-service` delta so OpenSpec documentation identifies `BrowserService` as the backend browser aggregate entry point.
- [x] 3.2 Apply the `apps-backend-browser-content` delta so browser content workflows are described as exposed through `BrowserService` while content helpers remain internal.
- [x] 3.3 Search backend browser specs for stale public-boundary wording such as direct business-module imports of `BrowserContentModule` or `BrowserContentService`, and update only wording covered by this change.
- [x] 3.4 Keep `DesktopBrowserRuntimeModule` documented as the lower-level runtime client rather than a business-facing facade.

## 4. Verification

- [x] 4.1 Run `openspec validate --specs` and confirm all main specs pass.
- [x] 4.2 Run `openspec validate organize-openspec-spec-docs` and confirm the active change passes.
- [x] 4.3 Confirm no application source files, package manifests, generated `.claude/`, `.codex/`, or `.cursor/` adapter files were changed.
- [x] 4.4 Review `git diff` to confirm the change is limited to OpenSpec documentation and this change's artifacts.
