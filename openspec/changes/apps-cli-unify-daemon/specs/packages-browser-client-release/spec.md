## Purpose

Define independently versioned browser SDK distribution through prebuilt GitHub Release tarballs so external repositories can install the package without npm-registry publication or local SDK compilation.

## ADDED Requirements

### Requirement: Prebuilt standalone SDK archive
Each browser SDK release SHALL package `@cthutool/browser-client` as `cthutool-browser-client-<version>.tgz` containing its package metadata, declared JavaScript entrypoints, TypeScript declarations, and usage documentation. The installed archive SHALL resolve without the monorepo, workspace links, consumer build hooks, Playwright, Chrome, or the daemon package.

#### Scenario: Clean external repository installs SDK
- **WHEN** npm or pnpm installs a release tarball into an unrelated repository
- **THEN** the declared client entrypoint imports and its public types resolve without building SDK source or accessing the CthuTool checkout

#### Scenario: Package contents are incomplete
- **WHEN** a declared runtime or declaration entrypoint is absent or references a workspace-only dependency
- **THEN** release validation fails before publication

### Requirement: Independent GitHub Release identity
SDK versions SHALL be independent from CLI/daemon releases, with matching package semver, `browser-client-vX.Y.Z` Git tag, GitHub Release identity, and versioned archive name. A published version SHALL identify one source revision and archive digest, and SHALL NOT be silently replaced with different bytes.

#### Scenario: SDK release is requested
- **WHEN** a version tag selects a source revision and its package version matches the tag
- **THEN** the workflow can publish that validated version without creating an Agent/daemon release or requiring a CLI version change

#### Scenario: Tag or existing asset conflicts
- **WHEN** the tag, package version, or already-published archive identity conflicts
- **THEN** publication fails without overwriting the released bytes

### Requirement: No npm registry publication
The SDK SHALL retain `private: true`, and its release workflow SHALL distribute the archive through GitHub Releases without calling npm publish or requiring npm registry credentials.

#### Scenario: Release runs without npm token
- **WHEN** build, package, and external-consumer checks pass with GitHub publication authorization
- **THEN** the workflow can publish the versioned tarball without an npm token

### Requirement: Fixed-URL external consumption
SDK documentation SHALL provide npm and pnpm installation from a fixed-version GitHub Release archive URL and preserve import by `@cthutool/browser-client`. Consumers SHALL be instructed to commit dependency and lockfile changes and select a new version explicitly when upgrading.

#### Scenario: External dependency is recorded
- **WHEN** an external repository installs a documented release URL
- **THEN** the dependency resolves to the SDK package and its fixed release artifact rather than the CthuTool root CLI or a mutable latest URL

### Requirement: Archive-level release validation
SDK publication SHALL require unit/type checks, packaged-file verification, and clean external npm/pnpm installation tests against the exact archive to be published. External smoke tests SHALL verify runtime import, public TypeScript consumption, and a Backend-bound request using a controlled HTTP test server without needing a daemon or browser.

#### Scenario: Archive passes source tests but fails consumer install
- **WHEN** SDK source checks pass but the packaged archive cannot import, typecheck, or call the test Backend correctly
- **THEN** the release is rejected and no successful release artifact is advertised

#### Scenario: Pull request validates distribution
- **WHEN** a pull request changes SDK distribution inputs
- **THEN** it can exercise the same packaging/consumer validation without publishing a GitHub Release
