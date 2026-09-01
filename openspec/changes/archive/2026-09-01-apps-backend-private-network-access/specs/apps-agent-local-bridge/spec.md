## MODIFIED Requirements

### Requirement: Sanitized local resources
The bridge SHALL expose active environment/backend state, versions, Chrome
facts, public environment-scoped profile state, autostart adapter state, and
bounded diagnostics without authorization material, cookies, raw profiles, or
command payloads.

#### Scenario: Local status is requested
- **WHEN** an authorized session reads status
- **THEN** it receives environment, process, backend, browser, version, and
  adapter facts without Agent/operator authorization material, cookies, raw
  profiles, or command payloads

### Requirement: Bridge secret redaction
The bridge SHALL exclude launch tickets, bearer tokens, operator sessions,
authorization headers, URL fragments, cookies, and raw browser artifacts from
logs, telemetry, diagnostics, and public errors.

#### Scenario: Sensitive bridge value reaches an event
- **WHEN** request or failure data contains a forbidden value
- **THEN** the Agent removes or redacts it before persistence or output
