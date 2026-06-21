## ADDED Requirements

### Requirement: Bootstrap directory scaffold exists

The `gitops/bootstrap/` directory SHALL exist as a placeholder for future ArgoCD self-management manifests.

#### Scenario: Bootstrap directory is present

- **WHEN** a developer lists `gitops/bootstrap/`
- **THEN** the directory exists and contains a `.gitkeep` file
- **AND** the directory is ready to accept ArgoCD installation manifests in the future
