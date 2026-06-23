## ADDED Requirements

### Requirement: Agent console observable state
The desktop agent console SHALL display agent and browser capability status using observable state summaries that can be correlated with backend and local diagnostics.

#### Scenario: Agent status includes freshness
- **WHEN** the agent console displays the local agent connection
- **THEN** it includes connection status, last registration or heartbeat freshness, backend URL context, and last safe error summary when available

#### Scenario: Browser capability status is visible
- **WHEN** browser capability is unavailable or degraded
- **THEN** the agent console displays a safe runtime diagnostic summary and does not expose local profile internals
