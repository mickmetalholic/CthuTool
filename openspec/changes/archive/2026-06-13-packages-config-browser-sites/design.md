## Context

The browser automation flow now treats backend site configuration as the source of truth for `authPolicy`, allowed origins, login URLs, verification URLs, and default profile names. That configuration is currently implemented directly inside the backend browser automation module, while desktop agents only own local browser profiles and login state.

This change introduces a shared `@cthutool/config` package so configuration parsing and validation can be reused without moving runtime ownership away from the backend. The first supported config domain is browser sites. The backend will keep built-in defaults and optionally merge an operator-provided JSON file, which is a better fit for homelab/docker operation than adding database persistence now.

## Goals / Non-Goals

**Goals:**
- Add a shared package for browser site config schema, validation, file loading, normalization, and merge behavior.
- Let backend load effective browser site config from built-in defaults plus an optional JSON override file.
- Keep the backend API as the only runtime source Desktop and CLI use for browser site config.
- Make config errors explicit at backend startup, with enough detail to fix malformed JSON.
- Provide docs and an example JSON format suitable for Docker volume mounting.

**Non-Goals:**
- Do not build a config editing UI or write-back API in this change.
- Do not store cookies, localStorage, Playwright storage state, or desktop profile directories in config.
- Do not add a database-backed config store yet.
- Do not make Desktop or CLI read browser site JSON files directly.
- Do not implement hot reload unless it is needed to keep startup loading testable.

## Decisions

1. **Use a shared package, not an app**

   `packages/config` will expose typed helpers. It will not run a server or own runtime state. The backend remains the owner that decides which config file to load and which effective sites are exposed through APIs.

   Alternative considered: an `apps/config` service. That would add deployment and network complexity before there is a need for multi-process config coordination.

2. **Use JSON file overrides with built-in defaults**

   The backend will retain default site definitions for built-in sites, then merge JSON sites by `siteId`. A JSON entry with the same `siteId` overrides or extends the default; a new `siteId` adds a new site.

   Alternative considered: database persistence. Current browser site config is low-write, human-readable operational metadata, so a mounted JSON file is easier to inspect, version, and back up.

3. **Validate and normalize before exposing config**

   The shared package will validate required fields, URL origins, unique `siteId` values, valid profile names, supported `authPolicy` values, and resource block lists. It will normalize arrays into deterministic order and return copied values to avoid accidental mutation.

   Alternative considered: ad hoc backend validation. That keeps implementation small initially but invites duplicated config parsing when other modules need structured config.

4. **Fail fast on invalid configured files**

   If an explicit config file path is set and cannot be read or validated, backend startup should fail with a clear config error. If no file path is set, defaults are used.

   Alternative considered: ignore malformed config and continue with defaults. That is friendlier during startup but can hide operator mistakes and lead to surprising auth behavior.

5. **Desktop remains API-only for site config**

   Desktop reads effective site config from backend APIs and uses it to open login/verify flows. It owns local browser profiles, not the site rule file.

   Alternative considered: sharing JSON directly with Desktop. That would make two runtime owners and creates drift between what backend requests and what Desktop displays.

## Risks / Trade-offs

- JSON edits require backend restart in the first version -> document restart behavior and keep future reload endpoint out of scope.
- Merge semantics can surprise users if an override partially changes nested arrays -> define array fields as replacement values for a matching `siteId`.
- Fail-fast startup errors can block backend after a bad edit -> emit structured error details with file path and validation issues.
- Shared package can become over-generalized -> keep exports focused on browser sites for this change, with directory layout that can grow later.

## Migration Plan

1. Add `packages/config` with browser-site config types and helpers.
2. Move built-in browser site defaults into backend code or a backend-owned default module that uses shared config validation.
3. Add backend env support for an optional browser sites JSON file path.
4. Replace backend hardcoded-only site service initialization with effective config loading.
5. Update docs with example JSON and Docker mount guidance.
6. Preserve existing API response shape so Desktop and CLI continue working.
