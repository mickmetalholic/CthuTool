## ADDED Requirements

### Requirement: Desktop-owned browser sessions
CthuDesktop SHALL own Playwright browser session state for backend-created
public browser sessions.

#### Scenario: Desktop creates browser session
- **WHEN** CthuDesktop receives a valid browser session creation command
- **THEN** it creates a Playwright context and page for the requested site and
  profile policy, stores them under the session ID, and returns public session
  metadata

#### Scenario: Desktop rejects duplicate session
- **WHEN** CthuDesktop receives a session creation command for a session ID that
  is already active locally
- **THEN** it rejects the command with a structured duplicate-session error

#### Scenario: Desktop closes browser session
- **WHEN** CthuDesktop receives a close command for an active browser session
- **THEN** it closes the Playwright page and context and removes local session
  state

### Requirement: Controlled browser action runner
CthuDesktop SHALL execute only supported structured browser actions for public
browser sessions and SHALL NOT evaluate arbitrary Playwright scripts.

#### Scenario: Supported actions execute in order
- **WHEN** CthuDesktop receives a supported action list for an active session
- **THEN** it executes the actions against that session's page in order and
  returns ordered action results

#### Scenario: Unsupported action is rejected
- **WHEN** CthuDesktop receives an unsupported browser action type
- **THEN** it rejects the command without executing subsequent actions

#### Scenario: Arbitrary script payload is rejected
- **WHEN** a browser action payload attempts to provide executable script text or
  raw Playwright commands
- **THEN** CthuDesktop rejects the command without evaluating that script

### Requirement: Desktop browser session limits
CthuDesktop SHALL enforce local session limits for browser sessions created
through the backend public browser API.

#### Scenario: Session timeout is enforced
- **WHEN** an action command exceeds the session or command timeout
- **THEN** CthuDesktop stops the operation and returns a structured timeout
  error

#### Scenario: Session TTL cleanup
- **WHEN** a local browser session exceeds its expiry time or idle timeout
- **THEN** CthuDesktop closes the Playwright page and context and removes local
  session state

#### Scenario: Sensitive session data remains local
- **WHEN** CthuDesktop returns session metadata or action results
- **THEN** it does not include cookies, localStorage values, Playwright
  storage-state contents, desktop profile paths, or raw Playwright object
  handles
