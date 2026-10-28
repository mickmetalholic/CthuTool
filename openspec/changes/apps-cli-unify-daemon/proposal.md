## Why

Local browser execution already runs in a reusable Node.js Agent runtime, but users must install and operate a separate Rust tray, native setup program, Agent release bundle, and Web-to-loopback bridge. Consolidating these boundaries into `chc daemon` provides one local installation and management interface while preserving Backend-mediated browser execution and making its existing SDK consumable by other repositories.

## What Changes

- **BREAKING**: Replace the public `chc agent` command family with `chc daemon`; remove native settings, environment selection, Web-console launch, and independent Agent install/update/uninstall commands. Provide terminal setup/configuration, foreground/background execution, status, diagnostics, logs, Profile management, and user-service registration.
- Run the existing Node browser runtime from the CLI distribution. Reuse host Chrome with daemon-owned Profiles, the Backend WSS connection, controlled browser actions, instance locks, and graceful cleanup. Keep remote `agent.*` wire names and browser-session APIs compatible.
- Support macOS, Windows, and Linux in the first release. Use current-user LaunchAgents, Windows scheduled tasks, and systemd user services respectively; retain foreground and unmanaged background operation where service registration is unavailable.
- **BREAKING**: Remove `apps/agent-tray`, `apps/agent-setup`, the standalone `apps/agent` application boundary, the local HTTP bridge, `packages/agent-bridge-protocol`, and Web `/agent` plus `/agent/help` and their dedicated security/bootstrap code.
- **BREAKING**: Retire `agent-latest`, the independent Agent bundle/Node/catalog installer, and its bundle-specific automatic rollback. Distribute daemon code and runtime dependencies with `chc`; extend `chc source update` to coordinate owned daemon stop/restart without resetting user checkouts or claiming whole-CLI rollback.
- Preserve existing device identity and user data paths during explicit, identity-checked legacy takeover. Keep old Profile data, logs, and ignored secret files; old tray startup registrations must not compete with the daemon.
- Keep `@cthutool/browser-client` as the lightweight remote SDK. Build and validate a self-contained `.tgz`, retain `private: true`, and distribute independent `browser-client-vX.Y.Z` GitHub Releases for fixed-URL npm/pnpm installation without npm-registry publication or a consumer build.

## Capabilities

### New Capabilities

- `apps-cli-daemon-lifecycle`: Canonical daemon commands, terminal configuration, exact process ownership, local Profile operations, read-only diagnostics, and legacy takeover.
- `apps-cli-daemon-platform-services`: Current-user lifecycle/autostart integration for macOS, Windows, and Linux, with explicit managed versus unmanaged execution and failure policies.
- `packages-browser-client-release`: Independently versioned, prebuilt GitHub Release tarballs and clean external-consumer verification without npm publication.

### Modified Capabilities

- `apps-cli-agent-lifecycle`: Retire the tray-owned `chc agent` lifecycle and separate Agent installation contract in favor of the new daemon capabilities.
- `apps-agent-runtime`: Compose the runtime through the CLI, expand private IPC for typed configuration/Profile operations, and eliminate the HTTP bridge while retaining browser/WSS behavior.
- `apps-agent-environment-routing`: Derive one Backend connection from a CLI-configured Origin, preserve existing data namespaces, and remove Web-origin binding and catalog-driven switching.
- `apps-agent-tray`: Retire all native-tray requirements and transfer lifecycle ownership to CLI/platform services.
- `apps-agent-native-bootstrap-ui`: Retire native setup/UI requirements and transfer configuration to terminal commands.
- `apps-agent-local-bridge`: Retire the loopback HTTP bridge, browser bootstrap tickets, and bearer sessions.
- `apps-agent-release-artifacts`: Retire standalone Agent archives, catalog manifests, and publication/activation requirements.
- `apps-web-agent-console`: Retire the Agent console/help routes and dedicated bridge/security behavior.
- `apps-cli-self-installation`: Include the daemon and required Node dependencies in the existing CLI installation path.
- `apps-cli-distribution-ci`: Track shared daemon inputs and verify the installable CLI and daemon on all three operating systems.
- `apps-cli-update-experience`: Coordinate daemon ownership, stopping, restarting, and failure reporting during actual source updates.
- `packages-browser-client-sdk`: Document direct Release-tarball installation and preserve the existing Backend-bound public SDK surface.

## Impact

- Main implementation areas: `apps/cli`, `packages/agent-runtime`, root packaging/install scripts, CLI bundle/check scripts, service adapters, and CLI CI. `packages/agent-data-migration` remains transitional rather than being deleted with the old runtime entrypoint.
- Removal areas: `apps/agent`, `apps/agent-tray`, `apps/agent-setup`, `packages/agent-release`, `packages/agent-bridge-protocol`, Agent-only release workflows/assets, and `apps/web` Agent route/client/proxy configuration.
- SDK areas: `packages/browser-client`, its independent release workflow, packaged-content validation, external install/import/type tests, and repository-owned SDK documentation.
- Backend browser APIs, private-network authorization, stable Agent IDs, routing generations, browser allowlists, and `@cthutool/browser-client` request semantics remain compatible. New machine-selection APIs, API credentials, arbitrary script execution, user-browser attachment, and new remote management UI are outside this change.
- Update only this change's planning artifacts during proposal. Existing main specs and neighboring changes are not synchronized or archived, and generated skills and the protected business plugin remain outside the implementation scope.
