## 1. Shared Config Package

- [x] 1.1 Create `packages/config` package metadata, TypeScript config, exports, and workspace wiring.
- [x] 1.2 Define browser site config types, JSON file shape, validation error types, and public exports.
- [x] 1.3 Implement browser sites JSON parsing, file loading, normalization, sensitive-field exclusion, and deterministic validation.
- [x] 1.4 Implement default-plus-override merge behavior by `siteId`, including array replacement semantics.
- [x] 1.5 Add focused package tests for valid required sites, valid anonymous sites, invalid fields, duplicate site ids, malformed JSON, unreadable files, merge overrides, and sensitive field handling.

## 2. Backend Integration

- [x] 2.1 Move backend browser site defaults behind shared config package validation while preserving existing built-in Douban and Zhihu behavior.
- [x] 2.2 Add backend environment/config support for an optional browser sites JSON file path.
- [x] 2.3 Update `BrowserSiteConfigService` to expose effective sites loaded from defaults plus optional JSON overrides.
- [x] 2.4 Ensure backend startup fails with a structured configuration error when an explicit browser sites JSON file is unreadable or invalid.
- [x] 2.5 Update backend browser automation tests for default-only startup, override updates, new site additions, invalid override startup failure, and unchanged `/api/browser/sites` response shape.

## 3. Desktop Boundary

- [x] 3.1 Confirm Desktop browser management UI continues to load effective sites only from backend APIs.
- [x] 3.2 Confirm Desktop login, verify, and clear actions use backend-returned site fields rather than local JSON reads.
- [x] 3.3 Confirm browser site configuration remains exposed through backend APIs for Desktop consumers without CLI command involvement.

## 4. Documentation

- [x] 4.1 Add an example browser sites JSON file showing required and anonymous site entries.
- [x] 4.2 Document the backend environment variable for the browser sites JSON file path and Docker/homelab volume mounting.
- [x] 4.3 Document that login state remains desktop-owned and raw cookies/storage state must not be placed in site config.

## 5. Verification

- [x] 5.1 Run `openspec validate packages-config-browser-sites --type change --strict`.
- [x] 5.2 Run `pnpm --filter @cthutool/config test` and package typecheck/build checks.
- [x] 5.3 Run focused backend browser automation tests and backend build.
- [x] 5.4 Run focused backend and desktop browser-site tests that cover API-only site config consumption.
- [x] 5.5 Run `git diff --check`.
