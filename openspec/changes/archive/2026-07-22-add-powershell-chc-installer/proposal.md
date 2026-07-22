## Why

Windows users currently need Git Bash, WSL, or a manual npm command to install
the `chc` CLI from CthuTool. A native PowerShell installer makes the documented
install and local-development flow work directly in the standard Windows shell
while preserving the existing managed-checkout safety contract.

## What Changes

- Add a native `scripts/install-chc.ps1` installer compatible with Windows
  PowerShell 5.1 and PowerShell 7.
- Match the Bash installer's local, remote, and automatic source-selection
  behavior, Node 24 guard, committed-bundle validation, safe managed updates,
  and global npm installation contract.
- Enable persistent PowerShell completion by default with the existing
  completion opt-out.
- Add focused PowerShell installer contract tests and document both public and
  local Windows installation paths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Extend the existing installer requirements to
  cover native PowerShell public, local, safety, and completion behavior.
- `apps-docs-site`: Require the CLI installation docs to present the Windows
  PowerShell installer alongside the Bash flow.

## Impact

- Adds `scripts/install-chc.ps1` and a PowerShell-specific contract test suite.
- Updates CLI installation documentation across the root README, CLI README,
  and docs site.
- Updates the existing CLI self-installation and docs-site capability specs.
- Does not change the `chc` runtime bundle, npm package entrypoint, target Node
  version, or Bash installer behavior.
