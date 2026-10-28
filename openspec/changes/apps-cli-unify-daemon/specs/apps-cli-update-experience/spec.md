## ADDED Requirements

### Requirement: Owned daemon update coordination
An actual chc source update SHALL inspect whether the authoritative daemon belongs to the exact installation being updated, finish safety and target-payload preflight before disruption, and coordinate its shutdown and subsequent restart. Check-only, blocked, and no-op updates SHALL NOT stop or restart the daemon.

#### Scenario: Running owned daemon is updated
- **WHEN** preflight confirms an available safe CLI payload for the installation owning the running daemon
- **THEN** the update coordinates shutdown before mutating that runtime's files and restores running state using the verified updated entrypoint and owned service registration

#### Scenario: Daemon was stopped
- **WHEN** the installation is updated while its daemon is stopped
- **THEN** the update leaves it stopped and preserves user data and configuration

#### Scenario: Another installation owns the daemon
- **WHEN** the selected update would touch a runtime or registration owned by a different installation
- **THEN** the update rejects the conflict before mutating files or controlling the other daemon

#### Scenario: Update is check-only or unchanged
- **WHEN** update is a read-only check, blocked, or already current
- **THEN** daemon state and service registration remain unchanged

### Requirement: Daemon-aware update failure reporting
Update failure SHALL preserve browser data and configuration, report the failed update/restart phase and resulting daemon state, and attempt restoration only through an available verified entrypoint. It SHALL NOT reset/stash user checkouts, claim standalone Agent bundle rollback, or guarantee whole-CLI rollback when no such versioned installation mechanism exists.

#### Scenario: Update fails after daemon shutdown
- **WHEN** an apply step fails after an owned daemon was stopped
- **THEN** the command attempts restoration if the current entrypoint/dependency payload remains verifiable
- **AND** it reports whether the daemon was restored or remains stopped with an actionable recovery command

#### Scenario: Updated daemon cannot start
- **WHEN** the new payload fails bounded local readiness
- **THEN** update returns failure with source/build identity and recovery guidance, preserves Profiles and configuration, and does not silently reset the checkout or advertise a successful rollback
