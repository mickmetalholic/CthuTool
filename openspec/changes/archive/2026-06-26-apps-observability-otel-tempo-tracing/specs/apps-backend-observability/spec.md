## MODIFIED Requirements

### Requirement: Backend metrics and traces
The backend SHALL define stable metric and trace names for request latency, browser task queue behavior, command dispatch outcomes, blocked detections, and readiness status, and SHALL export OpenTelemetry traces when an OTLP endpoint is configured.

#### Scenario: Browser task metrics are recorded
- **WHEN** a browser content task is queued, started, completed, timed out, or failed
- **THEN** backend observability records queue length, active count, duration, outcome, and detection kind when available using bounded label values

#### Scenario: Agent command metrics are recorded
- **WHEN** the backend dispatches a command to a desktop agent
- **THEN** backend observability records command type, timeout, completion, failure, and selected agent status without exposing raw WebSocket payloads

#### Scenario: Backend traces are exported
- **WHEN** the backend starts with OTLP trace export configured
- **THEN** it initializes OpenTelemetry before creating the Nest application
- **AND** it exports spans with service name `cthutool-backend` to the configured OTLP endpoint
- **AND** tracing can be disabled by `OTEL_SDK_DISABLED=true`

#### Scenario: Backend tracing is local-safe by default
- **WHEN** the backend starts without an OTLP endpoint
- **THEN** it does not start the OpenTelemetry SDK
- **AND** existing request logs, metrics, and health endpoints continue to work
