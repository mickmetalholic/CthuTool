## 1. Backend Movie Info Module

- [x] 1.1 Create `apps/backend/src/modules/douban-movie-info` with module, controller, service, parser, types, and error helpers.
- [x] 1.2 Add subject id normalization for numeric ids and `movie.douban.com/subject/<id>/` URLs, rejecting invalid inputs before browser dispatch.
- [x] 1.3 Implement `GET /api/douban/movies/:subjectId` or equivalent route that calls the service and returns a stable response envelope.
- [x] 1.4 Wire `DoubanMovieInfoModule` into the backend app module without changing existing browser automation routes.

## 2. Browser Retrieval and Error Mapping

- [x] 2.1 Call `BrowserContentService.getPageContent` with `siteId: douban`, canonical subject URL, HTML/text capture enabled, and screenshot capture disabled.
- [x] 2.2 Map browser auth, captcha, rate-limit, blocked, not-found, agent-unavailable, and timeout failures into explicit Douban movie info errors.
- [x] 2.3 Ensure the module does not access or expose raw Playwright pages, browser contexts, cookies, storage-state contents, localStorage, profile paths, or agent WebSocket internals.

## 3. Parser Implementation

- [x] 3.1 Implement parser extraction for title, original title, year, rating, rating count, directors, writers, casts, genres, countries, languages, release dates, runtime, aliases, IMDb id, summary, and poster URL.
- [x] 3.2 Parse `script[type="application/ld+json"]` first for `name`, `url`, `image`, `director`, `author`, `actor`, `datePublished`, `genre`, `duration`, `description`, and `aggregateRating`.
- [x] 3.3 Add selector fallbacks for `meta[property="og:title"]`, `meta[property="og:image"]`, `meta[property="og:description"]`, `meta[property="video:actor"]`, `meta[property="video:director"]`, `meta[property="video:duration"]`, `strong[property="v:average"]`, `[property="v:votes"]`, `[property="v:summary"]`, `[property="v:genre"]`, `[property="v:initialReleaseDate"]`, `[property="v:runtime"]`, `h1`, `.year`, and `#mainpic img`.
- [x] 3.4 Add `#info` fallback parsing for labels including director, writer, cast, genre, country/region, language, release dates, runtime, aliases, and IMDb without assuming each label has the same wrapper shape.
- [x] 3.5 Normalize `aliases` as an array and IMDb as `imdbId` when present.
- [x] 3.6 Normalize whitespace, arrays, numeric fields, ISO-8601 duration where possible, source URL, final URL, subject id, and captured timestamp in the parser/service output.
- [x] 3.7 Return a structured parse failure for unsupported or non-movie page shapes.

## 4. Backend Tests

- [x] 4.1 Add a minimal representative parser fixture that preserves the verified Douban anchors: JSON-LD, Open Graph/video meta tags, microdata properties, `h1`, `.year`, `#mainpic img`, and mixed-shape `#info` content.
- [x] 4.2 Add parser fixture tests for JSON-LD-first extraction and selector fallback extraction.
- [x] 4.3 Add parser fixture tests for `#info` fallback parsing, including aliases and IMDb id extraction.
- [x] 4.4 Add parser fixture tests for missing optional fields and unsupported page shapes.
- [x] 4.5 Add service/controller tests for subject id normalization, browser request shape, success response, and error mapping.
- [x] 4.6 Run focused backend tests for the new module and any touched browser content contracts.

## 5. Desktop Browser Visibility

- [x] 5.1 Update `PlaywrightHost` so `browser.capturePage` runs hidden/headless for required-auth and anonymous contexts.
- [x] 5.2 Update `PlaywrightHost` so non-interactive `browser.verifyProfile` runs hidden/headless.
- [x] 5.3 Preserve headed Chrome behavior for `browser.openLogin` so manual login remains possible.
- [x] 5.4 Add or update desktop unit tests covering hidden capture, hidden verification, and visible login windows.

## 6. Desktop Movie Lookup UI

- [x] 6.1 Add a renderer API helper for requesting Douban movie info from the configured backend.
- [x] 6.2 Add a compact Douban movie lookup panel with subject-id input, fetch button, loading state, validation state, error state, and result area.
- [x] 6.3 Display successful movie results below the form with the key metadata fields from the backend response.
- [x] 6.4 Ensure lookup errors preserve user input and do not display raw HTML, screenshots, cookies, storage-state contents, or browser command payloads.
- [x] 6.5 Add renderer tests for successful lookup, invalid input, loading state, backend error display, and result replacement after a second lookup.

## 7. Verification

- [x] 7.1 Run `openspec validate add-apps-douban-movie-info --type change --strict`.
- [x] 7.2 Run focused backend tests for Douban movie info.
- [x] 7.3 Run focused desktop main-process tests for browser visibility behavior.
- [x] 7.4 Run focused desktop renderer tests for the movie lookup panel.
- [x] 7.5 Review `git diff --check` and confirm the change only touches the intended OpenSpec and implementation files.
