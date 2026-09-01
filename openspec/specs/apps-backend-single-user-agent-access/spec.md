# apps-backend-single-user-agent-access Specification

## Purpose
Define the single-operator authorization and environment-scoped Agent authentication boundary for public machine-control backend endpoints.
## Requirements
### Requirement: Public machine-control operator boundary
A Backend SHALL protect Agent status and machine-control APIs with a fixed
private-network socket-peer boundary. Requests are authorized only when the
direct peer address is loopback or a private-network address; the Backend
MUST NOT rely on forwarded client IP headers or configurable operator identity
headers.

#### Scenario: Private-network operator calls command API
- **WHEN** a request for Agent status or machine control arrives from a
  loopback, RFC1918 IPv4, IPv6 unique-local, or IPv6 link-local socket peer
- **THEN** the Backend may process the request for its configured environment

#### Scenario: Public caller reaches Backend directly
- **WHEN** a request for Agent status or machine control arrives from a public
  socket peer
- **THEN** the Backend rejects it before registry lookup or command dispatch

#### Scenario: Caller spoofs forwarded address or gateway identity
- **WHEN** a request carries `X-Forwarded-For` or an operator identity header
  without a private socket peer
- **THEN** the Backend rejects the request and does not treat either header as
  authentication

#### Scenario: External Web request uses the supported entry path
- **WHEN** an external operator reaches the Web or Backend through an
  authenticated Cloudflare Access/Tunnel path
- **THEN** the external access layer authenticates the operator and the
  Backend authorizes only the resulting private-network socket peer

### Requirement: Environment-scoped Agent network authentication
The Agent WebSocket endpoint SHALL require the configured environment id and a
private-network socket peer before accepting Agent registration. It MUST NOT
require or parse a static Agent secret.

#### Scenario: Agent connects from the private network
- **WHEN** the Agent opens WSS from a private-network peer with the matching
  environment id
- **THEN** the Backend authenticates the network boundary and environment
  before accepting `agent.hello`

#### Scenario: Agent connects from a public peer
- **WHEN** an Agent WebSocket connection arrives from a public socket peer
- **THEN** the Backend closes the connection without registering the Agent

#### Scenario: Agent uses another environment id
- **WHEN** a private-network Agent presents an environment id different from
  the Backend configuration
- **THEN** the Backend rejects the connection without registering the Agent
