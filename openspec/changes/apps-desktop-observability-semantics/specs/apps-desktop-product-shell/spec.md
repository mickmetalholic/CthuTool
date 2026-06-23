## ADDED Requirements

### Requirement: Desktop diagnostics presentation
The desktop product shell SHALL present structured local diagnostics and log status through Settings surfaces without requiring users to inspect raw log files.

#### Scenario: Settings shows diagnostic summary
- **WHEN** the user opens the diagnostics section in Settings
- **THEN** the shell shows connection state, backend URL, agent id, browser runtime diagnostic, last relevant error, and freshness timestamps using safe summarized fields

#### Scenario: Logs surface avoids sensitive details
- **WHEN** the shell exposes logs or a logs placeholder
- **THEN** it does not display raw cookies, storage state, browser profile paths, raw HTML, or screenshots
