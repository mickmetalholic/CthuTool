## ADDED Requirements

### Requirement: App shell runtime behavior is covered
The app-shell package SHALL include runtime tests for navigation and runtime contract behavior used by root-managed applications.

#### Scenario: Navigation contracts are covered
- **WHEN** app-shell tests inspect navigation definitions
- **THEN** they verify stable ids, labels, ordering, and route metadata expected by consumers
- **AND** they catch accidental removal of required navigation entries

#### Scenario: Runtime factories are covered
- **WHEN** app-shell tests exercise runtime creation
- **THEN** they verify web and desktop runtime behavior through public exports
- **AND** type-only contracts remain covered by `typecheck`

### Requirement: Shared UI component behavior is covered
The UI package SHALL include component behavior tests beyond utility smoke coverage.

#### Scenario: UI components expose expected interactions
- **WHEN** UI component tests render shared components
- **THEN** they verify accessible roles, event behavior, disabled states, and class composition
- **AND** they do not rely only on snapshot output

### Requirement: Shared frontend package coverage is evaluated per package
App-shell and UI coverage gate decisions SHALL be made independently based on each package's baseline and test quality.

#### Scenario: Package baselines are reviewed separately
- **WHEN** coverage baselines are recorded
- **THEN** app-shell and UI each receive an explicit visibility-only or threshold-gated decision
- **AND** any threshold values are package-local and conservative
