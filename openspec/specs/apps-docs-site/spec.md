# apps-docs-site Specification

## Purpose
TBD - created by archiving change apps-docs-site. Update Purpose after archive.
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
