# apps-backend-douban-movie-info Specification

## Purpose
Define the backend API and parsing contract for retrieving Douban movie information by subject id through the controlled browser content pipeline.

## Requirements
### Requirement: Douban movie info API
The backend SHALL provide a Douban movie info API that retrieves one movie by Douban subject id.

#### Scenario: Subject id lookup succeeds
- **WHEN** a client requests Douban movie info for subject id `1292052`
- **THEN** the backend fetches `https://movie.douban.com/subject/1292052/` through the internal browser content service and returns structured movie information

#### Scenario: Subject URL is normalized
- **WHEN** a client provides `https://movie.douban.com/subject/1292052/`
- **THEN** the backend normalizes the input to subject id `1292052` and uses the canonical subject URL for retrieval

#### Scenario: Invalid subject id is rejected
- **WHEN** a client provides a subject id or URL that cannot resolve to a numeric Douban subject id
- **THEN** the backend rejects the request with an invalid subject id error before dispatching browser work

### Requirement: Controlled browser retrieval
The Douban movie info module SHALL retrieve Douban pages only through `BrowserContentService`.

#### Scenario: Browser content service is used
- **WHEN** the movie info service needs page content for a subject id
- **THEN** it calls the browser content service with `siteId` `douban`, HTML and text capture enabled, screenshot capture disabled, and the canonical subject URL

#### Scenario: Raw browser state is not exposed
- **WHEN** the movie info module fetches or returns movie data
- **THEN** it does not access or expose raw Playwright pages, browser contexts, cookies, localStorage values, storage-state contents, profile directories, WebSocket connections, or command correlation maps

#### Scenario: Origin allowlist is preserved
- **WHEN** the canonical Douban subject URL is fetched
- **THEN** existing browser content service site resolution and allowed-origin enforcement are used without adding a movie-module bypass

### Requirement: Movie metadata extraction
The backend SHALL parse supported Douban movie detail pages into a stable structured response.

#### Scenario: Full movie metadata is extracted
- **WHEN** the captured page contains standard Douban movie detail metadata
- **THEN** the response includes subject id, source URL, title, original title when available, year, rating when available, rating count when available, directors, writers, casts, genres, countries, languages, release dates, runtime, aliases when available, IMDb id when available, summary, poster URL when available, final URL, and captured timestamp

#### Scenario: Structured sources are preferred
- **WHEN** JSON-LD, Open Graph/video metadata, microdata properties, and `#info` text contain overlapping movie fields
- **THEN** the parser prefers JSON-LD first, then Open Graph/video metadata and microdata properties, then `#info` fallback parsing for fields still missing

#### Scenario: Verified Douban anchors are supported
- **WHEN** a Douban movie page contains `script[type="application/ld+json"]`, `meta[property]` movie tags, `strong[property="v:average"]`, `[property="v:votes"]`, `[property="v:summary"]`, `[property="v:genre"]`, `[property="v:initialReleaseDate"]`, `[property="v:runtime"]`, `h1`, `.year`, `#mainpic img`, and `#info`
- **THEN** the parser uses those anchors as supported sources for normalized movie metadata

#### Scenario: Info panel fallback handles mixed markup
- **WHEN** `#info` contains a mix of clean `span.pl` label wrappers and later label/value text that does not share the same wrapper shape
- **THEN** the parser can recover supported fallback fields without requiring every label to have an identical DOM structure

#### Scenario: Aliases and IMDb are extracted from info panel
- **WHEN** `#info` contains `又名` and `IMDb` label values
- **THEN** the parser returns `aliases` as a normalized array and `imdbId` as a normalized string

#### Scenario: Optional fields may be absent
- **WHEN** a valid movie page omits optional metadata such as rating, original title, poster, or writers
- **THEN** the backend returns the available fields without inventing missing values

#### Scenario: Non-movie page is rejected
- **WHEN** the captured page does not match a supported Douban movie detail page shape
- **THEN** the backend returns a parse failed or unsupported page error instead of a partial movie result

### Requirement: Douban access failure mapping
The backend SHALL map browser and page access failures into explicit Douban movie info errors.

#### Scenario: Auth is required
- **WHEN** browser retrieval reports missing, expired, or login-required Douban auth
- **THEN** the movie info API returns an auth-required error that the desktop UI can display

#### Scenario: Captcha is required
- **WHEN** browser retrieval reports captcha or abnormal access verification
- **THEN** the movie info API returns a captcha-required error and does not retry indefinitely

#### Scenario: Rate limited or blocked
- **WHEN** browser retrieval reports rate limiting or blocked access
- **THEN** the movie info API returns the matching blocked state without attempting to bypass Douban controls

#### Scenario: Subject is not found
- **WHEN** the browser snapshot indicates a missing subject page or HTTP not-found response
- **THEN** the movie info API returns a not-found error for that subject id

### Requirement: Testable parser behavior
The Douban movie parser SHALL be testable without contacting live Douban.

#### Scenario: Fixture parsing succeeds
- **WHEN** parser tests use fixture HTML for a representative Douban movie page
- **THEN** the parser returns the expected normalized movie info fields

#### Scenario: Fixture preserves verified anchors
- **WHEN** parser tests cover the representative successful page
- **THEN** the fixture includes reduced examples of the verified JSON-LD, Open Graph/video meta tags, microdata properties, title/year/poster nodes, and mixed-shape `#info` content

#### Scenario: Fixture parsing fails predictably
- **WHEN** parser tests use fixture HTML for a non-movie or unsupported page
- **THEN** the parser returns a parse failure rather than throwing an unstructured error

### Requirement: Douban movie observability
The Douban movie info API SHALL correlate subject lookup requests, browser retrieval outcomes, parser outcomes, and mapped domain errors with backend request context.

#### Scenario: Domain error includes observable code
- **WHEN** a Douban movie lookup fails due to auth, captcha, rate limiting, timeout, blocked access, not found, or parse failure
- **THEN** backend observability records the stable domain error code, subject id when valid, browser detection kind when available, and request identifier

#### Scenario: Successful lookup is observable
- **WHEN** a Douban movie lookup succeeds
- **THEN** backend observability records the subject id, final URL origin, duration, and parser success without logging raw page HTML

