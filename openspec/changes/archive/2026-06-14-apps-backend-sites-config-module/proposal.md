## Why

Backend site configuration is currently implemented as `BrowserSiteConfigService` inside the browser automation module, which makes a pure configuration concern look like browser runtime logic. Extracting it first gives the backend a neutral `SitesConfigModule` boundary that can later become part of a broader backend configuration module without entangling agent state or browser command orchestration.

## What Changes

- Add a backend `SitesConfigModule` that owns effective site configuration loading, built-in defaults, optional JSON override loading, and site resolution.
- Rename the backend service boundary from browser-specific `BrowserSiteConfigService` to neutral `SitesConfigService`, while continuing to use the existing shared `@cthutool/config` browser-site schema and types.
- Update browser automation services and controllers to consume `SitesConfigModule` instead of registering site config providers directly inside `BrowserAutomationModule`.
- Keep `/api/browser/sites`, browser content resolution, desktop consumption, CLI status behavior, JSON config shape, environment variables, and startup error behavior unchanged.
- Leave agent state, pending-auth projection, browser command dispatch, and browser content orchestration inside the existing browser automation module for this change.

## Capabilities

### New Capabilities
- `apps-backend-sites-config`: Backend-owned site configuration module, service boundary, and consumer contract.

### Modified Capabilities
- `apps-backend-browser-automation`: Browser automation consumes site configuration from the backend sites config module instead of owning site config providers directly.

## Impact

- Affected code: `apps/backend/src/modules/browser-automation/*`, a new backend sites config module directory, and focused backend tests.
- Affected specs: new `apps-backend-sites-config` capability and a narrow browser automation requirement update.
- API compatibility: no public route or response-shape changes.
- Runtime compatibility: no change to JSON config format, default site entries, environment variable names, or desktop/CLI consumption paths.
