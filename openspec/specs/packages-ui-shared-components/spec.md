# packages-ui-shared-components Specification

## Purpose
TBD - created by archiving change apps-desktop-shared-ui-foundation. Update Purpose after archive.
## Requirements
### Requirement: Shared UI package
The repository SHALL provide a shared React UI package for workspace applications that need CthuTool interface primitives.

#### Scenario: Shared UI package is workspace-discoverable
- **WHEN** dependencies are installed from the repository root
- **THEN** the shared UI package is discovered by the existing `packages/*` pnpm workspace pattern

#### Scenario: Shared UI package exposes UI primitives
- **WHEN** a React workspace app imports from the shared UI package
- **THEN** it can consume exported utilities and component primitives without importing from another app directory

### Requirement: shadcn-compatible component ownership
The shared UI package SHALL own shadcn-compatible copied components and their direct styling helpers.

#### Scenario: Component source is repo-owned
- **WHEN** a shadcn-compatible primitive such as Button, Badge, Card, Tooltip, Tabs, or Table is added for shared use
- **THEN** its source lives under the shared UI package rather than under an individual app

#### Scenario: Apps do not duplicate shared primitives
- **WHEN** desktop or future frontend code needs an existing shared primitive
- **THEN** it imports that primitive from the shared UI package instead of creating an app-local duplicate

### Requirement: Tailwind theme foundation
The shared UI package SHALL provide Tailwind-compatible global styles and semantic theme tokens for app surfaces and components.

#### Scenario: Semantic tokens are available
- **WHEN** a consuming app imports the shared global styles
- **THEN** semantic tokens for background, foreground, panel, border, muted content, primary action, status colors, radius, and focus ring are available to shared components

#### Scenario: Dracula can be represented semantically
- **WHEN** a consuming app selects the Dracula color scheme
- **THEN** the shared token set maps Dracula colors onto semantic token names instead of requiring component-specific color variables

### Requirement: Framework-neutral React compatibility
The shared UI package SHALL remain usable by Electron/Vite React apps and future web React apps across the supported React baseline.

#### Scenario: Shared components avoid framework-only APIs
- **WHEN** a component is exported from the shared UI package
- **THEN** it does not require Next.js-only, Electron-only, or browser-extension-only APIs

#### Scenario: React peer dependency supports desktop and web consumers
- **WHEN** package metadata is inspected
- **THEN** React and React DOM are declared as peer dependencies compatible with React 18.3+ and React 19 consumers

#### Scenario: Shared package does not force unrelated app upgrades
- **WHEN** a workspace app that has not yet migrated to React 19 consumes compatible shared UI exports
- **THEN** the shared UI package peer dependency range does not require that app to upgrade before it can install dependencies

### Requirement: Accessible interaction primitives
Shared UI primitives SHALL preserve keyboard, focus, disabled, and screen-reader behavior expected from production interface controls.

#### Scenario: Interactive components expose focus states
- **WHEN** a keyboard user tabs through shared buttons, inputs, tabs, menus, dialogs, or tooltips
- **THEN** visible focus states and appropriate ARIA behavior are available through the component implementation

#### Scenario: Disabled actions are non-interactive
- **WHEN** a shared component is rendered in a disabled state
- **THEN** it does not trigger its action and communicates its disabled state to assistive technologies where applicable
