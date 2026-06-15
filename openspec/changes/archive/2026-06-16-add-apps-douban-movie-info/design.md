## Context

CthuTool already has a backend-owned browser content service that resolves site configuration, enforces origin allowlists, dispatches capture commands through an online desktop agent, and returns bounded page snapshots instead of raw browser handles. Douban is already configured as a required-auth browser site, and CthuDesktop already owns the persistent Douban profile and login verification flow.

The new workflow should therefore be a business module layered on top of `BrowserContentService`: it asks for one Douban movie page by subject id, parses the returned page snapshot, and exposes structured data to the desktop renderer. The desktop UI should stay intentionally small: a subject-id input, a fetch action, and a result panel.

## Goals / Non-Goals

**Goals:**

- Fetch Douban movie details by subject id only.
- Keep backend business code dependent on `BrowserContentService`, not Playwright, Chrome, cookies, storage state, or agent WebSocket internals.
- Return a stable structured response for common movie metadata and explicit failure states for access, auth, not-found, and parse problems.
- Add a simple desktop UI that can request and display one lookup result.
- Let non-interactive browser capture work run hidden while preserving visible login windows.

**Non-Goals:**

- Movie-title search, candidate selection, batch lookup, caching, persistence, or collection import.
- Automated captcha solving, rate-limit bypassing, or scraping outside configured Douban origins.
- Exposing raw HTML, screenshots, cookies, localStorage, storage-state files, profile paths, or raw browser handles to the renderer.
- Replacing the existing Douban auth/profile verification flow.

## Decisions

### Use a backend business module over direct renderer scraping

Create `DoubanMovieInfoModule` under `apps/backend/src/modules/douban-movie-info/`. The module owns the HTTP endpoint, subject-id normalization, browser content request, parser, response mapping, and errors.

This keeps the renderer simple and keeps site-specific parsing close to backend services and tests. The alternative, driving browser capture directly from the desktop renderer, would couple UI to browser automation details and make error handling less reusable.

### Fetch by canonical subject URL through `BrowserContentService`

The service accepts only numeric subject ids or URLs whose path contains `/subject/<id>/`, then builds `https://movie.douban.com/subject/<id>/`. It calls `getPageContent` with `siteId: douban`, `includeHtml: true`, `includeText: true`, no screenshot, and resource blocking inherited from site config.

This reuses existing origin allowlisting, required-auth handling, task timeouts, diagnostics, detection states, and agent-backed browser dispatch. The alternative, adding a backend-local Playwright path, would conflict with the current browser provider boundary.

### Parse deterministic page data first, then DOM/text fallbacks

The parser should prefer embedded structured data when present, especially JSON-LD and stable metadata blocks. It can then fall back to DOM/text extraction for fields that Douban exposes in the visible info panel. The parser output should normalize arrays, trim whitespace, keep optional fields absent rather than guessed, and retain the source URL and captured timestamp.

Live inspection with the verified CthuDesktop Douban profile confirmed that `https://movie.douban.com/subject/1292052/` returns the real subject page with HTTP 200 and the following useful anchors:

- `script[type="application/ld+json"]` exposes `name`, `url`, `image`, `director`, `author`, `actor`, `datePublished`, `genre`, `duration`, `description`, and `aggregateRating`.
- `meta[property="og:title"]`, `meta[property="og:image"]`, `meta[property="og:description"]`, `meta[property="video:actor"]`, `meta[property="video:director"]`, and `meta[property="video:duration"]` provide metadata fallbacks.
- `strong[property="v:average"]`, `[property="v:votes"]`, `[property="v:summary"]`, `[property="v:genre"]`, `[property="v:initialReleaseDate"]`, and `[property="v:runtime"]` provide page microdata fallbacks.
- `h1`, `.year`, `#mainpic img`, and `#info` are present for title/year/poster/info-panel fallback extraction.
- `#info` uses mixed markup: early entries such as director, writer, and cast are wrapped as `span.pl` labels inside local `span` containers, while later fields such as genre, country/region, language, release dates, runtime, aliases, and IMDb are easier to recover from normalized `#info` text. The implementation should expose aliases as an array and IMDb as `imdbId` when present, and should not assume every label has an equally clean wrapper.

Tests should use fixture HTML files representing successful, missing-field, and non-movie pages. Live Douban should not be required for parser tests.

The first parser implementation should use this priority:

1. JSON-LD for primary metadata.
2. Microdata and Open Graph/video meta selectors for missing fields.
3. `#info` label/text parsing only for fields not available from structured sources.

### Map browser and parse failures into domain errors

The module should translate browser detections and provider errors into API-friendly statuses:

- invalid subject id
- auth required or expired
- captcha required
- rate limited
- blocked
- not found
- parse failed
- browser unavailable

The desktop UI should show these statuses as readable messages and avoid pretending a partial parse is a full result.

### Make capture hidden, login visible

`PlaywrightHost` already supports headless launches but the desktop main process currently constructs it with headed behavior. Change the host so non-interactive capture and verification contexts can use hidden Chrome, while `browser.openLogin` launches a headed persistent context because the user must interact with the login page.

This gives movie lookup the quieter behavior the user asked for without breaking the required-auth login flow. The trade-off is that some sites can treat headless browsers differently; if Douban rejects hidden capture, the detection path should report the block rather than silently opening a visible window.

### Keep the desktop UI compact

Add a small Douban movie lookup panel to the main desktop workspace. The panel should include a subject-id input, a fetch button, loading and error states, and a structured result area. The result view should be scannable rather than decorative, matching the operational nature of CthuDesktop.

## Risks / Trade-offs

- Douban page markup may change -> keep parsing isolated in a dedicated parser with fixtures and explicit parse-failed behavior.
- Hidden Chrome may trigger different Douban behavior -> surface captcha/rate-limit/blocked detections and preserve manual login as a visible action.
- Required-auth profile may be missing -> reuse existing pending auth task behavior and show a clear UI error rather than opening login automatically.
- Desktop UI may grow beyond the simple lookup scope -> keep search, history, persistence, and import workflows out of this change.

## Migration Plan

This is additive. Backend imports the new module and desktop adds a new panel. Existing browser status, Douban login verification, and browser auth pages continue to work. Rollback removes the new module import, renderer panel, and hidden-capture launch change; no data migration is required.

## Open Questions

None for the first subject-id-only version.
