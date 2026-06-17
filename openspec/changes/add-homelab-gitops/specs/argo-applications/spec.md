## ADDED Requirements

### Requirement: ArgoCD Application CR per deployed app

The `gitops/apps/<app-name>/` directories SHALL each contain an ArgoCD `Application` CR that wires an app repository to a cluster namespace.

#### Scenario: Application CR points to the correct source

- **WHEN** the `pixel-playground` Application CR is inspected
- **THEN** `source.repoURL` is `https://github.com/mickmetalholic/PixelPlayground`
- **AND** `source.path` is `k8s/`
- **AND** `source.targetRevision` is `main`
- **AND** `destination.namespace` is `pixel-playground`

#### Scenario: Auto-sync is enabled

- **WHEN** the Application CR is applied
- **THEN** `syncPolicy.automated.prune` is `true`
- **AND** `syncPolicy.automated.selfHeal` is `true`

#### Scenario: Retry handles transient failures

- **WHEN** the Application CR is applied and the source repo has no valid manifests (e.g., `k8s/` is empty)
- **THEN** ArgoCD retries with exponential backoff (5s → 10s → 20s → 40s → 80s, max 3 minutes)
- **AND** the Application self-recovers without manual intervention once valid manifests are added to the source path

#### Scenario: Application CRs are organized by app name

- **WHEN** a developer lists `gitops/apps/`
- **THEN** each subdirectory corresponds to one deployed application
- **AND** each subdirectory contains an `application.yaml` Application CR
