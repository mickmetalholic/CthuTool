## Context

The shared `@cthutool/config` package already owns the browser sites JSON schema, validation, file loading, and merge behavior. Backend currently wraps that package with `BrowserSiteConfigService` inside `apps/backend/src/modules/browser-automation`, and `BrowserAutomationModule` registers the provider factory that reads `parseBrowserConfiguration(process.env).sitesConfigFile`.

That placement makes site configuration look like browser runtime orchestration. It also makes the current `BrowserAutomationModule` harder to split because consumers must import the browser automation module even when they only need effective site metadata. This change extracts the backend wrapper into a neutral `SitesConfigModule` first, while leaving agent state and browser command dispatch untouched.

## Goals / Non-Goals

**Goals:**

- Introduce a backend `SitesConfigModule` with a `SitesConfigService` that owns effective site configuration loading and lookup.
- Keep the existing JSON schema, defaults, override file behavior, startup failure behavior, and public `/api/browser/sites` response shape.
- Let browser automation import site configuration through a module dependency instead of declaring the site config provider itself.
- Keep the service boundary neutral enough to become part of a broader backend configuration module later.

**Non-Goals:**

- Do not redesign the shared `@cthutool/config` package or rename its exported browser-site types in this change.
- Do not change desktop profile storage, pending-auth state, browser command dispatch, or agent WebSocket protocols.
- Do not split agent state or browser command gateway modules yet.
- Do not add persistence, database-backed site configuration, UI editing, or new site config fields.

## Decisions

### Decision: Create `SitesConfigModule` instead of `BrowserSitesModule`

`SitesConfigModule` owns backend effective site configuration as operational metadata. Browser automation is one consumer, but the module does not know about browser runtime, agents, Playwright, profile storage, pending auth tasks, or diagnostics.

Alternative considered: `BrowserSitesModule`. That name would reflect today's only consumer, but it keeps the configuration boundary tied to browser automation and makes the future larger config module harder to explain.

### Decision: Rename only the backend wrapper first

The backend wrapper becomes `SitesConfigService`, but it can continue returning `BrowserSiteConfig` from `@cthutool/config` for now. Renaming the shared package types to `SiteConfig` would be broader churn and can be deferred until there is another non-browser site-config consumer.

Alternative considered: rename all browser-site types immediately. That would make naming perfectly neutral, but it would touch package, backend, desktop, CLI, docs, and specs for little runtime benefit.

### Decision: Preserve the current API surface

`/api/browser/sites` continues to exist under the browser API because desktop and CLI currently consume browser-facing site metadata there. The controller can move later, but this change should not force frontend or CLI route updates.

Alternative considered: add `/api/sites` now. That would introduce duplicate API ownership before there is a clear non-browser consumer.

### Decision: Keep browser automation as the content-use-case owner

`BrowserContentService` continues to resolve site metadata before dispatching browser work. The difference is only that site metadata arrives from `SitesConfigModule`. This keeps the change focused and avoids mixing it with the later AgentStateModule / command-gateway discussion.

## Risks / Trade-offs

- Renaming the service can create noisy imports -> keep file moves and aliases minimal, and update focused tests alongside module wiring.
- The module name is broader than today's config domain -> limit exported providers to effective site config only so it does not become a generic dumping ground.
- Public route ownership remains browser-oriented -> document that the API is intentionally unchanged in this change and can be revisited when non-browser consumers appear.
- Future `AgentStateModule` analysis may move more files -> keep this change independent so it can land before the larger agent-boundary refactor.

## Migration Plan

1. Add `apps/backend/src/modules/sites-config` with `SitesConfigModule` and `SitesConfigService`.
2. Move or wrap the existing built-in defaults and effective site loading logic in `SitesConfigService`.
3. Import `SitesConfigModule` from `BrowserAutomationModule` and replace direct `BrowserSiteConfigService` provider registration.
4. Update browser automation services/controllers/tests to inject `SitesConfigService`.
5. Run focused backend browser automation and sites config tests plus backend typecheck/build.

Rollback is straightforward: restore the `BrowserSiteConfigService` provider registration inside `BrowserAutomationModule` and move consumers back to the old service name.

## Open Questions

- Should the public route eventually move from `/api/browser/sites` to a neutral `/api/sites` endpoint once there is a non-browser consumer?
- Should shared package types eventually be renamed from `BrowserSiteConfig` to `SiteConfig`, with browser-specific fields split out only if another domain needs the same site registry?
