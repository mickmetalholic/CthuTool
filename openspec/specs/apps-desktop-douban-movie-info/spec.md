# apps-desktop-douban-movie-info Specification

## Purpose
Define the CthuDesktop user interface contract for looking up Douban movie information by subject id or subject URL.
## Requirements
### Requirement: Desktop Douban movie lookup panel
CthuDesktop SHALL provide a simple Douban movie lookup panel for fetching movie information by subject id.

#### Scenario: Lookup panel is available
- **WHEN** the desktop main workspace renders business capabilities
- **THEN** it includes a Douban movie lookup panel with a subject-id input and a fetch action

#### Scenario: Subject id can be submitted
- **WHEN** the user enters a Douban subject id and activates the fetch action
- **THEN** the desktop renderer requests movie info from the configured backend for that subject id

#### Scenario: Subject URL can be submitted
- **WHEN** the user enters a Douban movie subject URL and activates the fetch action
- **THEN** the desktop renderer submits the input to the backend lookup API without trying to parse the page locally

### Requirement: Desktop movie result display
CthuDesktop SHALL display Douban movie lookup results below the lookup form.

#### Scenario: Movie result is shown
- **WHEN** the backend returns movie information successfully
- **THEN** the desktop UI displays the movie title, year, rating when available, directors, casts, genres, countries, runtime, release dates, aliases when available, IMDb id when available, summary, and source URL below the form

#### Scenario: Missing optional values are handled
- **WHEN** the backend result omits optional movie fields
- **THEN** the desktop UI omits or marks only those fields unavailable without breaking the rest of the result display

#### Scenario: New lookup replaces prior result
- **WHEN** a user runs a second successful lookup
- **THEN** the desktop UI replaces the previous result with the latest movie information

### Requirement: Desktop lookup states
CthuDesktop SHALL provide clear loading, error, and browser interaction challenge states for Douban movie lookup.

#### Scenario: Loading state is shown
- **WHEN** a movie lookup request is in progress
- **THEN** the desktop UI disables duplicate fetch actions for that request and shows that retrieval is in progress

#### Scenario: Invalid input is shown
- **WHEN** the user submits an empty or invalid subject id input
- **THEN** the desktop UI shows an input error without sending a backend request

#### Scenario: Backend failure is shown
- **WHEN** the backend returns captcha-required, rate-limited, blocked, not-found, browser-unavailable, or parse-failed status
- **THEN** the desktop UI shows a readable error message below the form and preserves the input for correction or retry

#### Scenario: Browser challenge is shown
- **WHEN** the backend returns an operation-scoped browser runtime challenge for missing login, expired login, or verification required
- **THEN** the desktop UI shows the challenge below the form and offers the relevant browser runtime action without reading task-center pending auth state

#### Scenario: Raw browser data is not displayed
- **WHEN** the desktop UI renders lookup status or results
- **THEN** it does not display cookies, localStorage values, storage-state contents, profile paths, raw HTML, screenshots, or browser command payloads
