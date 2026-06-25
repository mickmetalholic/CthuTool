## ADDED Requirements

### Requirement: CLI dist pre-commit refresh
The root engineering configuration SHALL refresh and stage the committed CLI runtime bundle during pre-commit when staged files can affect `apps/cli/dist/index.js`.

#### Scenario: CLI source commit refreshes dist
- **WHEN** a developer attempts to commit staged changes under `apps/cli/src`
- **THEN** the pre-commit flow runs the CLI build
- **AND** it stages `apps/cli/dist/index.js`
- **AND** it verifies the committed CLI bundle is current before allowing the commit to proceed

#### Scenario: CLI build input commit refreshes dist
- **WHEN** a developer attempts to commit staged changes to CLI bundle-affecting metadata such as `apps/cli/package.json`, root package manager metadata, or CLI build configuration
- **THEN** the pre-commit flow runs the CLI build
- **AND** it stages `apps/cli/dist/index.js`
- **AND** it verifies the committed CLI bundle is current before allowing the commit to proceed

#### Scenario: Unrelated commit skips CLI build
- **WHEN** a developer attempts to commit staged changes that cannot affect the CLI runtime bundle
- **THEN** the pre-commit flow does not run the CLI build only for the CLI dist safeguard

#### Scenario: Bundle refresh failure blocks commit
- **WHEN** the CLI build, generated-bundle staging, or bundle freshness check fails during pre-commit
- **THEN** the commit is blocked
- **AND** the developer receives a clear diagnostic describing the failed step

#### Scenario: Generated dist is not formatted as source
- **WHEN** the pre-commit flow stages `apps/cli/dist/index.js`
- **THEN** generated bundle staging does not cause source-formatting hooks to fail because the generated bundle is ignored by the source formatter
