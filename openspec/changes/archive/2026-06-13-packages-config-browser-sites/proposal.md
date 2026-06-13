## Why

Browser site configuration is currently embedded in the backend browser automation module, which makes homelab customization and future site additions require code changes. Moving the schema, validation, and merge behavior into a shared config package keeps the backend as the runtime owner while allowing site definitions to be edited through a JSON file.

## What Changes

- Add a shared `@cthutool/config` package focused initially on browser site configuration.
- Define a versioned browser sites JSON format with validation, normalization, and deterministic merge behavior.
- Keep backend defaults for built-in sites, but allow a configured JSON file to add or override sites by `siteId`.
- Update the backend browser site config service to load effective site configuration from defaults plus JSON overrides.
- Keep Desktop and CLI as API consumers; they do not read the JSON file or local config package directly for browser site ownership.
- Do not move cookies, Playwright profiles, or desktop login state into backend configuration.

## Capabilities

### New Capabilities
- `packages-config-browser-sites`: Shared config package behavior for loading, validating, normalizing, and merging browser site configuration from JSON files.

### Modified Capabilities
- `apps-backend-browser-automation`: Backend browser automation resolves site configuration from the shared config package and optional JSON override file instead of hardcoded-only service state.
- `apps-desktop-browser-host`: Desktop continues to consume effective site configuration through backend APIs and treats backend site config as runtime source of truth.

## Impact

- New package under `packages/config` with package metadata, TypeScript sources, and focused tests.
- Backend browser automation module imports the shared browser-site config types/helpers.
- Backend configuration gains an environment variable for the optional browser sites JSON path.
- Existing `/api/browser/sites` behavior continues to return effective site configuration.
- Documentation gains an example browser sites JSON file and operational notes for Docker/homelab mounting.
