## MODIFIED Requirements

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

### Requirement: Documentation source boundaries
The docs site SHALL distinguish canonical source documentation from curated docs-site pages.

#### Scenario: Runtime source boundaries are visible
- **WHEN** architecture or repository map docs mention observability, browser SDK, or GitOps resources
- **THEN** they identify the source directories and package README files that own implementation details
