## ADDED Requirements

### Requirement: Browser host command observability
The desktop browser host SHALL emit command lifecycle diagnostics for supported browser commands while preserving the existing controlled-command and access-control behavior.

#### Scenario: Command failure is observable
- **WHEN** a browser command fails because the host is not ready, the command is invalid, or runtime execution fails
- **THEN** the browser host returns the existing structured error and records a diagnostic event with command id, command type, reason code, and safe context

#### Scenario: Access detection is observable
- **WHEN** browser execution detects login-required, captcha, rate-limited, or blocked content
- **THEN** the browser host records the detection kind and safe site/profile context without attempting to bypass the access control
