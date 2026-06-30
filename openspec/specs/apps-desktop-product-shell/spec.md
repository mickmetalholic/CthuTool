# apps-desktop-product-shell Specification

## Purpose
Define the CthuDesktop product shell, app identity, window chrome, navigation, settings, visual system, runtime status, and desktop page patterns.

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
The desktop application SHALL default to a main workspace intended for local host capabilities and future business capabilities rather than app configuration.

#### Scenario: Default launch opens main workspace
- **WHEN** the desktop application starts without a saved workspace preference
- **THEN** it opens the main workspace instead of the Settings workspace

#### Scenario: Main business navigation is not duplicated
- **WHEN** the main workspace is active
- **THEN** Home, Browser Host, Agents, and future top-level business capabilities are selected directly from the activity bar without repeating the same destinations in a text submenu

#### Scenario: Tasks is not a primary workspace
- **WHEN** the main workspace is active
- **THEN** the activity bar does not include a first-class Tasks workspace entry for the current browser-auth-only task model

#### Scenario: Future capability slots are visible without enabling behavior
- **WHEN** future capability entries are shown before implementation
- **THEN** the UI presents them as unavailable or placeholder navigation without exposing executable browser-control behavior

### Requirement: Settings workspace
The desktop application SHALL provide a bottom-left Settings entry that switches to an app configuration and diagnostics workspace with clear section ownership.

#### Scenario: Settings entry switches workspace
- **WHEN** the user activates the bottom-left Settings entry
- **THEN** the application switches from the main workspace to the Settings workspace

#### Scenario: Settings sections are organized by submenu
- **WHEN** the Settings workspace is active
- **THEN** it provides submenu sections for service connection, local runtime or status, diagnostics, logs, and appearance readiness without mixing editable configuration and read-only diagnostic data on the same page

#### Scenario: Service configuration is not mixed into business home
- **WHEN** the user views the default main workspace
- **THEN** backend URL and environment editing controls are not the primary content of that workspace

#### Scenario: Logs remains a placeholder section
- **WHEN** the user opens Settings Logs before a log system exists
- **THEN** the page clearly states that log viewing is not connected and does not present synthetic logs as real runtime events

### Requirement: Dracula theme foundation
The desktop renderer SHALL use Dracula as the first built-in color scheme and SHALL implement it through shared semantic theme tokens.

#### Scenario: Dracula is the initial scheme
- **WHEN** the desktop application is launched without an appearance preference
- **THEN** the renderer applies the Dracula color scheme

#### Scenario: Theme tokens drive shell surfaces
- **WHEN** the renderer displays title bar, activity bar, workspace, status bar, panels, inputs, and buttons
- **THEN** those surfaces use semantic theme tokens rather than hard-coded component-specific colors

#### Scenario: Shared theme tokens drive common components
- **WHEN** the renderer displays common controls supplied by the shared UI package
- **THEN** those controls use shared semantic tokens that can also be consumed by a future web frontend

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
The desktop application SHALL expose runtime status in the shell and detailed Settings sections without requiring users to open raw logs.

#### Scenario: Status bar summarizes active connection
- **WHEN** the desktop app is running
- **THEN** the status bar shows the active environment, backend URL, backend connection state, platform, and app version

#### Scenario: Diagnostics view shows connection detail
- **WHEN** the user opens the diagnostics section in Settings
- **THEN** the desktop app shows recent connection errors, selected backend URL, active environment, agent id, last registered time, last heartbeat or last seen information when available, and browser runtime diagnostic detail

#### Scenario: Environment status opens service settings
- **WHEN** the user activates the status bar environment and connection segment
- **THEN** the desktop app opens the Settings workspace focused on the service connection section

#### Scenario: Client status opens local runtime settings
- **WHEN** the user activates the status bar platform and version segment
- **THEN** the desktop app opens the Settings workspace focused on the local runtime or status section

#### Scenario: Logs view is accessible from Settings
- **WHEN** the user opens the logs section in Settings
- **THEN** the desktop app provides an explicit placeholder for future local or server-backed log inspection without mixing logs into the default main workspace or implementing log retrieval in this change

### Requirement: Desktop renderer React 19 baseline
The desktop renderer SHALL use the React 19 stable line for its renderer runtime and TypeScript React definitions before adopting the shared UI/runtime foundation.

