## ADDED Requirements

### Requirement: User-facing documentation journeys
The docs site SHALL organize its primary documentation around user and operator journeys before repository implementation structure.

#### Scenario: Reader starts from the docs home page
- **WHEN** a reader opens the docs site home page
- **THEN** the page presents entry points for homelab deployment, client installation, module usage, operations, architecture, and reference material

#### Scenario: Reader uses the sidebar navigation
- **WHEN** a reader inspects the primary docs navigation
- **THEN** the navigation includes sections for Start, Homelab Deployment, Client Installation, Modules, Operations, Architecture, and Reference

### Requirement: Homelab deployment documentation
The docs site SHALL document how to deploy CthuTool server-side services on a homelab machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies prerequisites, install steps, required configuration, service startup, health checks, upgrade flow, and troubleshooting entry points

#### Scenario: Reader identifies runtime placement
- **WHEN** a reader reviews deployment overview material
- **THEN** the documentation explains which components run on the homelab machine and which components run on client computers

### Requirement: Client installation documentation
The docs site SHALL document how users install, update, and remove CthuTool client tools on client computers.

#### Scenario: Reader installs client tooling
- **WHEN** a reader opens client installation documentation
- **THEN** the documentation provides separate entry points for the desktop client and CLI tool

#### Scenario: Reader manages installed clients
- **WHEN** a reader needs to update or uninstall client tooling
- **THEN** the documentation explains the supported update and uninstall paths or links to the authoritative package-specific source

### Requirement: Module usage documentation
The docs site SHALL provide module-oriented usage documentation for major CthuTool product areas.

#### Scenario: Reader chooses a product module
- **WHEN** a reader opens the modules section
- **THEN** the documentation lists supported modules with purpose, expected runtime location, and links to setup or usage pages

#### Scenario: Module source boundaries are visible
- **WHEN** a module page summarizes behavior owned by a package README or OpenSpec spec
- **THEN** the page identifies the authoritative source path for development or requirements details

### Requirement: Architecture documentation with OpenSpec references
The docs site SHALL explain the implementation architecture while preserving OpenSpec specs as the authoritative requirements source.

#### Scenario: Reader reviews system architecture
- **WHEN** a reader opens the architecture overview
- **THEN** the documentation explains the homelab machine, backend service, web console, desktop client, CLI tool, browser runtime, and shared packages at a high level

#### Scenario: Reader needs normative requirements
- **WHEN** an architecture or module page discusses capability requirements
- **THEN** the page links to the relevant `openspec/specs/<capability>/spec.md` source instead of duplicating the full normative requirements

### Requirement: OpenSpec capability index synchronization
The docs site SHALL keep the browsable OpenSpec capability index aligned with current specs under `openspec/specs/`.

#### Scenario: Capability specs change
- **WHEN** capability spec directories are added, removed, or renamed under `openspec/specs/`
- **THEN** the docs capability index is generated from those directories or a validation command fails until the index is updated

#### Scenario: Docs validation runs
- **WHEN** focused docs validation is run
- **THEN** the validation includes the docs build and the OpenSpec capability index generation or drift check

### Requirement: Documentation duplication control
The docs site SHALL be the most complete prose source for user-facing deployment, installation, module usage, operations, and architecture documentation.

#### Scenario: Reader opens package README files
- **WHEN** a reader opens a package README file
- **THEN** the README provides package-local development commands or a concise package overview
- **AND** it links to the docs site for user-facing usage, installation, operations, or architecture content

#### Scenario: Reader opens root docs source notes
- **WHEN** a reader opens root `docs/` Markdown files that previously held long-form cross-package documentation
- **THEN** the file either contains short source-boundary notes or points to the corresponding docs-site pages

#### Scenario: User-facing content is maintained
- **WHEN** user-facing content would otherwise be duplicated between the docs site and README or root docs files
- **THEN** the docs site keeps the complete version and the other file keeps only the minimum local reference or navigation pointer
