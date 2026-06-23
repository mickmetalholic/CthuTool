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

#### Scenario: Existing docs remain source controlled
- **WHEN** package README files, root docs, and OpenSpec specs are represented in the docs site
- **THEN** the docs site identifies or preserves their source file locations
- **AND** it does not require moving normative OpenSpec requirements out of `openspec/specs/`

#### Scenario: Duplication is controlled
- **WHEN** a docs-site page summarizes an existing README or spec
- **THEN** the page links back to the source document or documents the source boundary

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
- **THEN** the page presents entry points for homelab deployment, client installation, module usage, operations, architecture, and reference material

#### Scenario: Reader uses the sidebar navigation
- **WHEN** a reader inspects the primary docs navigation
- **THEN** the navigation includes sections for Start, Homelab Deployment, Client Installation, Modules, Operations, Architecture, and Reference

### Requirement: Homelab deployment documentation
The docs site SHALL document Kubernetes/GitOps as the official user-facing deployment path for CthuTool server-side services on a homelab machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies Kubernetes or k3s prerequisites, ArgoCD prerequisites, GitOps namespace and Application resources, backend image delivery, Kubernetes service configuration, health checks, upgrade flow, and troubleshooting entry points

#### Scenario: Reader identifies runtime placement
- **WHEN** a reader reviews deployment overview material
- **THEN** the documentation explains which components run in the Kubernetes cluster, which components run on client computers, and which repository directories define GitOps or Kubernetes resources

#### Scenario: Reader sees local commands in deployment docs
- **WHEN** a deployment page mentions local checkout commands such as `pnpm --filter @cthutool/backend`
- **THEN** the page identifies them as development or debugging commands
- **AND** it does not present them as the official homelab deployment path

#### Scenario: Reader reviews GitOps rollout behavior
- **WHEN** a reader follows deployment or operations docs for backend rollout
- **THEN** the documentation explains the GitHub Actions image publication, GHCR image tag, `k8s/deployment.yaml` image pin, and ArgoCD reconciliation flow

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

