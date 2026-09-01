# apps-agent-local-bridge Specification

## Purpose
Define the authenticated loopback bridge that lets the deployed Web console safely inspect and control same-user local Agent and browser resources.
## Requirements
### Requirement: Loopback-only JSON bridge
The Agent SHALL expose a versioned JSON bridge only on operating-system loopback using a dynamically selected port and SHALL NOT serve Web application assets.

#### Scenario: Bridge starts
- **WHEN** the active Agent enables the local bridge
- **THEN** it binds an available loopback port and reports endpoint/version only through user-scoped local control

#### Scenario: Non-loopback bind is requested
- **WHEN** configuration requests a wildcard, LAN, or public address
- **THEN** the Agent rejects it and does not expose bridge APIs remotely

#### Scenario: Browser requests UI asset
- **WHEN** a caller requests HTML, JavaScript, CSS, or an application route from the bridge
- **THEN** the bridge returns no deployed UI and exposes only documented bootstrap/JSON endpoints

### Requirement: Origin-bound one-time launch ticket
Tray and CLI SHALL be able to request a high-entropy single-use short-lived ticket scoped to active environment id, exact Web origin, and bridge instance.

#### Scenario: Active environment page exchanges ticket
- **WHEN** the exact active Web Origin presents a valid unused ticket before expiry
- **THEN** the bridge consumes it once and returns a short-lived bearer session token for that Origin/environment/instance

#### Scenario: Ticket is replayed
- **WHEN** a consumed, expired, wrong-Origin, wrong-environment, or old-instance ticket is submitted
- **THEN** the bridge rejects it without exposing local state

#### Scenario: Environment switches
- **WHEN** the active environment changes
- **THEN** all outstanding tickets and bearer sessions for the old environment become invalid

### Requirement: In-memory bearer session
The bridge SHALL authorize sensitive JSON APIs with a short-lived bearer token intended for browser memory only and SHALL NOT require cross-site cookies.

#### Scenario: Authorized request arrives
- **WHEN** a request has exact active Origin, valid session bearer, allowed Host, and supported JSON method/content type
- **THEN** the bridge processes the documented API operation

#### Scenario: Cookie-only request arrives
- **WHEN** a request lacks the valid bearer token even if it carries cookies
- **THEN** the bridge rejects it without changing local state

#### Scenario: Session expires or Agent restarts
- **WHEN** session lifetime ends or the bridge instance changes
- **THEN** subsequent calls require a newly issued tray/CLI ticket

### Requirement: Exact local Web request protections
The bridge SHALL enforce exact active-environment Origin, exact Host/port, restrictive CORS, preflight validation, JSON-only mutations, and no credentialed wildcard access.

#### Scenario: Trusted preflight arrives
- **WHEN** the active Web Origin preflights a supported method and Authorization/content-type headers
- **THEN** the bridge grants only that exact Origin and requested bounded headers with `Vary: Origin`

#### Scenario: Other Web origin calls bridge
- **WHEN** an arbitrary or inactive-environment Origin attempts preflight or RPC
- **THEN** the bridge denies CORS and does not process a mutation

#### Scenario: Simple form request is submitted
- **WHEN** a page submits a cookie-free simple form or text request without the required JSON/bearer contract
- **THEN** the bridge rejects it before mutation

#### Scenario: Unexpected Host is supplied
- **WHEN** Host does not match the bound loopback host and active port
- **THEN** the bridge rejects the request

### Requirement: Local Network Access compatibility
The bridge SHALL support browser-mediated loopback access and provide bounded errors that let the deployed Web route distinguish permission, connectivity, Origin, ticket, and version failures.

#### Scenario: Browser grants loopback access
- **WHEN** the active page makes a supported Fetch request and the user grants required local-network permission
- **THEN** ticket exchange and JSON RPC may proceed

#### Scenario: Browser denies loopback access
- **WHEN** the browser blocks or denies local-network access
- **THEN** no local API executes and the page can present permission remediation without scanning other ports

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

### Requirement: Safe local mutations
The bridge SHALL validate local settings/profile/lifecycle mutations, write configuration atomically, require explicit confirmation for destructive actions, and classify runtime effect.

#### Scenario: Valid setting changes
- **WHEN** an authorized session submits a supported typed mutation
- **THEN** the Agent persists it atomically and returns immediate, reconnect-required, or restart-required effect

#### Scenario: Profile deletion is requested
- **WHEN** deletion is explicitly confirmed for an unlocked active-environment profile
- **THEN** the Agent deletes only that profile and records a sanitized event

#### Scenario: Active environment switch is requested from Web
- **WHEN** the deployed page attempts to change trusted environment selection through the bridge
- **THEN** the bridge rejects it and directs selection to tray or CLI

### Requirement: Controlled local browser operations
The bridge SHALL expose only existing allowlisted browser operations with their time, payload, access-control, and arbitrary-script restrictions.

#### Scenario: Supported browser operation is requested
- **WHEN** an authorized active-environment session sends a valid controlled browser command
- **THEN** the Agent executes it under the browser runtime protocol and returns a bounded correlated result or structured error

#### Scenario: Arbitrary script is requested
- **WHEN** the Web page submits an unsupported evaluation/script payload
- **THEN** the Agent rejects it without execution

### Requirement: Bridge secret redaction
The bridge SHALL exclude launch tickets, bearer tokens, operator sessions,
authorization headers, URL fragments, cookies, and raw browser artifacts from
logs, telemetry, diagnostics, and public errors.

#### Scenario: Sensitive bridge value reaches an event
- **WHEN** request or failure data contains a forbidden value
- **THEN** the Agent removes or redacts it before persistence or output
