# apps-cli-dotfiles-notion-credentials Specification

## Purpose

Give bootstrap and direct Notion commands one predictable authentication flow, allowing a user to enter a Token once while keeping credentials outside published configuration and avoiding prompts in machine-readable or unattended execution.

## Requirements

### Requirement: Token resolution is shared and ordered
Bootstrap's post-install authentication and Notion API operations SHALL resolve `NOTION_TOKEN` first, then `~/.cthutool/credentials/notion.json`, then hidden interactive input when permitted. Environment credentials SHALL NOT be persisted automatically. Bare help, auth's local clearing action, notion validate, and dotfiles commands that do not access Notion SHALL NOT require authentication.

#### Scenario: Validating a published snapshot offline
- **WHEN** notion validate runs without a Token or network access
- **THEN** it validates local plan data without entering authentication
- **AND** no prompt or cache write occurs

#### Scenario: Environment overrides cache
- **WHEN** both an environment Token and a cached Token exist
- **THEN** the environment Token is used without modifying the cached credential

#### Scenario: First interactive authentication
- **WHEN** neither environment nor cache provides a Token and input is interactive
- **THEN** the user is prompted with hidden input and the entered Token is validated before caching
- **AND** later bootstrap or Notion operations can reuse that cache

### Requirement: New credentials require verified read access
Newly entered credentials MUST be checked for validity and read access to all three configured data sources before replacing the cache. Authentication errors, missing source permissions, invalid schemas, and transport/rate-limit failures SHALL be distinguished. An environment authentication failure SHALL NOT silently fall back to another identity. Invalid cached credentials SHALL offer at most one replacement prompt only in interactive mode; permission or transport failures SHALL NOT delete the cache or trigger repeated Token prompts.

#### Scenario: Token cannot read hosts
- **WHEN** a newly entered Token is valid but cannot read the configured host source
- **THEN** the command identifies the inaccessible source and explains the required Notion access
- **AND** the previous cache is preserved

#### Scenario: Cached Token expires
- **WHEN** the API explicitly rejects the cached Token during an interactive operation
- **THEN** the user can enter one replacement Token
- **AND** failure or cancellation preserves the previous credential and ends without a prompt loop

### Requirement: Cache is private and excluded from managed configuration
The credential cache SHALL remain outside Git, published snapshots, chezmoi source/target files, and exported diagnostics. Its parent directory and file MUST have current-user-only access: POSIX mode 0700/0600 respectively, or a restricted Windows ACL. Replacing the cache MUST preserve the prior credential on failure and MUST NOT silently fall back to a less private destination.

#### Scenario: Saving a validated Token
- **WHEN** authentication succeeds and the cache can be saved privately
- **THEN** the next operation reads it from the user credential directory
- **AND** generated repository changes contain no credential

#### Scenario: Restricting permissions fails
- **WHEN** the platform cannot establish the required cache permissions
- **THEN** the command reports the save failure without leaving a broadly readable Token file
- **AND** an existing valid cache remains intact

### Requirement: Noninteractive and JSON operations never prompt
Missing or invalid credentials SHALL cause a stable nonzero authentication error when there is no TTY, `--no-interactive` is set, or `--json` is set. JSON operations SHALL honor the shared single-result stdout contract and MUST NOT mix prompts or secret values into output.

#### Scenario: Missing Token in CI
- **WHEN** notion diff runs without a usable Token under `--no-interactive` or without a TTY
- **THEN** it exits with an actionable authentication error instead of waiting for input

#### Scenario: JSON requested in a terminal
- **WHEN** an interactive terminal runs notion diff with `--json` and no credential
- **THEN** it emits the structured authentication error without a prompt

### Requirement: Credentials can be replaced or cleared without disclosure
The CLI SHALL provide one `chc dotfiles notion auth` entry point. With no credential it SHALL prompt for hidden input when interactive; with an existing credential it SHALL offer reuse/validation, replacement, and local cache clearing as interactive actions without separate mode flags. Noninteractive or JSON auth SHALL only validate the currently resolved credential and SHALL NOT change or clear it. Replacement SHALL respect environment priority and preserve the previous cache on failure. The command SHALL NOT accept a plaintext Token argument or echo Tokens into terminal output, JSON, logs, child command lines, or error details. Clearing SHALL affect only the local Notion cache and SHALL NOT revoke a remote integration.

#### Scenario: Replacing a cached credential through auth
- **WHEN** the user runs auth and selects replacement of a cached Token
- **THEN** hidden input and read-permission validation are performed before replacing the cache
- **AND** no separate replacement flag or command is required

#### Scenario: Clearing an unavailable credential
- **WHEN** the user selects cache clearing in auth even if the cached Token is invalid
- **THEN** the local credential is removed without API access or Token input

#### Scenario: Validating auth in automation
- **WHEN** auth is invoked noninteractively with a usable environment or cached Token
- **THEN** it validates the currently resolved credential and returns status without a management menu
- **AND** the cached credential is not replaced or cleared

#### Scenario: An upstream error reflects request details
- **WHEN** an API error or debug record contains credential-bearing information
- **THEN** user-visible output and logs redact the secret
