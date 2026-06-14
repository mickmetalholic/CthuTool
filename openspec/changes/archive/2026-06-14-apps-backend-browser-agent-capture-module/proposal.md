## Why

`BrowserAutomationModule` has already shed site config, agent state, and browser auth ownership, but it still owns the agent-backed browser capture provider and protocol mapping details. Extracting that provider creates a clearer boundary between browser content orchestration and desktop-agent command execution, making the remaining browser automation module easier to reason about and test.

## What Changes

- Add a backend `BrowserAgentCaptureModule` that owns the agent-backed browser capture provider, browser command payload mapping, agent response mapping, browser-agent error mapping, and pending-auth updates caused by agent command failures.
- Move `AgentBrowserCaptureProvider` and its provider token registration out of `BrowserAutomationModule`.
- Keep `BrowserContentService` in `BrowserAutomationModule` as the use-case orchestrator for site resolution, origin allowlisting, task execution controls, block detection, diagnostics, and auth usage summaries.
- Keep the `/api/browser/*` routes and response shapes unchanged.
- Do not change the desktop agent protocol, command gateway contract, browser auth storage, sites config, diagnostics format, or backend-local Playwright support policy.

## Capabilities

### New Capabilities

- `apps-backend-browser-agent-capture`: Backend module boundary for executing browser capture requests through browser-capable desktop agents.

### Modified Capabilities

- `apps-backend-browser-automation`: Browser automation consumes browser capture through `BrowserAgentCaptureModule` instead of owning the agent-backed provider directly.

## Impact

- Affected code: `apps/backend/src/modules/browser-automation/*`, a new `apps/backend/src/modules/browser-agent-capture` module, and focused backend tests.
- Affected specs: new `apps-backend-browser-agent-capture` capability and a narrow browser automation requirement update.
- Runtime compatibility: no public API route changes and no desktop agent protocol changes.
- Module compatibility: `BrowserAutomationModule` should continue exporting `BrowserContentService` while importing the new capture module.
