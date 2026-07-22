## REMOVED Requirements

### Requirement: Desktop icon assets
**Reason**: Electron renderer and package icons are no longer published.
**Migration**: Retain or adapt only the native tray and agent release icons required by `apps-agent-tray` and agent artifacts.

### Requirement: Desktop packaging configuration
**Reason**: Electron platform packaging is replaced by self-contained agent bundle construction.
**Migration**: Use `apps-agent-release-artifacts` for supported platform archives, signing, and notarization.

### Requirement: GitHub Actions desktop artifact workflow
**Reason**: The desktop artifact workflow no longer builds a supported deliverable.
**Migration**: Publish and validate tray-plus-agent bundles through the agent release workflow.

### Requirement: Desktop artifact workflow tracks desktop dependency changes
**Reason**: There is no desktop artifact after cutover.
**Migration**: Configure Agent workflow path/dependency filters for tray, runtime, routing, bridge, protocol, environment catalog, and release tooling inputs; Web assets remain in Web workflows.

### Requirement: Desktop validation uses Turbo filtered dependency graph
**Reason**: Desktop-specific filtered validation and packaging are removed.
**Migration**: Validate Node workspace dependencies and native tray/release jobs through the agent artifact graph.

### Requirement: Desktop workflow uses area filename and explicit display name
**Reason**: The desktop workflow file is deleted.
**Migration**: Keep equivalent area naming and explicit display naming on the new agent release workflow.
