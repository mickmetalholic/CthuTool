## ADDED Requirements

### Requirement: Web App Workspace

The system SHALL include a new `apps/web` workspace app as the browser-hosted CthuTool management console project.

#### Scenario: Workspace app exists

- **WHEN** the repository workspace packages are inspected
- **THEN** `apps/web` is present as a workspace package with its own package metadata

#### Scenario: Web app has scoped package identity

- **WHEN** the `apps/web` package metadata is inspected
- **THEN** it identifies the app with a CthuTool-scoped private package name

### Requirement: Next.js Scaffold

The `apps/web` app SHALL use a minimal Next.js TypeScript scaffold suitable for the App Router.

#### Scenario: App Router entry exists

- **WHEN** the `apps/web` source tree is inspected
- **THEN** it contains the minimal App Router files required for a Next.js app to build

#### Scenario: No product pages are implemented

- **WHEN** the initial `apps/web` UI is inspected
- **THEN** it contains only placeholder-safe scaffold content and no real management-console workflows

### Requirement: Styling Baseline

The `apps/web` app SHALL include a Tailwind CSS and shadcn/ui-compatible styling baseline without depending on desktop renderer styles.

#### Scenario: Tailwind baseline exists

- **WHEN** the web app configuration is inspected
- **THEN** Tailwind-compatible global styling is available to the Next.js app

#### Scenario: Desktop styles are not reused directly

- **WHEN** the web app imports are inspected
- **THEN** it does not import CSS or renderer internals from `apps/desktop`

### Requirement: Shared Page Readiness

The `apps/web` app SHALL be prepared to consume future shared UI/runtime packages while keeping reusable page implementation out of this change.

#### Scenario: Shared packages are not created by this change

- **WHEN** the implementation diff is inspected
- **THEN** it does not add or modify shared UI/runtime packages under `packages/*`

#### Scenario: Host-specific code stays local

- **WHEN** the web app source is inspected
- **THEN** Next.js routing, metadata, and web-host bootstrap code remain under `apps/web`

### Requirement: Script Integration

The `apps/web` app SHALL provide workspace scripts for development, build, typecheck, and lint workflows.

#### Scenario: Web scripts are available

- **WHEN** the `apps/web` package scripts are inspected
- **THEN** scripts exist for `dev`, `build`, `typecheck`, and `lint`

#### Scenario: Repository build can include the web app

- **WHEN** the repository task runner executes build tasks
- **THEN** `apps/web` can participate without requiring changes to existing app packages

### Requirement: Documentation Uses Apps Web

Documentation introduced or updated for this web host SHALL refer to the project as `apps/web` instead of `apps/frontend`.

#### Scenario: Web host documentation is named consistently

- **WHEN** relevant OpenSpec and project documentation for the browser-hosted management console is inspected
- **THEN** it uses `apps/web` rather than `apps/frontend` as the app path

#### Scenario: Existing future-web references are corrected

- **WHEN** existing documentation references the future CthuTool browser host as `apps/frontend`
- **THEN** those references are updated to `apps/web` without changing package source behavior
