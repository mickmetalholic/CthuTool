## MODIFIED Requirements

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

## ADDED Requirements

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