#### Scenario: Desktop package uses React 19
- **WHEN** the desktop package dependencies are inspected
- **THEN** `react` and `react-dom` target the React 19 stable line

#### Scenario: Desktop TypeScript definitions match React 19
- **WHEN** the desktop package development dependencies are inspected
- **THEN** `@types/react` and `@types/react-dom` target React 19-compatible definitions

#### Scenario: React upgrade preserves renderer behavior
- **WHEN** desktop renderer tests run after the React upgrade
- **THEN** existing shell, settings, agents, and browser-profile behavior remains covered and passing before broader UI migration continues

### Requirement: Desktop renderer consumes shared UI foundation
The desktop renderer SHALL consume shared UI primitives and theme tokens for common interface surfaces once the shared UI package exists.

#### Scenario: Common controls use shared primitives
- **WHEN** the desktop renderer displays common buttons, badges, cards, tables, tabs, tooltips, or status surfaces that exist in the shared UI package
- **THEN** those controls are rendered through shared primitives rather than desktop-local duplicates

#### Scenario: Desktop theme uses shared semantic tokens
- **WHEN** the desktop renderer applies its color scheme
- **THEN** shell and page surfaces use shared semantic theme tokens where available while preserving CthuDesktop's configured appearance mode and color scheme

### Requirement: Desktop renderer uses a desktop host adapter
The desktop renderer SHALL access desktop-only host capabilities through a desktop host adapter instead of embedding preload access inside shared page components.

#### Scenario: Window controls call desktop adapter actions
- **WHEN** the user activates minimize, maximize, or close from the desktop shell
- **THEN** the renderer routes the action through the desktop host adapter backed by the preload API

#### Scenario: Local app info stays desktop-scoped
- **WHEN** the desktop renderer displays app version, platform, user data path, config path, or browser profiles path
- **THEN** those values come from the desktop host adapter and are not required by shared web-safe pages

#### Scenario: Local browser actions stay desktop-scoped
- **WHEN** the desktop renderer opens login, verifies a profile, clears a profile, or reads local pending auth tasks
- **THEN** those actions are provided through desktop runtime capabilities and remain unavailable to web-safe adapters

### Requirement: Shared pages remain web-safe
Desktop pages that are moved into shared runtime packages SHALL remain usable without Electron-specific globals.

#### Scenario: Shared page renders without preload API
- **WHEN** a shared page is rendered with a web-safe or test runtime adapter
- **THEN** it does not require `window.cthutoolDesktop` to exist

#### Scenario: Host-only controls are capability-gated
- **WHEN** a shared page is rendered without a capability for a desktop-only action
- **THEN** the page hides, disables, or replaces that control with a non-executable state

### Requirement: Retro-futuristic shell art direction
The desktop application SHALL apply a dark retro-futuristic neon visual direction to the shell and page frame while preserving productivity-oriented readability and interaction clarity.

#### Scenario: Neon style supports operational scanning
- **WHEN** the desktop shell renders navigation, status, and workspace content
- **THEN** neon accents, glow, depth, and geometric treatments emphasize hierarchy and state without obscuring text or controls

#### Scenario: Landing-page inspiration is adapted to desktop workflows
- **WHEN** the style references immersive gaming platform patterns such as 3D depth, showcase surfaces, community/status modules, or download-style CTA emphasis
- **THEN** those patterns are adapted into desktop shell atmosphere, page summaries, status surfaces, and primary actions rather than literal landing-page hero sections

#### Scenario: Theme controls do not expose unfinished themes
- **WHEN** the appearance settings are rendered during this visual-system phase
- **THEN** incomplete theme switching controls are removed, disabled, or replaced with a clear fixed-theme/token-system state

### Requirement: CthuDesktop icon aligns with brand direction
The desktop application SHALL use CthuDesktop icon assets that align with the CthuTool and CthuCodex neon brand references while remaining usable as desktop package, OS window/taskbar, renderer titlebar, and startup loading icons.

#### Scenario: Icon references the shared brand language
- **WHEN** CthuDesktop icon artwork is designed or refreshed
- **THEN** it is derived from the same base style as the existing CthuTool and CthuCodex assets, including horizontal glossy neon wordmark, dark rounded backplate, central port/control motif, bevel/glow treatment, and product-suffix extension area
- **AND** it changes only the product wording to `CthuDesktop` plus a restrained desktop-specific color treatment unless a later approved design explicitly changes the shared logo system

