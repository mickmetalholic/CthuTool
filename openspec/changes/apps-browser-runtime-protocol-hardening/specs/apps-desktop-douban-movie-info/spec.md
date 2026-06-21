## MODIFIED Requirements

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
