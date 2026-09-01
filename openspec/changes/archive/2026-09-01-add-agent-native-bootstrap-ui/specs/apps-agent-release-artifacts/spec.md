# apps-agent-release-artifacts Specification

## MODIFIED Requirements

### Requirement: Self-contained UI-free Agent bundle

Each supported self-use release target SHALL produce an archive containing the native tray, native setup executable, pinned Node.js runtime, headless Agent, licenses, and required runtime dependencies, and SHALL NOT contain the deployed Web application, a WebView framework, or a local HTML/JavaScript/CSS application runtime.

#### Scenario: Bundle runs on a clean supported host

- **WHEN** a self-use archive is extracted on a supported host without a system Node.js installation and without user deployment configuration
- **THEN** the bundled tray starts in SetupRequired state and can launch the native setup executable without entering an Agent crash loop

#### Scenario: Configured bundle runs on a clean supported host

- **WHEN** a valid user deployment configuration exists before startup
- **THEN** the bundled tray starts the bundled Agent, derives the single self-use environment, and completes local readiness or reports bounded Backend offline state

#### Scenario: Bundle inventory is inspected

- **WHEN** CI validates archive contents
- **THEN** the native tray, native setup executable, and required compiled UI resources are present, while the deployed Web application, Electron, WebView framework, and local HTML/JavaScript/CSS application bundle are absent

### Requirement: Trusted non-secret environment catalog

The self-use release SHALL NOT require a deployment URL catalog inside immutable version contents; it SHALL include only non-secret runtime metadata and native setup resources, while explicit development catalogs remain outside the self-use archive path.

#### Scenario: Catalog is accepted

- **WHEN** a self-use archive and layout metadata are valid and no deployment URL catalog is required
- **THEN** the Agent and tray may start in SetupRequired or load the user-scoped self-use Origin without selecting packaged environments

#### Scenario: Catalog is invalid or tampered

- **WHEN** a development-only catalog path is present but fails schema, identifier uniqueness, or endpoint validation
- **THEN** activation fails before that catalog can influence a browser launch or backend connection

#### Scenario: Archive is inspected for secrets

- **WHEN** release inventory and fixtures are checked
- **THEN** no per-environment Agent secret, operator session credential, or required deployment URL catalog is present in immutable version contents

#### Scenario: Self-use archive is inspected

- **WHEN** release inventory checks inspect immutable version contents
- **THEN** no deployed Web/Backend URL catalog, Agent Secret, operator credential, or session credential is required or present

#### Scenario: User configuration is loaded

- **WHEN** the installed self-use Agent starts
- **THEN** it reads the user-scoped deployment Origin from mutable storage rather than an archive catalog or static credential

### Requirement: Versioned release manifest

The self-use manifest SHALL describe compatible platform archives, Agent/backend and bridge protocol compatibility, URL, byte size, SHA-256 digest, provenance, and layout metadata without requiring a catalog schema/digest binding.

#### Scenario: CLI selects an archive

- **WHEN** a consumer provides a supported platform and architecture
- **THEN** the manifest supplies enough metadata to select and validate the native tray, setup executable, and Agent archive without downloading a deployment catalog

#### Scenario: Platform is unsupported

- **WHEN** no manifest entry matches the current platform and architecture
- **THEN** consumers can return an unsupported-target error without downloading another target

### Requirement: Versioned installation layout

The bundle contract SHALL separate immutable version contents from mutable user configuration and support atomic active-version selection without replacing the native setup configuration.

#### Scenario: New version is staged

- **WHEN** a consumer extracts and validates a new version
- **THEN** files are placed in a temporary version directory and become `versions/<version>` only after complete validation

#### Scenario: Active version changes

- **WHEN** startup smoke checks for the staged version pass
- **THEN** the active pointer switches atomically while deployment Origin, Agent identity, profiles, logs, browser settings, and ignored legacy Secret files remain outside version directories

#### Scenario: Activation fails

- **WHEN** the new version fails layout, native setup inventory, or readiness validation
- **THEN** the previous active version remains or is restored and mutable user configuration is not deleted

### Requirement: Cross-platform release validation

CI SHALL validate every supported platform/architecture entry through build, archive inventory, native setup smoke, integrity, and tray-Agent startup/shutdown checks before a self-use manifest is published.

#### Scenario: Platform matrix succeeds

- **WHEN** all target jobs build a candidate self-use release
- **THEN** each archive passes native setup asset construction, configuration-state smoke, inventory, digest, readiness, bridge, and coordinated-shutdown checks

#### Scenario: One target fails validation

- **WHEN** a supported target fails native UI, inventory, integrity, setup-state, or Agent smoke validation
- **THEN** the aggregate self-use manifest is not published
