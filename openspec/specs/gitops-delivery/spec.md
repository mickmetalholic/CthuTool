# gitops-delivery Specification

## Purpose
Define GitOps bootstrap, namespace, and ArgoCD Application delivery resources for deployed applications.

## Requirements
### Requirement: Bootstrap directory scaffold exists
The `gitops/bootstrap/` directory SHALL exist as a placeholder for future ArgoCD self-management manifests.

#### Scenario: Bootstrap directory is present
- **WHEN** a developer lists `gitops/bootstrap/`
- **THEN** the directory exists and contains a `.gitkeep` file
- **AND** the directory is ready to accept ArgoCD installation manifests in the future

### Requirement: ArgoCD Application CR per deployed app
The `gitops/apps/<app-name>/` directories SHALL each contain an ArgoCD `Application` CR that wires an app repository to a cluster namespace.

#### Scenario: Application CR points to the correct source
- **WHEN** the `pixel-playground` Application CR is inspected
- **THEN** `source.repoURL` is `https://github.com/mickmetalholic/PixelPlayground`
- **AND** `source.path` is `k8s/`
- **AND** `source.targetRevision` is `main`
- **AND** `destination.namespace` is `pixel-playground`

#### Scenario: cthutool Application CR points to this repository
- **WHEN** the `cthutool` Application CR is inspected
- **THEN** `source.repoURL` is `https://github.com/mickmetalholic/CthuTool`
- **AND** `source.path` is `k8s/`
- **AND** `source.targetRevision` is `main`
- **AND** `destination.namespace` is `cthutool`

#### Scenario: Auto-sync is enabled
- **WHEN** the Application CR is applied
- **THEN** `syncPolicy.automated.prune` is `true`
- **AND** `syncPolicy.automated.selfHeal` is `true`

#### Scenario: Retry handles transient failures
- **WHEN** the Application CR is applied and the source repo has no valid manifests (e.g., `k8s/` is empty)
- **THEN** ArgoCD retries with exponential backoff (5s -> 10s -> 20s -> 40s -> 80s, max 3 minutes)
- **AND** the Application self-recovers without manual intervention once valid manifests are added to the source path

#### Scenario: Application CRs are organized by app name
- **WHEN** a developer lists `gitops/apps/`
- **THEN** each subdirectory corresponds to one deployed application
- **AND** each subdirectory contains an `application.yaml` Application CR

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
