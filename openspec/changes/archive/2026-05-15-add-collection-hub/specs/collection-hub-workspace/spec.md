## ADDED Requirements

### Requirement: Isolated nested workspace
The system SHALL create an isolated pnpm workspace at `scratches/collection-hub` for the Collection Hub prototype.

#### Scenario: Nested workspace is created
- **WHEN** the workspace scaffold is inspected
- **THEN** it contains its own `package.json` and `pnpm-workspace.yaml`
- **AND** it contains `server`, `web`, `extension`, and `libs` package directories

#### Scenario: Root workspace remains unchanged
- **WHEN** the root workspace configuration is inspected after implementation
- **THEN** the root `pnpm-workspace.yaml` does not include `scratches/collection-hub`
- **AND** existing `@cthutool/*` packages remain outside the new nested workspace

### Requirement: Scoped package naming
All packages inside the nested workspace SHALL use the `@collection-hub` scope.

#### Scenario: Package names use organizer scope
- **WHEN** each nested package manifest is inspected
- **THEN** the package names are `@collection-hub/server`, `@collection-hub/web`, `@collection-hub/extension`, and `@collection-hub/libs`

### Requirement: Framework-free shared contracts package
The `@collection-hub/libs` package SHALL provide shared types and validation contracts without depending on NestJS, Next.js, or Plasmo runtime packages.

#### Scenario: Shared package is framework independent
- **WHEN** the shared package manifest is inspected
- **THEN** it does not declare NestJS, Next.js, or Plasmo as runtime dependencies
- **AND** it exports status values, fixed destination collection helpers, media type values, S/A/B rating values, source-bearing data types, import/delete/move/rating DTO schemas, dashboard response types, and API error shapes for other packages

### Requirement: Workspace-level verification scripts
The nested workspace SHALL provide commands that can install dependencies and run package-level build or typecheck verification from the nested workspace root.

#### Scenario: Verification can run from nested root
- **WHEN** a developer runs the documented nested workspace verification commands
- **THEN** the shared contracts, server, web, and extension packages are checked using their package scripts
- **AND** the nested root `check` script runs typecheck, test, and build across the workspace

### Requirement: Local development defaults
The nested workspace SHALL document and expose default local development commands for the web app, API server, and extension.

#### Scenario: Developer starts local services
- **WHEN** a developer works from `scratches/collection-hub`
- **THEN** `pnpm dev:web` starts the Next.js app on the documented web dev port
- **AND** `pnpm dev:server` starts the NestJS API server on the documented API dev port unless `PORT` overrides it
- **AND** `pnpm dev:extension` starts the Plasmo extension dev process
