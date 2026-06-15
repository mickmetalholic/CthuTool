## ADDED Requirements

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
- **WHEN** the user opens Overview, Tasks, Browser Profiles, Agents, or a Settings section
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
