## 1. Release Contract

- [x] 1.1 Confirm runtime, environment-routing, local-bridge, and native tray changes build together before defining production archives.
- [x] 1.2 Define the versioned archive layout, immutable/mutable boundary, entry points, licenses, and layout-version fixture.
- [x] 1.3 Define the non-secret environment-catalog schema and exact origin/same-origin Agent-console URL/endpoint validation, and bind its digest/schema to the release manifest.
- [x] 1.4 Define and validate the versioned release manifest, compatibility fields, channel pointer, per-platform entries, and signature/digest fixtures.

## 2. Bundle Assembly

- [x] 2.1 Add reproducible assembly of the native tray, pinned Node.js runtime, compiled Agent, environment catalog, browser dependencies, and licenses.
- [x] 2.2 Add archive inventory checks for required files and explicit absence of Electron, desktop renderer, WebView runtime, and local Web application assets.
- [x] 2.3 Add safe version-directory staging and atomic active-pointer fixtures while keeping environment selection, secrets, profiles, and logs external.
- [x] 2.4 Add clean-host startup, catalog-load, local-bridge readiness, and coordinated-shutdown smoke tests without system Node.js.

## 3. Platform CI

- [x] 3.1 Finalize and encode the initial supported matrix, expected to cover macOS arm64/x64 and Windows x64 subject to runner availability.
- [x] 3.2 Add platform build jobs with Rust/Node.js caches, deterministic inputs, archive naming, checksums, and artifact retention.
- [x] 3.3 Add aggregate validation that blocks production publication when any supported target, catalog, or manifest check fails.
- [x] 3.4 Configure dependency/path filters covering tray, runtime, routing, bridge, protocol, environment catalog, workspace configuration, and release tooling.

## 4. Signing and Publication

- [x] 4.1 Add clearly marked unsigned pull-request artifacts that cannot enter production channel manifests.
- [x] 4.2 Add protected Windows/macOS signing and macOS notarization/stapling verification for production jobs.
- [x] 4.3 Sign immutable production manifests and verify signatures, catalog digest, platform binaries, archive size/digest, and clean-runner startup before publish.
- [x] 4.4 Add immutable version publication and controlled channel-pointer rollback to a previous signed manifest.

## 5. Verification

- [x] 5.1 Test tampered manifest/catalog/archive, unsupported platform, old CLI, unknown schema, partial extraction, and failed activation fixtures.
- [x] 5.2 Run targeted release-script lint/types/tests, Rust checks, workflow validation, archive smoke tests, and `git diff --check`.
- [x] 5.3 Run strict OpenSpec validation for `add-agent-release-artifacts` and document signing requirements and production fail-closed behavior.
- [x] 5.4 Confirm generated agent adapters and unrelated OpenSpec changes remain unchanged.
