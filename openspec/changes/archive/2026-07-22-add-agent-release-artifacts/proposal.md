## Why

`chc agent install` cannot be reliable until the service, tray, runtime, and trusted environment catalog have a versioned cross-platform distribution contract. The deployed Web application is released independently, so the local bundle must not carry a second copy of its UI. The current Electron artifact workflow does not describe this smaller self-contained bundle or a machine-verifiable release manifest.

## What Changes

- Build self-contained per-platform Agent bundles containing the native tray, a pinned Node.js runtime, headless Agent code, a release-controlled environment catalog with exact Web Agent-console URLs, and required browser-control dependencies.
- Exclude local HTML/JavaScript/CSS application assets, Electron, and WebView runtimes from Agent bundles.
- Publish a versioned release manifest with platform, architecture, URL, size, checksum, signature, minimum CLI version, and protocol/catalog compatibility metadata.
- Add CI validation for supported macOS and Windows targets, bundle layout, startup/environment-catalog smoke checks, checksum verification, and absence of desktop UI runtimes/assets.
- Define release signing and macOS notarization gates, while allowing clearly marked unsigned artifacts for pull-request validation only.
- Define versioned installation layout and atomic activation/rollback semantics for CLI consumption.

## Capabilities

### New Capabilities

- `apps-agent-release-artifacts`: Cross-platform bundle composition, trusted environment-catalog distribution, manifest/signature contract, CI validation, and versioned activation layout.

### Modified Capabilities

None. Electron packaging remains in place until the final retirement change.

## Impact

- Affects GitHub Actions, release tooling, Rust and Node.js build outputs, code-signing configuration, and artifact storage.
- Establishes the download/verification contract required by `add-cli-agent-lifecycle`.
- Depends on the runtime, environment-routing, local-bridge contract, and native tray changes being buildable together; deployed Web assets remain in the Web release pipeline.
