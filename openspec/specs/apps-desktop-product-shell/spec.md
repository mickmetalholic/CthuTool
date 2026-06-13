# apps-desktop-product-shell Specification

## Purpose
TBD - created by archiving change apps-desktop-product-shell. Update Purpose after archive.
## Requirements
### Requirement: CthuDesktop app identity
The desktop application SHALL present itself as CthuDesktop in product chrome, package metadata, and renderer-visible app identity.

#### Scenario: App identity is visible in shell chrome
- **WHEN** the desktop application starts
- **THEN** the custom shell displays the CthuDesktop name and app icon in the title bar or equivalent app identity area

#### Scenario: Package metadata uses CthuDesktop identity
- **WHEN** the desktop application is packaged
- **THEN** generated desktop artifacts use the CthuDesktop product name and configured app icon

### Requirement: Custom desktop window shell
The desktop application SHALL render an app-owned shell instead of relying on the default operating-system window frame.

#### Scenario: Custom title bar is rendered
- **WHEN** the desktop application window opens
- **THEN** the renderer displays a custom title bar with draggable regions and interactive controls for app actions

#### Scenario: Window controls remain available
- **WHEN** the desktop application runs on Windows or macOS
- **THEN** the shell provides platform-appropriate minimize, maximize or zoom, and close controls

#### Scenario: Main layout includes app chrome
- **WHEN** the desktop application renders the default workspace
- **THEN** the UI includes a title bar, left activity bar, main content workspace, and bottom status bar

### Requirement: Business-first main workspace
The desktop application SHALL default to a main workspace intended for business capabilities rather than app configuration.

#### Scenario: Default launch opens main workspace
- **WHEN** the desktop application starts without a saved workspace preference
- **THEN** it opens the main workspace instead of the Settings workspace

#### Scenario: Main business navigation is not duplicated
- **WHEN** the main workspace is active
- **THEN** Home, Chrome, Agents, and future top-level business capabilities are selected directly from the activity bar without repeating the same destinations in a text submenu

#### Scenario: Future capability slots are visible without enabling behavior
- **WHEN** future capability entries such as local Chrome connection are shown before implementation
- **THEN** the UI presents them as unavailable or placeholder navigation without exposing executable browser-control behavior

### Requirement: Settings workspace
The desktop application SHALL provide a bottom-left Settings entry that switches to an app configuration workspace.

#### Scenario: Settings entry switches workspace
- **WHEN** the user activates the bottom-left Settings entry
- **THEN** the application switches from the main workspace to the Settings workspace

#### Scenario: Settings sections are organized by submenu
- **WHEN** the Settings workspace is active
- **THEN** it provides submenu sections for service connection, local status, logs, diagnostics, appearance, and other app-level configuration

#### Scenario: Service configuration is not mixed into business home
- **WHEN** the user views the default main workspace
- **THEN** backend URL and environment editing controls are not the primary content of that workspace

### Requirement: Dracula theme foundation
The desktop renderer SHALL use Dracula as the first built-in color scheme and SHALL implement it through semantic theme tokens.

#### Scenario: Dracula is the initial scheme
- **WHEN** the desktop application is launched without an appearance preference
- **THEN** the renderer applies the Dracula color scheme

#### Scenario: Theme tokens drive shell surfaces
- **WHEN** the renderer displays title bar, activity bar, workspace, status bar, panels, inputs, and buttons
- **THEN** those surfaces use semantic theme tokens rather than hard-coded component-specific colors

#### Scenario: Appearance preference is persisted
- **WHEN** the user changes the appearance mode or color scheme in Settings
- **THEN** the desktop application persists the preference and reapplies it on the next launch

### Requirement: Environment profiles
The desktop application SHALL use environment profiles to choose which backend service the local agent connects to.

#### Scenario: Development defaults to local environment
- **WHEN** the desktop app runs in local development mode without saved environment configuration
- **THEN** it exposes a local environment profile using `http://localhost:3000` as the default backend URL

#### Scenario: Packaged app exposes test and production environments
- **WHEN** the desktop app runs as a packaged build without saved environment configuration
- **THEN** it exposes Test and Production environment profiles that can each be configured with a backend URL

#### Scenario: Environment switch reconnects agent
- **WHEN** the user changes the active environment profile
- **THEN** the desktop main process reconnects the agent client using the selected profile backend URL

#### Scenario: Existing backend URL is migrated
- **WHEN** the desktop app loads existing config containing a single `backendUrl`
- **THEN** it migrates that URL into an environment profile without changing the stable local agent id

### Requirement: Runtime status surfaces
The desktop application SHALL expose runtime status in the shell without requiring users to open raw logs.

#### Scenario: Status bar summarizes active connection
- **WHEN** the desktop app is running
- **THEN** the status bar shows the active environment, backend URL, backend connection state, platform, and app version

#### Scenario: Diagnostics view shows connection detail
- **WHEN** the user opens the diagnostics section in Settings
- **THEN** the desktop app shows recent connection errors, selected backend URL, agent id, last registered time, last heartbeat or last seen information when available

#### Scenario: Environment status opens service settings
- **WHEN** the user activates the status bar environment and connection segment
- **THEN** the desktop app opens the Settings workspace focused on the service connection section

#### Scenario: Client status opens local status settings
- **WHEN** the user activates the status bar platform and version segment
- **THEN** the desktop app opens the Settings workspace focused on the local status section

#### Scenario: Logs view is accessible from Settings
- **WHEN** the user opens the logs section in Settings
- **THEN** the desktop app provides a logs view or explicit placeholder for future local log inspection without mixing logs into the default main workspace
