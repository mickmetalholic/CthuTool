## Context

The new local product is composed of a native tray executable, a Node.js Agent, a trusted environment catalog, and browser-control dependencies. The user interface is the independently deployed Web application and is not served by the Agent. The CLI needs a deterministic way to select, verify, install, activate, and roll back the local composition without accidentally reintroducing Electron or duplicated Web assets.

Release artifacts can control local browsers and determine which public backend/Web origins are trusted, so integrity, provenance, and atomic updates are product requirements.

## Goals / Non-Goals

**Goals:**

- Produce self-contained, versioned bundles for the supported OS/architecture matrix.
- Ship and verify a release-controlled environment catalog containing exact Web/backend origins but no secrets.
- Publish a signed machine-readable manifest and verify bundle composition in CI.
- Define an install layout that permits atomic activation and rollback.

**Non-Goals:**

- Packaging or serving the deployed Web application.
- Embedding environment Agent/operator secrets in release artifacts.
- Implementing CLI download/install commands, a privileged installer, or automatic background updates in this change.

## Decisions

### Bundle runtime code and a non-secret environment catalog

Each archive contains the native tray, a pinned platform Node.js runtime, compiled Agent application, signed/release-bound environment catalog, licenses, and dependencies required for host-Chrome control. It contains no local settings application or Web assets. Users do not need a separately installed Node.js version.

The catalog defines stable environment IDs, display labels, exact deployed Web origins, same-origin Agent-console URLs, backend HTTPS/WSS endpoints, and local namespace identifiers. Per-environment Agent secrets and any operator session material live only in mutable user/backend configuration outside the version directory.

### Publish an immutable manifest per release version

The manifest schema includes release version, schema version, minimum CLI version, Agent/backend and local-bridge protocol compatibility, environment-catalog schema/digest, platform, architecture, archive URL, byte size, SHA-256 digest, signature reference, and entry-point/layout version. Manifests and archives are immutable; a small channel pointer may reference a versioned manifest.

The manifest is signed independently of transport TLS. The CLI trusts a pinned release public key and verifies both manifest and archive digest before extraction. The catalog must be covered by the archive digest and must match manifest metadata.

### Use version directories plus an atomic active pointer

Installation places verified contents in `versions/<version>` under a user-scoped Agent root. An atomic platform adapter switches an `active` link/pointer only after validation and smoke checks. The previous version is retained for bounded rollback; mutable environment selection, secrets, profiles, and logs live outside version directories.

### Separate validation artifacts from releasable artifacts

Pull requests may build unsigned bundles, but filenames and metadata mark them non-releasable and they are never referenced by production channel manifests. Production publishing requires platform signing, macOS notarization/stapling, manifest signing, and verification on a clean runner.

### Start with macOS and Windows support

Build the architectures supported by current project/release infrastructure, finalized during implementation. Linux packaging remains a follow-up rather than silently publishing an untested tray experience.

## Risks / Trade-offs

- [Bundles are larger because Node.js is included] -> Accept size for deterministic runtime behavior and publish compressed per-platform archives.
- [Catalog points to the wrong public environment] -> Cover exact origins/endpoints with signed release metadata and validate schema/digest before activation.
- [Signing credentials are unavailable in forks/PRs] -> Run composition and smoke tests unsigned, but gate production publication on protected secrets.
- [Partially installed versions break startup] -> Extract to a temporary version directory, verify, rename atomically, then switch the active pointer.
- [Browser or build dependencies reintroduce desktop UI] -> Assert archive inventory and dependency graphs contain no Electron, WebView, or Web application assets.

## Migration Plan

1. Define and test the bundle layout, environment-catalog schema, and release-manifest schema with local unsigned fixtures.
2. Add platform matrix builds and clean-machine startup, catalog-load, bridge-readiness, and shutdown smoke tests.
3. Add checksums, manifest signing, platform signing, and notarization gates.
4. Publish versioned artifacts without changing existing Electron distribution.
5. Let the CLI lifecycle change consume the immutable contract; roll back a bad release by moving the channel pointer to a prior signed manifest.

## Resolved During Implementation

- The initial matrix is macOS arm64, macOS x64, and Windows x64, encoded in `release/agent/supported-targets.json` and checked against the runner architecture before every build.
- Immutable versions are GitHub Releases under `agent-v<version>`. The protected release workflow owns signed mutable `agent-stable` and `agent-beta` channel-pointer assets and verifies a prior immutable release before rollback.
