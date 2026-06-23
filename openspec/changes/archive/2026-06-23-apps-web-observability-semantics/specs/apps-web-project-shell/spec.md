## ADDED Requirements

### Requirement: Web shell diagnostics baseline
The browser-hosted management console SHALL include a safe diagnostics baseline for API correlation, user action labels, development console events, and user-visible error states.

#### Scenario: Console logs are standardized
- **WHEN** frontend code needs to log diagnostic information during development
- **THEN** it uses the web observability logger contract instead of direct ad hoc console calls

#### Scenario: Sensitive values are redacted
- **WHEN** diagnostics include request, route, form, or user-action context
- **THEN** the web shell excludes tokens, cookies, raw HTML, screenshots, and personal input values from console output
