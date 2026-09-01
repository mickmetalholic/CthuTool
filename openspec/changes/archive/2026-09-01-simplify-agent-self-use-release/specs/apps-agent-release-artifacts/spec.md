## ADDED Requirements

### Requirement: Automated self-use publication

The release system SHALL automatically build every supported Agent target and publish one self-use latest manifest when a relevant commit lands on `main`, without requiring a user-created release tag or protected signing environment.

#### Scenario: Relevant main commit is pushed

- **WHEN** a relevant commit is pushed to `main`
- **THEN** CI builds the complete supported target matrix, validates every artifact, and publishes or updates the `agent-latest` release with a generated semver release version

#### Scenario: Manual rebuild is requested

- **WHEN** an authorized user starts the release workflow manually
- **THEN** CI runs the same self-use build, validation, and latest-release publication path without requiring a tag or signing secret

#### Scenario: A target or publication prerequisite fails

- **WHEN** any supported target, catalog validation, inventory check, smoke check, or manifest preparation fails
- **THEN** CI does not publish a new self-use manifest

#### Scenario: Concurrent runs overlap

- **WHEN** a newer self-use workflow run supersedes an in-progress older run
- **THEN** the older run is cancelled or prevented from publishing a manifest after the newer run, and the latest manifest references one coherent artifact set

## MODIFIED Requirements

### Requirement: Trusted non-secret environment catalog

The self-use release SHALL include a schema-versioned, repository-managed catalog of stable environment IDs, labels, exact deployed Web origins, same-origin Agent-console URLs, backend HTTPS/WSS endpoints, and local namespaces without embedding Agent or operator secrets.

#### Scenario: Catalog is accepted

- **WHEN** the archive catalog and self-use manifest catalog schema/digest match and every origin, same-origin Agent-console URL, and backend endpoint is valid
- **THEN** the Agent and tray may offer those environments for selection

#### Scenario: Catalog is invalid or tampered

- **WHEN** the catalog digest, schema, identifier uniqueness, or endpoint validation fails
- **THEN** activation fails before the catalog can influence a browser launch or backend connection

#### Scenario: Archive is inspected for secrets

- **WHEN** release inventory and fixtures are checked
- **THEN** no per-environment Agent secret or operator session credential is present in immutable version contents

#### Scenario: Self-use archive is inspected

- **WHEN** release inventory checks inspect immutable version contents
- **THEN** the repository-managed deployment catalog contains no Agent Secret, operator credential, or session credential

#### Scenario: User configuration is loaded

- **WHEN** the installed self-use Agent starts
- **THEN** it loads mutable user credentials separately from the immutable non-secret deployment catalog

### Requirement: Versioned release manifest

The self-use release SHALL publish a schema-versioned manifest at the single latest-release endpoint describing compatible platform archives. The latest endpoint MAY be mutable, but every archive referenced by a manifest SHALL use a versioned asset identity so the manifest and archive bytes can be validated as one set.

#### Scenario: CLI selects an archive

- **WHEN** a consumer provides a supported platform and architecture
- **THEN** the entry supplies the self-use schema/release version, minimum CLI version, Agent/backend and bridge protocol compatibility, catalog schema/digest, URL, byte size, SHA-256 digest, and layout version without requiring a detached signature reference

#### Scenario: Manifest is published

- **WHEN** all target archives, checksums, receipts, and catalog assets have passed validation
- **THEN** the publisher uploads or updates the latest manifest only after the assets it references are available

#### Scenario: Platform is unsupported

- **WHEN** no manifest entry matches the current platform and architecture
- **THEN** consumers can return an unsupported-target error without downloading another target

### Requirement: Release integrity and provenance

Self-use manifests SHALL identify unsigned self-use provenance and SHALL require HTTPS artifact URLs, declared sizes, SHA-256 digests, catalog binding, and layout metadata. Platform code signing, notarization, detached archive signatures, and a pinned release public key MUST NOT be prerequisites for self-use publication or activation.

#### Scenario: Self-use manifest is valid

- **WHEN** a consumer fetches a supported self-use manifest over HTTPS and its schema, provenance, compatibility, catalog binding, URL, size, and digest metadata validate
- **THEN** it may download and validate the selected archive

#### Scenario: Manifest signature is valid

- **WHEN** a self-use manifest is otherwise valid without a detached signature or pinned release key
- **THEN** the consumer validates its unsigned self-use provenance, HTTPS URL, declared size, SHA-256 digest, catalog binding, and layout metadata

#### Scenario: Manifest or archive integrity fails

- **WHEN** a declared size, SHA-256 digest, catalog binding, safe-extraction, or layout check fails
- **THEN** the consumer rejects the artifact before activation

#### Scenario: Unsigned macOS or Windows artifact is published

- **WHEN** a supported target completes self-use assembly and smoke validation without platform certificates or notarization
- **THEN** CI may publish the target as self-use and records that platform signing was intentionally not performed

#### Scenario: macOS production artifact is published

- **WHEN** a macOS self-use artifact completes assembly and smoke validation without production signing or notarization
- **THEN** CI may publish it to the self-use release and records that those production gates were intentionally not applied

### Requirement: Unsigned validation isolation

Pull-request workflows MAY produce unsigned validation archives but MUST keep them distinguishable from self-use releases and unreachable from the `agent-latest` manifest.

#### Scenario: Pull request builds an archive

- **WHEN** a pull request workflow builds without protected signing secrets
- **THEN** CI marks the archive validation-only, runs composition and smoke validation, and does not publish it to `agent-latest`

#### Scenario: Self-use publication has no signing material

- **WHEN** a `main` or manual self-use run has no platform or release signing material
- **THEN** the self-use path continues through archive, checksum, manifest, and publication validation rather than failing because signatures are absent

#### Scenario: Production publish lacks signing material

- **WHEN** the self-use publication workflow has no protected signing material
- **THEN** it continues through unsigned archive, checksum, manifest, and publication validation instead of failing closed

### Requirement: Cross-platform release validation

CI SHALL validate every supported platform/architecture entry through build, archive inventory, integrity, catalog, and tray-Agent startup/shutdown smoke tests before a self-use manifest is published.

#### Scenario: Platform matrix succeeds

- **WHEN** all target jobs build a candidate self-use release
- **THEN** each archive passes manifest/catalog schema, inventory, digest, readiness, bridge, and coordinated-shutdown checks and the aggregate is eligible for publication

#### Scenario: One target fails validation

- **WHEN** a supported target fails any required check
- **THEN** the aggregate self-use manifest is not published
