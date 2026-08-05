## MODIFIED Requirements

### Requirement: Homelab deployment documentation
The docs site SHALL document Kubernetes/GitOps as the official user-facing deployment path for CthuTool server-side services on a homelab machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies Kubernetes or k3s prerequisites, ArgoCD prerequisites, GitOps namespace and Application resources, backend image delivery, Kubernetes service configuration, liveness and readiness health checks, metrics scraping, upgrade flow, and troubleshooting entry points

#### Scenario: Reader reviews GitOps observability behavior
- **WHEN** a reader follows deployment, operations, or reference docs for observability
- **THEN** the documentation identifies the external deployment platform as the owner of cluster observability
- **AND** it documents the retained backend `/metrics` scrape contract, structured stdout/stderr log contract, and optional OTLP trace export without requiring a specific log storage, collector, or trace backend

### Requirement: Architecture documentation with OpenSpec references
The docs site SHALL explain the implementation architecture while preserving OpenSpec specs as the authoritative requirements source.

#### Scenario: Reader reviews system architecture
- **WHEN** a reader opens the architecture overview or topology pages
- **THEN** the documentation explains the Kubernetes backend, external deployment platform ownership (GitOps rollout flow and cluster observability), public browser API, browser client SDK, desktop client, CLI tool, browser runtime, and shared packages at a high level

#### Scenario: Reader reviews runtime placement
- **WHEN** a reader opens runtime placement documentation
- **THEN** the documentation distinguishes external deployment platform desired state, client computer runtimes, third-party browser SDK consumers, and repository development source

#### Scenario: Reader needs normative requirements
- **WHEN** an architecture or module page discusses capability requirements
- **THEN** the page links to the relevant `openspec/specs/<capability>/spec.md` source instead of duplicating the full normative requirements

### Requirement: Observability operations documentation
The docs site SHALL document the operator-facing observability path for the Backend using application-level diagnostics independent of any particular cluster observability platform.

#### Scenario: Operator checks backend health and metrics
- **WHEN** an operator opens observability or health operations docs
- **THEN** the docs distinguish `/health` liveness from `/health/ready` readiness
- **AND** they identify `/metrics` as the Prometheus scrape endpoint rather than a Kubernetes probe

#### Scenario: Operator reviews telemetry flow
- **WHEN** an operator reviews observability docs
- **THEN** the docs describe backend structured stdout/stderr logs, the Prometheus-compatible `/metrics` endpoint, and optional OTLP trace export when an external endpoint is configured
- **AND** the docs do not require a particular log storage, collector, or trace backend

#### Scenario: Operator reviews observability safety
- **WHEN** observability docs describe metrics, logs, or traces
- **THEN** the docs state that sensitive browser state and high-cardinality values must not become metric labels or log labels
