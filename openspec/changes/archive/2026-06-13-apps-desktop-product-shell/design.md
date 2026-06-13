## Context

`apps/desktop` currently exists as an Electron app with a renderer management page for backend URL, local agent status, and connected agents. It proves the desktop-to-backend connection model, but the UI still resembles a web page inside a system-framed window. The next change should turn it into CthuDesktop: a native-feeling desktop companion with its own app shell, navigation, status surfaces, and packaging path.

This design must preserve the current separation of concerns: Electron main process owns native lifecycle and backend connection state, the renderer owns presentation, and backend services remain the source of truth for agent registry and future business data. The shell should make room for future capabilities such as connecting local Chrome, browser tasks, logs, and diagnostics without implementing those capabilities now.

## Goals / Non-Goals

**Goals:**
- Make CthuDesktop feel like a first-class desktop app through a custom title bar, app chrome, activity bar, status bar, and Dracula visual system.
- Default the app to a main workspace for business capabilities selected directly from the activity bar, without a duplicate text submenu for the same destinations.
- Provide a bottom-left Settings entry that switches to an app configuration workspace with service connection, local status, logs, diagnostics, and appearance sections.
- Make the status bar actionable: the environment/connection segment opens service connection settings, and the client/platform/version segment opens local status settings.
- Introduce environment profiles so local development, packaged Test, and packaged Production connections are explicit and switchable.
- Add app icon assets and configure packaging metadata so the built desktop app uses the CthuDesktop identity.
- Add GitHub Actions packaging for macOS and Windows artifacts without requiring production signing or notarization.

**Non-Goals:**
- Do not implement browser automation, local Chrome connection, task dispatch, or host-control business behavior.
- Do not change backend agent registry protocol requirements unless the existing client needs to reconnect after environment changes.
- Do not add auto-update, notarization, certificate management, release publishing, or production installer hardening.
- Do not move service ownership, browser parsing, Douban logic, or MCP behavior into the desktop renderer.

## Decisions

### Use an app-owned shell instead of a decorated web page

The Electron window will become frameless and render its own title bar, activity bar, content workspace, and status bar. The title bar will include the CthuDesktop icon/name, active environment, connection state, and platform-aware window controls. Drag regions will be explicit so the title bar behaves like native app chrome while preserving clickable controls.

Alternative considered: keep the native frame and restyle only the page. That is simpler, but it does not solve the core product problem: the desktop app still feels like a browser window.

### Keep the main workspace business-first and make Settings the only secondary navigation workspace

The default view will be the main workspace for business capabilities. Its left activity bar shows direct entries such as Home, Chrome, Agents, and future capabilities. The main workspace must not repeat those same entries in a second text sidebar; until a capability has real nested subviews, the activity bar is the only navigation for main business views. Logs are not a main capability in the first product shell and remain under Settings.

The bottom Settings entry switches the whole workspace into app configuration sections rather than opening a modal. Settings is the only first-pass workspace with a text submenu, because service connection, local status, diagnostics, logs, and appearance are peer configuration sections.

Alternative considered: put all settings in the default home page. That scales poorly once local Chrome, browser tasks, and diagnostics arrive, and it keeps the app feeling like a setup form.

Alternative considered: keep a Codex-style submenu for both main and Settings workspaces. That made the first shell feel over-navigated because Home, Chrome, Agents, and Logs were represented twice before they had enough nested structure to justify it.

### Store navigation state separately from connection state

Renderer navigation state should track the active workspace and submenu, while the main-process config remains responsible for persistent app settings: environment profiles, active environment, device name, connection enabled state, appearance, and window state. This keeps UI routing changes from disturbing the agent identity or backend connection logic.

Alternative considered: put all state in React only. That is fine for prototype navigation, but environment selection, theme preference, and window state need persistence across app launches.

### Make status bar segments actionable, not passive labels

The status bar will group connection and client information into two VS Code-like buttons. The left button shows active environment, backend URL, and connection status; clicking it opens Settings > Service Connection. The right button shows platform and app version; clicking it opens Settings > Local Status. This keeps the status bar compact while making each summary a shortcut to the canonical settings section for details or edits.

Alternative considered: keep each value as a separate static status item. That wastes status bar space and gives users no obvious path from an observed state to the place where it can be inspected or changed.

### Migrate from a single backend URL to environment profiles

Existing config with `backendUrl` should migrate to a profile-based model. Development builds should default to a local profile pointing to `http://localhost:3000`. Packaged builds should default to Test and Production profiles, both user configurable. Active environment changes should trigger the main process to reconnect the agent client to the selected backend.

Alternative considered: keep one URL and add a label. That does not protect users from accidentally treating production and local endpoints the same, and it does not match the requested test/production switcher.

### Use Dracula first, with theme tokens for later schemes

The first visual system will be Dracula. The implementation should define semantic CSS variables for shell surfaces, workspace surfaces, text, borders, accents, warnings, errors, and status states. Later schemes can be added by changing token values rather than rewriting component CSS.

Alternative considered: implement a generic color-scheme editor now. That would slow the first pass and add settings complexity before there are multiple supported schemes.

### Package unsigned artifacts in CI first

GitHub Actions should build desktop artifacts on `windows-latest` and `macos-latest`, run desktop-focused validation, and upload artifacts. The workflow should avoid signing and notarization in this change; those can be layered on once certificate and release-channel decisions exist.

Alternative considered: fully signed installers immediately. That is not necessary to validate the desktop product shell and would introduce external credential requirements.

## Risks / Trade-offs

- Frameless windows can break native window expectations -> Keep platform-aware controls, explicit drag regions, keyboard accessibility, and smoke tests around window chrome.
- Theme work can become cosmetic-only churn -> Anchor the first pass to stable semantic tokens and use Dracula as the first concrete scheme.
- Environment switching can leave stale WebSocket state -> Route active environment changes through the main process and force agent-client refresh/reconnect.
- Packaged Test and Production URLs may not be known yet -> Provide configurable defaults and document how CI or build-time env can inject concrete endpoints later.
- CI packaging can be slow -> Keep it in a desktop-specific workflow and upload artifacts separately from the existing unit/coverage CI.

## Migration Plan

1. Add icon assets and packaging metadata while preserving the existing Electron app entry points.
2. Add the shell layout and Dracula tokens around the existing agent console content.
3. Introduce the profile-based config model and migrate any existing single `backendUrl` into the local profile.
4. Move backend connection controls, agent status, logs, diagnostics, and appearance into the Settings workspace, and wire status bar buttons to the relevant Settings sections.
5. Add desktop packaging workflow for macOS and Windows artifacts.
6. If rollback is needed, keep the existing agent registry and protocol untouched and revert the renderer shell/config migration within `apps/desktop`.

## Open Questions

- What concrete Test and Production backend URLs should packaged builds use by default?
- Should the first packaging workflow produce installer formats immediately (`dmg` and `nsis`) or start with unpacked artifacts plus one installer target per platform?
- Should window controls visually follow each platform exactly, or use one consistent CthuDesktop control style across platforms?