#### Scenario: Package and renderer assets stay consistent
- **WHEN** desktop icon assets are updated
- **THEN** Electron package resources, Electron main-process window/taskbar icon configuration, renderer titlebar identity, and startup loading identity reuse the canonical `apps/desktop/build/icon.png` asset derived from the accepted same-family CthuDesktop logo artwork
- **AND** any small-size cropped or simplified variants remain visually connected to the shared CthuTool/CthuCodex base style without becoming an unrelated app symbol

#### Scenario: Package icon uses a square composition
- **WHEN** the Electron package icon is prepared
- **THEN** it uses a square transparent icon composition derived from the accepted CthuDesktop logo artwork
- **AND** the square composition preserves the horizontal logo identity rather than replacing it with an unrelated square emblem
- **AND** it does not add a decorative outer frame, border, or opaque background plate

### Requirement: Cohesive desktop shell chrome
The desktop application SHALL present titlebar, activity bar, Settings entry, subnav, statusbar, connection state, and window controls as one cohesive shell system with consistent spacing, density, active states, hover states, and focus states.

#### Scenario: Shell chrome uses consistent interaction states
- **WHEN** the user hovers, focuses, selects, disables, or activates a shell control
- **THEN** the control uses the same visual-state language as other shell controls of the same role

#### Scenario: Settings is visually separated from business navigation
- **WHEN** the activity bar renders business destinations and the Settings entry
- **THEN** Settings is presented as an app-configuration entry separated from primary business navigation without appearing like an unrelated floating control

#### Scenario: Frameless window behavior is preserved
- **WHEN** the shell chrome is refreshed
- **THEN** draggable titlebar regions and minimize, maximize, and close controls continue to work through the desktop host adapter

### Requirement: Consolidated connection status presentation
The desktop application SHALL present live connection state and connection context through one global shell summary and one detailed Settings status surface rather than repeating the same status or backend context in multiple shell and page locations.

#### Scenario: Statusbar owns the global connection summary
- **WHEN** the desktop shell renders connection state and environment context
- **THEN** the bottom statusbar shows one compact connection-info entry with state text or icon, environment label, and backend URL
- **AND** activating that entry opens the Settings status detail surface

#### Scenario: Titlebar avoids duplicate connection context
- **WHEN** the titlebar renders product identity and window controls
- **THEN** it does not show environment labels, backend URLs, or connection status labels already owned by the bottom statusbar connection-info entry

#### Scenario: Settings owns detailed connection diagnostics
- **WHEN** the user opens the Settings status detail surface
- **THEN** backend URL, agent ID, last registration, last error, browser runtime diagnostic, platform, version, and local paths are available in one place without duplicating those details across Overview and multiple Settings pages

### Requirement: Adaptive first-launch window sizing
The desktop main process SHALL size the first application window from the current display work area on first launch, then fully restore the user's persisted window size and position on later launches.

#### Scenario: First launch chooses a display-aware default
- **WHEN** no persisted `windowState` exists
- **THEN** the initial window size is derived from the available display work area and constrained by the desktop minimum size and a comfortable maximum size
- **AND** the window opens within a visible display area

#### Scenario: Later launches restore user bounds
- **WHEN** a valid persisted `windowState` exists
- **THEN** the desktop window opens with that saved size and position
- **AND** maximized state is restored when it was saved

#### Scenario: Off-screen saved bounds recover safely
- **WHEN** a persisted `windowState` would place the window outside all currently available display work areas
- **THEN** the desktop window opens within a visible display area while preserving a valid size when possible

### Requirement: Standard desktop page frame
The desktop renderer SHALL render each workspace page through a standard page frame that defines header, optional description, toolbar slot, content spacing, scroll behavior, and responsive overflow handling.

#### Scenario: Pages share a predictable header structure
- **WHEN** the user opens Home, Browser Host, Agents, or a Settings section
- **THEN** the page presents title, context label, and optional actions in consistent locations

#### Scenario: Content spacing does not shift by page
- **WHEN** the user switches between primary desktop pages
- **THEN** page margins, section gaps, and scroll containers remain consistent enough that the shell does not visually jump

