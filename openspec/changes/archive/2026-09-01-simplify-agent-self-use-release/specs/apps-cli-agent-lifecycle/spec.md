## ADDED Requirements

### Requirement: Single latest self-use release resolution

The CLI SHALL resolve Agent installation and update from the fixed `agent-latest` manifest endpoint and SHALL NOT require channel pointers, channel selection, remote version selection, detached archive signatures, or a pinned release public key.

#### Scenario: Latest manifest is requested

- **WHEN** `chc agent install` or `chc agent update` runs
- **THEN** the CLI fetches the latest self-use manifest from the configured HTTPS `agent-latest` endpoint and selects the current supported target

#### Scenario: Legacy or unsupported release contract is returned

- **WHEN** the fetched manifest is a legacy signed-channel schema or an unknown schema
- **THEN** the CLI rejects it with an actionable unsupported-release error and leaves the active Agent unchanged

#### Scenario: Channel option is supplied

- **WHEN** a user supplies a removed channel-selection option to install or update
- **THEN** the CLI rejects the option and explains that self-use mode has one latest release

## MODIFIED Requirements

### Requirement: Verified user-scoped installation

`chc agent install` SHALL install a compatible self-use Agent release and validated non-secret environment catalog to user-scoped versioned paths without administrator privileges. Verification SHALL cover manifest schema/provenance, compatibility, catalog binding, archive size/SHA-256, safe extraction, and layout; cryptographic release or platform signatures are not required in self-use mode.

#### Scenario: Installation succeeds

- **WHEN** the latest self-use manifest, archive, and catalog have valid metadata/digests and pass compatibility/layout checks
- **THEN** the CLI stages the generated version, switches the active pointer atomically, and reports installed version and paths

#### Scenario: Verification fails

- **WHEN** integrity, catalog endpoint/schema, platform, safe-extraction, or compatibility validation fails
- **THEN** installation stops before activation and preserves the prior active version

### Requirement: Verified Agent update and rollback

`chc agent update` SHALL update only the local Agent from the latest self-use manifest, atomically activate a compatible version/catalog after integrity and health checks, and restore the prior version on failed startup. The update path SHALL not depend on a signed version or channel pointer.

#### Scenario: Update succeeds

- **WHEN** a newer generated self-use version is available and its archive, catalog, compatibility, and readiness checks pass
- **THEN** the CLI stages it, coordinates shutdown, switches, starts it, verifies readiness/catalog, and retains the prior version for bounded rollback

#### Scenario: New version fails readiness

- **WHEN** the activated Agent does not become healthy within the bound
- **THEN** the CLI stops it, restores and restarts the previous version, and reports rollback

#### Scenario: Latest release is unavailable

- **WHEN** the latest manifest cannot be fetched or fails validation
- **THEN** the CLI leaves the active Agent and its local version selection unchanged and reports the failed update

#### Scenario: CLI self-update is intended

- **WHEN** a user runs `chc update`
- **THEN** existing CLI update behavior remains separate from `chc agent update`
