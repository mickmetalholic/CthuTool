## Why

The OpenSpec set still contains several low-signal capability directories, including retired marker specs and small boundary-only specs, and the repository still carries the experimental `scratches/collection-hub` workspace even though it is no longer planned for future use.

This change reduces the live spec surface and removes the obsolete scratch workspace so the repository describes only maintained capabilities.

## What Changes

- **BREAKING**: Remove the experimental `scratches/collection-hub` nested workspace and its server, web, extension, shared library, lockfile, and local agent instructions.
- **BREAKING**: Retire the Collection Hub OpenSpec capabilities rather than preserving specs for a deleted scratch module.
- Remove Collection Hub references from the root README, docs site navigation/content, OpenSpec capability map, and root contract tests.
- Consolidate retired backend browser marker specs into the existing backend browser service/runtime ownership model.
- Consolidate the backend agent state boundary into the backend agent registry spec.
- Consolidate small GitOps delivery specs into one `gitops-delivery` capability while leaving `gitops-observability-stack` separate.
- Consolidate backend image delivery behavior into `apps-backend-image-ci`.
- Consolidate package observability specs into their owning package runtime/protocol specs where the ownership is already clear.
- Fix stale wording in the retired browser automation documentation while removing its standalone capability.

## Capabilities

### New Capabilities

- `gitops-delivery`: GitOps bootstrap, namespace, and ArgoCD Application delivery resources for deployed applications.

### Modified Capabilities

- `apps-backend-browser-service`: Absorb retired backend browser automation and agent-capture marker requirements.
- `apps-backend-agent-registry`: Absorb the generic agent-state exclusion boundary.
- `apps-backend-image-ci`: Absorb backend image publishing and deployment image pinning behavior.
- `packages-agent-protocol`: Absorb protocol observability metadata, compatibility, and redaction semantics.
- `packages-app-shell-runtime`: Absorb app-shell frontend logging and observable status presentation semantics.
- `apps-root-engineering-config`: Remove the special root-workspace guidance for the deleted scratch workspace.
- `collection-hub-workspace`: Remove requirements for the retired scratch workspace.
- `collection-hub-import-api`: Remove requirements for the retired local API.
- `collection-hub-import-extension`: Remove requirements for the retired browser extension.
- `collection-hub-dashboard`: Remove requirements for the retired dashboard.
- `apps-backend-browser-agent-capture`: Remove the standalone retired marker capability after moving its requirement.
- `apps-backend-browser-automation`: Remove the standalone retired marker capability after moving its requirement.
- `apps-backend-agent-state`: Remove the standalone boundary-only capability after moving its requirement.
- `gitops-bootstrap`: Remove the standalone bootstrap capability after moving its requirement.
- `gitops-argo-applications`: Remove the standalone ArgoCD Application capability after moving its requirement.
- `gitops-cluster-namespaces`: Remove the standalone namespace capability after moving its requirement.
- `apps-backend-image-delivery`: Remove the standalone image delivery capability after moving its requirement.
- `packages-agent-protocol-observability`: Remove the standalone protocol observability capability after moving its requirements.
- `packages-app-shell-observability`: Remove the standalone app-shell observability capability after moving its requirements.

## Impact

- Deletes the `scratches/collection-hub/**` source tree and removes references to it from docs and tests.
- Reduces the number of first-level OpenSpec capability directories by deleting retired or absorbed specs.
- Keeps active backend browser workflow specs separate where they still represent meaningful owner boundaries.
- Does not migrate Collection Hub into a maintained app or package.
- Does not change runtime APIs for maintained backend, CLI, desktop, web, or package capabilities.