#### Scenario: Long metadata remains scannable
- **WHEN** the page displays long backend URLs, agent IDs, local paths, or profile names
- **THEN** those values wrap, truncate, or use metadata styling without overlapping adjacent controls

### Requirement: Shell visual refresh preserves behavior
The desktop shell visual-system refresh SHALL preserve existing shell, settings, agents, task, and browser-profile behavior while changing presentation.

#### Scenario: Existing renderer workflows still pass tests
- **WHEN** desktop renderer tests run after the visual-system refresh
- **THEN** existing navigation, settings save, status, agents, task, browser action, and stale preload fallback behavior remains covered and passing

#### Scenario: Main process window restoration is covered
- **WHEN** desktop main/config unit tests run after the visual-system refresh
- **THEN** adaptive first-launch sizing, persisted bounds restoration, maximized restoration, and off-screen recovery behavior are covered and passing

#### Scenario: Host-only controls remain capability scoped
- **WHEN** host-only actions such as window controls or local browser-profile actions are rendered
- **THEN** they continue to route through the runtime adapter and remain unavailable or non-executable in web-safe shared rendering

### Requirement: Home readiness dashboard
CthuDesktop SHALL use the Home workspace as a local readiness dashboard for the current host.

#### Scenario: Home summarizes connection readiness
- **WHEN** the user opens the Home workspace
- **THEN** Home shows the active environment, backend connection state, and whether the local agent is enabled or connected without exposing backend URL editing controls

#### Scenario: Home summarizes local agent readiness
- **WHEN** the user opens the Home workspace
- **THEN** Home shows the local desktop agent identity or display name and whether the agent is advertising host browser capability

#### Scenario: Home summarizes browser attention
- **WHEN** local or backend browser status includes pending browser-auth attention
- **THEN** Home shows that browser attention exists and directs the user to the Browser Host workspace for resolution

#### Scenario: Home excludes business lookup tools
- **WHEN** the Home workspace renders
- **THEN** it does not show Douban Movie lookup or other business-tool forms

### Requirement: Logs placeholder remains explicit
CthuDesktop SHALL keep the Settings Logs section as an explicit placeholder until a real local or server-backed log capability exists.

#### Scenario: Logs capability is not connected
- **WHEN** the user opens Settings Logs before a log API exists
- **THEN** the page clearly indicates that log viewing is not connected yet rather than showing synthetic runtime events as if they were real logs

### Requirement: Settings section ownership
CthuDesktop SHALL organize Settings sections by information ownership and editability so configuration, local runtime facts, diagnostics, logs, and appearance readiness are not mixed into one page.

#### Scenario: Service section owns editable connection configuration
- **WHEN** the user opens the Settings service section
- **THEN** editable environment, backend URL, device name, and local agent enabled controls are available there and not duplicated as editable controls on Home or read-only diagnostics pages

#### Scenario: Local runtime section owns host facts
- **WHEN** the user opens the Settings local runtime or status section
- **THEN** read-only local app metadata, platform, packaged state, agent identity, browser runtime kind, browser runtime status, and local filesystem paths are grouped for scanning

#### Scenario: Diagnostics section owns troubleshooting detail
- **WHEN** the user opens the Settings diagnostics section
- **THEN** recent connection error, registration timing, backend URL, active environment, browser runtime diagnostic message, and other troubleshooting details are available without exposing unrelated edit controls

#### Scenario: Appearance section does not imply unfinished theme switching
- **WHEN** the Settings appearance section is shown before full theme switching exists
- **THEN** it presents the current fixed theme or token-system state without exposing controls that appear executable but are not supported

### Requirement: Desktop diagnostics presentation
The desktop product shell SHALL present structured local diagnostics and log status through Settings surfaces without requiring users to inspect raw log files.

#### Scenario: Settings shows diagnostic summary
- **WHEN** the user opens the diagnostics section in Settings
- **THEN** the shell shows connection state, backend URL, agent id, browser runtime diagnostic, last relevant error, and freshness timestamps using safe summarized fields

#### Scenario: Logs surface avoids sensitive details
- **WHEN** the shell exposes logs or a logs placeholder
- **THEN** it does not display raw cookies, storage state, browser profile paths, raw HTML, or screenshots
