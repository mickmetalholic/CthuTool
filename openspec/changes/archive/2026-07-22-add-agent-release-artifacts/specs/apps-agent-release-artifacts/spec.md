## ADDED Requirements

### Requirement: Self-contained UI-free Agent bundle
Each supported release target SHALL produce an archive containing the native tray, pinned Node.js runtime, headless Agent, trusted environment catalog, licenses, and required runtime dependencies, and SHALL NOT contain the deployed Web application or another local UI runtime.

#### Scenario: Bundle runs on a clean supported host
- **WHEN** a verified archive is extracted on a supported host without a system Node.js installation
- **THEN** the bundled tray starts the bundled Agent, loads the environment catalog, and completes local readiness

#### Scenario: Bundle inventory is inspected
- **WHEN** CI validates archive contents
- **THEN** required entry points and catalog are present and no Electron runtime, desktop renderer, WebView framework, or local HTML/JavaScript/CSS application bundle is included

### Requirement: Trusted non-secret environment catalog
The release SHALL include a schema-versioned catalog of stable environment IDs, labels, exact deployed Web origins, same-origin Agent-console URLs, backend HTTPS/WSS endpoints, and local namespaces without embedding Agent or operator secrets.

#### Scenario: Catalog is accepted
- **WHEN** the archive and catalog digest/schema match signed manifest metadata and every origin, same-origin Agent-console URL, and backend endpoint is valid
- **THEN** the Agent and tray may offer those environments for selection

#### Scenario: Catalog is invalid or tampered
- **WHEN** the catalog digest, schema, identifier uniqueness, or endpoint validation fails
- **THEN** activation fails before the catalog can influence a browser launch or backend connection

#### Scenario: Archive is inspected for secrets
- **WHEN** release inventory and fixtures are checked
- **THEN** no per-environment Agent secret or operator session credential is present in immutable version contents

### Requirement: Versioned release manifest
Production releases SHALL publish an immutable machine-readable manifest describing compatible platform archives.

#### Scenario: CLI selects an archive
- **WHEN** a consumer provides a supported platform and architecture
- **THEN** the entry supplies schema/release version, minimum CLI version, Agent/backend and bridge protocol compatibility, catalog schema/digest, URL, byte size, SHA-256 digest, signature reference, and layout version

#### Scenario: Platform is unsupported
- **WHEN** no manifest entry matches the current platform and architecture
- **THEN** consumers can return an unsupported-target error without downloading another target

### Requirement: Release integrity and provenance
Production manifests SHALL be signed by a trusted release key and platform binaries SHALL pass required platform signing and notarization gates.

#### Scenario: Manifest signature is valid
- **WHEN** a consumer verifies a production manifest using the pinned public key
- **THEN** it may evaluate archive entries and compatibility metadata

#### Scenario: Manifest or archive integrity fails
- **WHEN** a signature, declared size, digest, catalog binding, or platform-signing check fails
- **THEN** the consumer rejects the artifact before activation

#### Scenario: macOS production artifact is published
- **WHEN** a macOS archive is added to a production manifest
- **THEN** executable signing and notarization verification have succeeded on a clean runner

### Requirement: Unsigned validation isolation
Pull-request workflows MAY produce unsigned validation archives but MUST keep them distinguishable from production releases and unreachable from production channel manifests.

#### Scenario: Pull request builds an archive
- **WHEN** protected signing secrets are unavailable
- **THEN** CI marks the archive non-releasable, runs composition/smoke validation, and does not publish a production manifest entry

#### Scenario: Production publish lacks signing material
- **WHEN** a production release job cannot complete required signing
- **THEN** publication fails closed

### Requirement: Versioned installation layout
The bundle contract SHALL separate immutable version contents from mutable user data and support atomic active-version selection.

#### Scenario: New version is staged
- **WHEN** a consumer extracts and verifies a version
- **THEN** files are placed in a temporary version directory and become `versions/<version>` only after complete validation

#### Scenario: Active version changes
- **WHEN** startup smoke checks for the staged version pass
- **THEN** the active pointer switches atomically while environment selection, secrets, profiles, and logs remain outside version directories

#### Scenario: Activation fails
- **WHEN** the new version fails layout, catalog, or readiness validation
- **THEN** the previous active pointer remains or is restored and the failed version cannot become authoritative

### Requirement: Cross-platform release validation
CI SHALL validate every supported platform/architecture entry through build, archive inventory, integrity, catalog, and tray-Agent startup/shutdown smoke tests.

#### Scenario: Platform matrix succeeds
- **WHEN** all target jobs build a candidate release
- **THEN** each archive passes manifest/catalog schema, inventory, digest, readiness, bridge, and coordinated-shutdown checks

#### Scenario: One target fails validation
- **WHEN** a supported target fails any required check
- **THEN** the aggregate release is not published as production-ready

### Requirement: Compatible manifest evolution
The manifest SHALL be schema-versioned and SHALL allow consumers to fail without modifying an installation when compatibility is unknown.

#### Scenario: CLI is too old
- **WHEN** the manifest minimum CLI version exceeds the running CLI version
- **THEN** the consumer reports the required CLI upgrade and leaves the active Agent unchanged

#### Scenario: Manifest schema is unsupported
- **WHEN** a consumer encounters an unknown required schema version
- **THEN** it rejects the manifest before download or activation
