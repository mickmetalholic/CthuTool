# gitops-cluster-namespaces Specification

## Purpose
Define GitOps-managed Kubernetes namespace manifests for deployed applications and namespace labeling conventions.

## Requirements
### Requirement: Namespace for each deployed application

The `gitops/namespaces/` directory SHALL contain a `Namespace` resource for each application deployed to the cluster.

#### Scenario: pixel-playground namespace exists

- **WHEN** the manifests in `gitops/namespaces/` are applied
- **THEN** a namespace named `pixel-playground` is created
- **AND** all PixelPlayground resources are scoped to this namespace

#### Scenario: cthutool namespace exists

- **WHEN** the manifests in `gitops/namespaces/` are applied
- **THEN** a namespace named `cthutool` is created
- **AND** all CthuTool backend resources are scoped to this namespace

#### Scenario: Namespaces are organized by application

- **WHEN** a developer lists `gitops/namespaces/`
- **THEN** each file corresponds to one deployed application
- **AND** file names follow the pattern `<app-name>.yaml`

#### Scenario: Namespace includes Kubernetes recommended labels

- **WHEN** the `pixel-playground` namespace manifest is inspected
- **THEN** it contains the label `app.kubernetes.io/name: pixel-playground`
- **AND** it contains the label `app.kubernetes.io/managed-by: argocd`
