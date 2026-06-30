# apps-docs-site Specification

## Purpose
CthuTool provides an Astro Starlight documentation site under `apps/docs` as the primary user and operator documentation surface for homelab deployment, client installation, module usage, operations, architecture, reference material, and OpenSpec capability discovery.
## Requirements
### Requirement: Docs workspace application
The repository SHALL include a first-class documentation site package under `apps/docs`.

#### Scenario: Docs package is part of the workspace
- **WHEN** the repository workspace packages are inspected
- **THEN** `apps/docs` is present under the existing `apps/*` workspace pattern
- **AND** the package is named `@cthutool/docs`

#### Scenario: Docs package exposes local commands
- **WHEN** the docs package metadata is inspected
- **THEN** it provides commands for local development and static production build

### Requirement: Markdown-first documentation site
The docs application SHALL render CthuTool documentation from Markdown or MDX content through a static documentation-site generator.

#### Scenario: Docs site builds static output
- **WHEN** the docs build command is run
- **THEN** the docs application produces static site output without requiring a backend service

#### Scenario: Docs site provides documentation navigation
- **WHEN** a reader opens the docs site
- **THEN** the site presents sidebar or equivalent navigation for repository overview, applications, Codex plugin docs, browser/auth docs, and capability specs

#### Scenario: Docs site supports search
- **WHEN** the docs site is built with the selected documentation generator
- **THEN** the generated site includes local search or an explicitly documented search integration

### Requirement: Documentation source boundaries
The docs site SHALL distinguish canonical source documentation from curated docs-site pages.

#### Scenario: Runtime source boundaries are visible
- **WHEN** architecture or repository map docs mention observability, browser SDK, or GitOps resources
- **THEN** they identify the source directories and package README files that own implementation details

### Requirement: OpenSpec capability browsing
The docs site SHALL expose current OpenSpec capability specs as a browsable documentation section.

#### Scenario: Capability specs are discoverable
- **WHEN** a reader navigates the docs site
- **THEN** OpenSpec capabilities are grouped under a capability-specs or equivalent section

#### Scenario: OpenSpec remains authoritative
- **WHEN** a capability spec is shown or linked from the docs site
- **THEN** `openspec/specs/<capability>/spec.md` remains the authoritative source for archived requirements

### Requirement: Workspace validation integration
The docs site SHALL have focused validation commands and MUST integrate with the monorepo build workflow once the package exists.

#### Scenario: Focused docs validation runs
- **WHEN** `pnpm --filter @cthutool/docs build` is run
- **THEN** the docs site build validates the documentation application

#### Scenario: Root build can include docs
- **WHEN** `pnpm run build` is run after docs integration
- **THEN** Turborepo can include the docs package build without requiring duplicate root scripts

### Requirement: User-facing documentation journeys
The docs site SHALL organize its primary documentation around user and operator journeys before repository implementation structure.

#### Scenario: Reader starts from the docs home page
- **WHEN** a reader opens the docs site home page
- **THEN** the page presents a modern, responsive entry experience with a first-viewport hero, primary calls to action, and links for homelab deployment, client installation, module usage, operations, architecture, and reference material
- **AND** the first viewport includes a preview of the shortest documented deployment or CLI verification path
- **AND** the page provides visible continuation into the next documentation section on desktop and mobile viewports

#### Scenario: Reader uses the sidebar navigation
- **WHEN** a reader inspects the primary docs navigation outside the home page landing experience
- **THEN** the navigation includes sections for Start, Homelab Deployment, Client Installation, Modules, Operations, Architecture, and Reference

### Requirement: Homelab deployment documentation
The docs site SHALL document Kubernetes/GitOps as the official user-facing deployment path for CthuTool server-side services on a homelab machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies Kubernetes or k3s prerequisites, ArgoCD prerequisites, GitOps namespace and Application resources, backend image delivery, Kubernetes service configuration, liveness and readiness health checks, metrics scraping, upgrade flow, and troubleshooting entry points

#### Scenario: Reader reviews GitOps observability behavior
- **WHEN** a reader follows deployment, operations, or reference docs for observability
- **THEN** the documentation identifies the GitOps-managed observability namespace, ArgoCD Applications, Prometheus metrics scrape path, Loki log collection path, Tempo trace storage path, and OpenTelemetry Collector ingestion path

### Requirement: Client installation documentation
The docs site SHALL document how users install, update, and remove CthuTool client tools on client computers.

#### Scenario: Reader installs CLI tooling
- **WHEN** a reader opens CLI installation documentation
- **THEN** the documentation explains target-machine prerequisites, public raw installer usage, committed bundle runtime behavior, remote install mode, local checkout install mode, and supported override environment variables

