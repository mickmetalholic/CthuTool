# apps-agent-native-bootstrap-ui Specification

## Purpose
Provide a native first-run and connection-settings experience for the self-use Agent without bundling a WebView or local Web application.

## Requirements

### Requirement: Native setup executable

The self-use Agent release SHALL include a cross-platform native setup executable for the supported macOS and Windows targets, and the setup executable SHALL use the same-user tray IPC rather than serving or embedding Web application assets.

#### Scenario: Fresh install opens setup

- **WHEN** the tray starts with no valid user deployment configuration
- **THEN** it exposes a `Setup required` state and can open the native setup window without starting the production Agent connection

#### Scenario: Bundle inventory is inspected

- **WHEN** release inventory checks inspect a self-use archive
- **THEN** the native setup executable and its compiled UI resources are present, while WebView frameworks, HTML applications, and deployed Web assets are absent

### Requirement: First-run wizard and persistent settings mode

The native setup window SHALL provide a first-run wizard for an unconfigured Agent and a persistent settings mode for an already configured Agent.

#### Scenario: First-run wizard is shown

- **WHEN** the user opens configuration before a valid deployment Origin exists
- **THEN** the window presents Origin, device name, validation feedback, save, and cancel controls

#### Scenario: User cancels first-run setup

- **WHEN** the user cancels the first-run wizard
- **THEN** the Agent remains installed, does not enter a restart loop, reports `Setup required` in the tray/CLI status, and can reopen the wizard later

#### Scenario: Existing settings are opened

- **WHEN** the user selects Agent Settings from the tray after configuration
- **THEN** the window shows the current connection state, Origin, device name, connection toggle, last verification result, and actions to save or open the Web console

### Requirement: Single-Origin configuration form

The native UI SHALL accept one exact deployment Origin and SHALL display the derived Web and Backend endpoints as read-only values.

#### Scenario: Valid production Origin is entered

- **WHEN** the user enters an HTTPS Origin without a path, query, or fragment
- **THEN** the UI derives `/agent`, the same-origin Backend HTTP base, and `wss://<host>/ws/agents`

#### Scenario: Invalid Origin is entered

- **WHEN** the user enters a non-Origin URL, a production HTTP URL, or an Origin with a path/query/fragment
- **THEN** the UI shows an inline validation error and does not write or apply the candidate configuration

#### Scenario: Private-network authorization is used

- **WHEN** the Agent connects to the derived Backend WebSocket
- **THEN** no static Agent Secret input or status is shown because access is authorized by the deployment's private-network boundary

### Requirement: Verified and recoverable configuration apply

The native UI SHALL validate candidate configuration before replacing an existing working configuration, and SHALL classify the resulting runtime effect.

#### Scenario: First configuration verifies

- **WHEN** a valid first-run Origin passes schema validation and the Agent establishes the Backend connection
- **THEN** the UI commits the configuration atomically, starts the Agent, shows a connected result, and offers to open the Web console

#### Scenario: Existing configuration is changed successfully

- **WHEN** a configured user saves a valid Origin and Backend verification succeeds
- **THEN** the Agent applies the new configuration, invalidates old local bridge sessions, reconnects or restarts within a bounded time, and preserves profiles and logs

#### Scenario: Candidate configuration fails

- **WHEN** validation, Backend health, WebSocket authentication, or Agent restart fails for a candidate configuration
- **THEN** the previous working configuration remains active and the UI shows a bounded remediation error

### Requirement: Protected setup IPC and persistence

The setup executable SHALL communicate with the same-user tray through authenticated local IPC, SHALL write configuration atomically through the tray-owned persistence boundary, and SHALL keep sensitive runtime data out of command-line arguments, logs, telemetry, and public status.

#### Scenario: Authorized setup request arrives

- **WHEN** a setup process presents the current tray instance identity and a typed configuration request
- **THEN** the tray validates the request, applies only supported fields, and returns a redacted result

#### Scenario: Unauthorized setup request arrives

- **WHEN** a process presents an invalid or stale tray identity
- **THEN** the tray rejects the request without reading or changing configuration

#### Scenario: Agent is updated

- **WHEN** a newer immutable Agent version is activated
- **THEN** deployment Origin, Agent identity, profiles, logs, browser settings, and ignored legacy Secret files remain in user-scoped storage outside the version directory

### Requirement: Native/Web settings boundary

The native UI SHALL own deployment connection configuration, while the deployed Web `/agent` route SHALL remain the owner of complex browser/profile operations.

#### Scenario: Native setup succeeds

- **WHEN** the native UI finishes a successful configuration
- **THEN** it can request a fresh one-time bridge launch and open the deployed Web `/agent` route

#### Scenario: Web page attempts to change trust configuration

- **WHEN** the deployed Web page submits an Origin or derived trust-boundary mutation through the local bridge
- **THEN** the Agent rejects the mutation and directs the user to the native Agent Settings window
