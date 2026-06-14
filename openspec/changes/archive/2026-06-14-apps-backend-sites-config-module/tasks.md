## 1. Sites Config Module

- [x] 1.1 Create `apps/backend/src/modules/sites-config` with `SitesConfigModule` and `SitesConfigService`.
- [x] 1.2 Move the built-in site defaults and effective site loading logic out of `browser-automation/browser-site-config.service.ts`.
- [x] 1.3 Keep `SitesConfigService.create()` support for the configured override file path and preserve startup failure behavior for invalid overrides.
- [x] 1.4 Preserve `listSites`, `getSite`, and `resolveForUrl` behavior, including copied return values and deterministic effective site entries.

## 2. Browser Automation Wiring

- [x] 2.1 Import `SitesConfigModule` from `BrowserAutomationModule`.
- [x] 2.2 Replace direct `BrowserSiteConfigService` provider registration with injection of `SitesConfigService`.
- [x] 2.3 Update `BrowserContentService` to resolve site metadata through `SitesConfigService`.
- [x] 2.4 Update `BrowserAutomationController` `/api/browser/sites` handling to consume `SitesConfigService` while preserving the route and response shape.
- [x] 2.5 Leave browser agent state, pending-auth task projection, command dispatch, and diagnostics providers in the existing browser automation module.

## 3. Tests

- [x] 3.1 Move or rewrite `browser-site-config.service.spec.ts` as focused `SitesConfigService` coverage.
- [x] 3.2 Update browser automation controller and content service tests for the new injection token/service name.
- [x] 3.3 Add or update module wiring tests to confirm `BrowserAutomationModule` compiles through `SitesConfigModule`.
- [x] 3.4 Confirm override-file, invalid-override, built-in default, site-id lookup, URL-origin lookup, and copied-return-value behavior.

## 4. Verification

- [x] 4.1 Run `openspec validate apps-backend-sites-config-module --type change --strict`.
- [x] 4.2 Run focused backend tests for sites config, browser automation controller, browser content service, and browser automation module wiring.
- [x] 4.3 Run backend typecheck or build.
- [x] 4.4 Run `git diff --check`.