#### Scenario: Reader manages installed CLI tooling
- **WHEN** a reader needs to update CLI tooling
- **THEN** the documentation presents `chc update` as the primary update command
- **AND** it identifies `chc self-update` as a backwards-compatible alias

### Requirement: Module usage documentation
The docs site SHALL provide module-oriented usage documentation for major CthuTool product areas.

#### Scenario: Reader chooses CLI module
- **WHEN** a reader opens CLI module documentation
- **THEN** the documentation reflects the current install/update/runtime model and links to command reference and package-local development sources

### Requirement: Architecture documentation with OpenSpec references
The docs site SHALL explain the implementation architecture while preserving OpenSpec specs as the authoritative requirements source.

#### Scenario: Reader reviews system architecture
- **WHEN** a reader opens the architecture overview or topology pages
- **THEN** the documentation explains the Kubernetes backend, GitOps rollout flow, observability stack, public browser API, browser client SDK, desktop client, CLI tool, browser runtime, and shared packages at a high level

#### Scenario: Reader reviews runtime placement
- **WHEN** a reader opens runtime placement documentation
- **THEN** the documentation distinguishes Kubernetes services, GitOps desired state, observability stack components, client computer runtimes, third-party browser SDK consumers, and repository development source

#### Scenario: Reader needs normative requirements
- **WHEN** an architecture or module page discusses capability requirements
- **THEN** the page links to the relevant `openspec/specs/<capability>/spec.md` source instead of duplicating the full normative requirements

### Requirement: OpenSpec capability index synchronization
The docs site SHALL keep the browsable OpenSpec capability index aligned with current specs under `openspec/specs/`.

#### Scenario: Observability specs exist
- **WHEN** observability-related specs are present under `openspec/specs/`
- **THEN** the docs capability index includes those specs
- **AND** operations or reference pages link to the relevant observability requirement sources

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

### Requirement: Local development runtime documentation
The docs site SHALL keep local runtime commands separate from user-facing homelab deployment instructions.

#### Scenario: Developer needs local backend startup
- **WHEN** a developer looks for local backend startup commands
- **THEN** the documentation routes them to package README or development/reference material
- **AND** the documentation labels the commands as local development or debugging

#### Scenario: User follows quick start
- **WHEN** a user follows the docs-site Quick Start for homelab deployment
- **THEN** the first server-side deployment path uses Kubernetes/GitOps concepts rather than local `pnpm` service startup

#### Scenario: Reader compares deployment and development paths
- **WHEN** a reader opens deployment overview or source-boundary documentation
- **THEN** the documentation distinguishes official homelab deployment from local package development commands

### Requirement: Observability operations documentation
The docs site SHALL document the operator-facing observability path for Kubernetes-managed CthuTool services.

#### Scenario: Operator checks backend health and metrics
- **WHEN** an operator opens observability or health operations docs
- **THEN** the docs distinguish `/health` liveness from `/health/ready` readiness
- **AND** they identify `/metrics` as the Prometheus scrape endpoint rather than a Kubernetes probe

#### Scenario: Operator reviews telemetry flow
- **WHEN** an operator reviews observability docs
- **THEN** the docs describe backend structured logs to Loki, Prometheus metrics, OTLP trace export through the OpenTelemetry Collector, and Tempo trace storage

#### Scenario: Operator reviews observability safety
- **WHEN** observability docs describe metrics, logs, or traces
- **THEN** the docs state that sensitive browser state and high-cardinality values must not become metric labels or log labels

### Requirement: Browser public API reference documentation
The docs site SHALL document the trusted public browser session API and its safety boundaries.

#### Scenario: Reader finds session endpoints
- **WHEN** a reader opens backend API reference documentation
- **THEN** the docs list session create, run-actions, and close endpoints
- **AND** they explain that the backend stores only routing metadata while desktop owns browser state

#### Scenario: Reader understands browser API limitations
- **WHEN** public browser API docs describe supported actions
- **THEN** they state that the API supports a bounded Playwright-like action DSL and not arbitrary Playwright script execution
- **AND** they state that sensitive browser state is not returned

### Requirement: Browser client SDK documentation
The docs site SHALL document `@cthutool/browser-client` for third-party applications using the backend public browser API.

#### Scenario: Reader uses the SDK
- **WHEN** a reader opens browser client SDK docs
- **THEN** the docs include install/build context, a minimal `CthuBrowserClient` example, session lifecycle, supported page methods, and limitations

### Requirement: CLI installer mode documentation
The docs site SHALL document CLI installer mode selection for user and development install paths.

#### Scenario: Reader compares remote and local mode
- **WHEN** a reader reviews CLI installation docs
- **THEN** the documentation explains that raw/stdin installer usage selects remote mode and checkout script execution selects local mode by default
- **AND** it documents `CHC_INSTALL_MODE=remote` as the way to restore the global command to the managed checkout after local development
