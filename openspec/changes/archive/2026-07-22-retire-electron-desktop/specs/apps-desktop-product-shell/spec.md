## REMOVED Requirements

### Requirement: CthuDesktop app identity
**Reason**: CthuDesktop is replaced by the CthuAgent installed component.
**Migration**: Use CthuAgent identity in tray, CLI, release metadata, and documentation.

### Requirement: Custom desktop window shell
**Reason**: The installed agent has no application window.
**Migration**: Use the native tray to open the selected environment's deployed Web application in the system browser; no custom title bar or window controls are retained.

### Requirement: Business-first main workspace
**Reason**: Business navigation does not belong to the local tray agent.
**Migration**: Keep business workspaces in the web application.

### Requirement: Settings workspace
**Reason**: The Electron settings workspace is removed.
**Migration**: Open `apps-web-agent-console` from the tray or `chc agent settings`; local machine actions use `apps-agent-local-bridge`.

### Requirement: Dracula theme foundation
**Reason**: Desktop shell theme behavior is not part of the minimal local agent surface.
**Migration**: The deployed Web application owns its theme and does not preserve Electron appearance preferences as a local Agent requirement.

### Requirement: Environment profiles
**Reason**: Packaged Electron environment selection is removed.
**Migration**: Select release-catalog environments through the tray or `chc agent env`, persist one active environment, and isolate Agent secrets/data by environment.

### Requirement: Runtime status surfaces
**Reason**: Desktop title/status/settings surfaces no longer exist.
**Migration**: Use tray status, deployed Web diagnostics over the local bridge, and `chc agent status`/`doctor`.

### Requirement: Desktop renderer React 19 baseline
**Reason**: The Electron renderer is deleted.
**Migration**: The independently deployed Web application defines its own frontend baseline and MAY continue using React.

### Requirement: Desktop renderer consumes shared UI foundation
**Reason**: There is no desktop renderer consumer after cutover.
**Migration**: Retain shared UI primitives only where the deployed Web application or another live consumer uses them.

### Requirement: Desktop renderer uses a desktop host adapter
**Reason**: Desktop window/preload host APIs are removed.
**Migration**: The deployed Web application uses ticket-bootstrapped loopback APIs, while tray and CLI use the same-user supervisor contract.

### Requirement: Shared pages remain web-safe
**Reason**: Shared desktop/web page composition is no longer required by the retired shell.
**Migration**: The deployed Web application remains web-safe and consumes local capability only through the explicit bridge client boundary.

### Requirement: Retro-futuristic shell art direction
**Reason**: The desktop shell visual direction is removed with the windowed product.
**Migration**: The deployed Web application owns visual direction; no tray expansion is required.

### Requirement: CthuDesktop icon aligns with brand direction
**Reason**: Desktop package/renderer icons are no longer shipped.
**Migration**: Provide platform-appropriate CthuAgent tray and release icons.

### Requirement: Cohesive desktop shell chrome
**Reason**: Shell chrome, settings navigation, and frameless window behavior no longer exist.
**Migration**: Follow native tray behavior and standard system-browser interactions with the deployed Web application.

### Requirement: Consolidated connection status presentation
**Reason**: Desktop statusbar/titlebar ownership is removed.
**Migration**: Use the tray for active-environment summary and deployed Web/CLI for detailed connection diagnostics.

### Requirement: Adaptive first-launch window sizing
**Reason**: The agent creates no first-launch application window.
**Migration**: The system browser owns window sizing when the deployed Web route opens.

### Requirement: Standard desktop page frame
**Reason**: Desktop page frames are removed with the renderer.
**Migration**: The deployed Web application owns responsive layout independently of desktop shell pages.

### Requirement: Shell visual refresh preserves behavior
**Reason**: No future desktop shell visual refresh is supported.
**Migration**: Validate functional parity through Agent, tray, local bridge, CLI, and deployed Web tests instead of renderer shell tests.

### Requirement: Home readiness dashboard
**Reason**: The desktop home dashboard is removed.
**Migration**: Present local readiness in the deployed Web console through the bridge and concise tray/CLI status; keep business tools in Web.

### Requirement: Logs placeholder remains explicit
**Reason**: Logs are no longer a desktop placeholder.
**Migration**: Use `chc agent logs` and redacted deployed Web diagnostics over the local bridge.

### Requirement: Settings section ownership
**Reason**: Desktop-specific settings navigation ownership is retired.
**Migration**: Tray/CLI own environment and lifecycle configuration; the deployed Web console owns runtime, profile, and diagnostics presentation through the bridge.

### Requirement: Desktop diagnostics presentation
**Reason**: The Electron diagnostics presentation is removed.
**Migration**: Present sanitized diagnostics through the deployed Web local bridge and CLI.
