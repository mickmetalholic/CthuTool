## MODIFIED Requirements

### Requirement: Sanitized local diagnostics
The runtime SHALL emit structured lifecycle and browser diagnostics without
backend authorization material, instance nonces, local bridge tickets, raw
profile data, or unbounded command payloads.

#### Scenario: Runtime event is recorded
- **WHEN** startup, connection, browser command, shutdown, or failure state
  changes
- **THEN** the event includes bounded correlation and state fields suitable
  for local-bridge and CLI diagnostics

#### Scenario: Sensitive value reaches diagnostics
- **WHEN** a diagnostic input contains an authorization header, operator
  session, instance nonce, local bridge ticket/token, cookie, or raw browser
  artifact
- **THEN** the runtime removes or redacts the sensitive value before
  persistence or output
