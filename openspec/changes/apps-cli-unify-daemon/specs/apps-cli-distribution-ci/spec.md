## MODIFIED Requirements

### Requirement: CLI distribution affected inputs include bundle dependencies
The CLI distribution workflow SHALL treat CLI source, shared daemon runtime/protocol/migration dependencies, bundle scripts, package manager metadata, workspace metadata, lockfile, workflow configuration, root TypeScript configuration, dotfiles runtime assets, chezmoi source declarations, and machine bootstrap scripts and lock metadata as distribution inputs. Changes to those inputs SHALL run the committed bundle check and applicable offline asset validation.

#### Scenario: CLI bundle input changes run bundle validation
- **WHEN** a pull request changes `apps/cli/**`, CLI bundle scripts, root package metadata, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the CLI workflow file, or `tsconfig.json`
- **THEN** the `cli-dist` job runs `pnpm run check:cli-dist`

#### Scenario: Dotfiles or bootstrap assets change
- **WHEN** a pull request changes `dotfiles/**`, `.chezmoiroot`, `.chezmoiversion`, either machine bootstrap script, or its runtime lock metadata
- **THEN** the stable `cli-dist` job runs distribution consistency and applicable offline snapshot/asset checks
- **AND** these checks require neither Notion credentials nor host package installation

#### Scenario: Unrelated input changes skip bundle validation
- **WHEN** a pull request changes files that cannot affect the CLI distribution
- **THEN** the `cli-dist` job reports a successful skip
- **AND** it does not install dependencies only for the bundle check

#### Scenario: Shared daemon input changes
- **WHEN** a pull request changes daemon runtime, control/protocol dependencies, retained data-migration logic, or daemon packaging/service-adapter inputs
- **THEN** committed CLI/daemon distribution validation and applicable lifecycle checks run even when apps/cli source did not change

## ADDED Requirements

### Requirement: Three-platform daemon distribution smoke tests
Distribution CI SHALL validate the installable daemon payload and lifecycle on macOS, Windows, and Linux using isolated user data and owned temporary service registrations. It SHALL test packed artifacts outside the checkout without development dependencies and SHALL clean up only its own processes and registrations.

#### Scenario: Platform lifecycle succeeds
- **WHEN** each supported OS installs the packaged CLI in a clean test location
- **THEN** foreground/background readiness, idempotent start, exact stop, offline Backend status, and supported user-service registration pass

#### Scenario: Runtime resource is omitted
- **WHEN** a packed daemon misses an entrypoint, production dependency, declaration of a required resource, or Chrome detection behavior
- **THEN** distribution checks fail rather than resolving that resource from the developer checkout

#### Scenario: Unavailable service manager is tested
- **WHEN** Linux has no usable systemd user session
- **THEN** CI verifies the explicit unavailable-registration result and working unmanaged lifecycle in addition to the managed Linux test environment
