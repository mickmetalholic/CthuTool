## Why

Douban movie lookups currently require manual browser navigation and copy-paste even though CthuTool already has a controlled browser content pipeline and Douban profile support. Adding a small movie-info workflow lets the desktop app fetch structured movie details by subject id while preserving the existing browser automation boundaries.

## What Changes

- Add a backend Douban movie info module that accepts a Douban subject id, fetches the corresponding `movie.douban.com/subject/<id>/` page through `BrowserContentService`, and returns structured movie metadata.
- Parse movie detail pages into fields such as title, original title, year, rating, rating count, directors, writers, casts, genres, countries, languages, release dates, runtime, aliases, IMDb id, summary, and poster URL.
- Surface access and parse failures as explicit states, including missing or expired auth, captcha, rate limit, blocked access, not found, invalid subject id, and unsupported page shape.
- Add a simple desktop UI with one subject-id input, a fetch button, loading/error states, and a result area below the form.
- Change desktop browser host behavior so normal capture/verification work can run hidden, while interactive login windows remain visible.
- Keep raw cookies, localStorage, storage-state contents, profile paths, and raw browser handles out of backend business modules and renderer UI.

## Capabilities

### New Capabilities

- `apps-backend-douban-movie-info`: Defines backend retrieval, parsing, API response, and failure behavior for Douban movie details by subject id.
- `apps-desktop-douban-movie-info`: Defines the desktop renderer workflow for entering a subject id, requesting movie info, and presenting the result.

### Modified Capabilities

- `apps-desktop-browser-host`: Refines browser launch visibility so non-interactive capture work can run hidden while `browser.openLogin` stays visible for manual login.

## Impact

- `apps/backend/src/modules/douban-movie-info/` gains a Nest module, service, controller, parser, types, and tests.
- `apps/backend/src/app.module.ts` imports the new backend module.
- `apps/desktop/src/renderer/src/App.tsx`, renderer API helpers, styles, and renderer tests gain the simple Douban movie lookup panel.
- `apps/desktop/src/main/playwright-host.ts`, `apps/desktop/src/main/index.ts`, and related unit tests update browser visibility behavior.
- Existing browser automation, agent command gateway, sites config, and Douban auth profile flows are reused rather than expanded to expose raw browser state.
