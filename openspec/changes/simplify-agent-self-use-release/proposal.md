## Why

The current Desktop/Agent release flow is designed for public distribution: it requires a protected `agent-production` environment, Apple and Windows signing, Ed25519 release signatures, manually created version tags, and stable/beta channel pointers. This is excessive for the intended use case—a single user downloading private, self-use builds—and makes every release depend on credentials and manual release operations.

## What Changes

- **BREAKING** Replace the production release model with one self-use distribution mode: an unsigned, HTTPS-served `agent-latest` release containing the latest build for each supported target.
- **BREAKING** Build and publish automatically from pushes to `main` (with an optional manual workflow dispatch); users no longer need to create or push a release tag.
- **BREAKING** Remove the `agent-production` environment, Apple/Windows signing, notarization, Ed25519 manifest/archive signatures, and stable/beta channel pointers from the self-use path.
- Keep target matrix builds, environment-catalog validation, archive layout checks, clean-host smoke tests, SHA-256 integrity checks, and atomic local activation/rollback.
- **BREAKING** Simplify CLI installation and update to resolve the single latest manifest; remove channel selection and the client-side release-signing-key requirement.
- Prevent concurrent or stale workflow runs from leaving a mixed `agent-latest` release; publish the manifest only after its referenced assets are ready.
- Document the security boundary clearly: this mode protects transport and accidental corruption, but is not an authenticated public distribution channel.

## Capabilities

### New Capabilities

<!-- No new capability; this change simplifies and modifies existing release contracts. -->

### Modified Capabilities

- `apps-agent-release-artifacts`: change production publication from signed, platform-notarized, immutable/channel-based releases to automatically published unsigned self-use artifacts with SHA-256 integrity and a single latest pointer.
- `apps-cli-agent-lifecycle`: change install/update from signed channel resolution to single-latest resolution, while retaining catalog validation, archive integrity checks, smoke validation, atomic activation, and local rollback.

## Impact

- GitHub Actions workflow and bundle action under `.github/workflows/agent-release.yml` and `.github/actions/build-agent-bundle/`.
- Agent release contracts, manifest/publication helpers, and release CLI under `packages/agent-release/`.
- CLI installer, lifecycle service, command flags, and tests under `apps/cli/`.
- Release documentation and environment-catalog ownership.
- GitHub Releases becomes the private/self-use artifact store; no new runtime dependency is required, but the workflow permissions and concurrency policy must be updated.
