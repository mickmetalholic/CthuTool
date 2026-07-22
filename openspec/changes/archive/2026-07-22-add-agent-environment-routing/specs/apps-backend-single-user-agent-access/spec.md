## ADDED Requirements

### Requirement: Public machine-control operator boundary
A publicly reachable backend SHALL reject anonymous Agent status and machine-control API requests and SHALL require a configured single-operator access boundary.

#### Scenario: Authenticated operator calls command API
- **WHEN** a request carries a valid repository-owned operator session or trusted access-gateway identity
- **THEN** the backend may process the command for its trusted environment context

#### Scenario: Anonymous caller reaches public backend
- **WHEN** an unauthenticated request calls Agent status or a machine-control API
- **THEN** the backend rejects it before registry lookup or command dispatch

#### Scenario: Trusted proxy mode is used
- **WHEN** deployment delegates operator authentication to an access gateway
- **THEN** the backend accepts identity only from a verified proxy path that strips client-supplied identity headers

#### Scenario: Existing Web authentication is available
- **WHEN** the deployed Web application already establishes an authenticated operator session
- **THEN** machine-control APIs reuse that validated session without requiring a second product login

### Requirement: Environment-scoped static Agent authentication
Each publicly reachable Agent WebSocket endpoint SHALL require a static environment-scoped Agent secret before registration.

#### Scenario: Agent secret is valid
- **WHEN** the Agent connects over WSS with the configured environment id and valid static Agent secret
- **THEN** the backend authenticates the environment before accepting `agent.hello`

#### Scenario: Agent secret is absent or invalid
- **WHEN** a public Agent connection omits or fails static-secret verification
- **THEN** the backend closes the connection without registering or revealing expected secret data

#### Scenario: Private development exception is enabled
- **WHEN** an explicit loopback/private development mode disables static-secret authentication
- **THEN** readiness and diagnostics mark the backend non-production and the exception cannot activate under production configuration

### Requirement: Operator and Agent secret separation
The backend SHALL keep operator authentication material separate from the Agent WebSocket secret.

#### Scenario: Agent secret is compromised
- **WHEN** a caller knows only the Agent secret
- **THEN** it cannot establish an operator Web session or call protected machine-control HTTP APIs

#### Scenario: Operator session is compromised
- **WHEN** a caller has only an operator Web session
- **THEN** it cannot register a replacement Agent WebSocket without the separate Agent secret

### Requirement: Minimal static-secret lifecycle
The system SHALL support manual configuration and replacement of the per-environment Agent secret and operator access configuration without implementing enrollment, device ownership, automated rotation, or revocation workflows.

#### Scenario: Agent secret is replaced
- **WHEN** the operator updates the backend secret and matching user-restricted local environment value
- **THEN** old Agent connections fail subsequent authentication and the new value is used after reconnect

#### Scenario: Secret reaches diagnostics
- **WHEN** authentication or configuration errors are logged or returned
- **THEN** static secrets, operator passwords, cookies, and authorization headers are omitted or redacted
