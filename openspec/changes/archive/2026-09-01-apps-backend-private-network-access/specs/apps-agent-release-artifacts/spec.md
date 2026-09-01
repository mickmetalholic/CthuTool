## MODIFIED Requirements

### Requirement: Versioned installation layout
The bundle contract SHALL separate immutable version contents from mutable
user data and support atomic active-version selection without requiring a
per-environment Agent-secret data file.

#### Scenario: New version is staged
- **WHEN** a consumer extracts and verifies a version
- **THEN** files are placed in a temporary version directory and become
  `versions/<version>` only after complete validation

#### Scenario: Active version changes
- **WHEN** startup smoke checks for the staged version pass
- **THEN** the active pointer switches atomically while environment selection,
  profiles, and logs remain outside version directories

#### Scenario: Activation fails
- **WHEN** the activated version fails layout, catalog, or readiness validation
- **THEN** the previous active pointer remains or is restored and the failed
  version cannot become authoritative
