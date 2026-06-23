## ADDED Requirements

### Requirement: Douban movie observability
The Douban movie info API SHALL correlate subject lookup requests, browser retrieval outcomes, parser outcomes, and mapped domain errors with backend request context.

#### Scenario: Domain error includes observable code
- **WHEN** a Douban movie lookup fails due to auth, captcha, rate limiting, timeout, blocked access, not found, or parse failure
- **THEN** backend observability records the stable domain error code, subject id when valid, browser detection kind when available, and request identifier

#### Scenario: Successful lookup is observable
- **WHEN** a Douban movie lookup succeeds
- **THEN** backend observability records the subject id, final URL origin, duration, and parser success without logging raw page HTML
