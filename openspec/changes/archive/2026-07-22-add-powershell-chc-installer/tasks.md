## 1. PowerShell Installer

- [x] 1.1 Add a Windows PowerShell 5.1/PowerShell 7 installer with required-command and Node 24 validation plus local, remote, and automatic source selection.
- [x] 1.2 Mirror the managed-checkout dirty-state, target-bundle, branch fast-forward, and exact-checkout safety behavior from the Bash installer.
- [x] 1.3 Install the root package globally with lifecycle scripts disabled and enable PowerShell completion through the existing CLI lifecycle command.

## 2. Installer Contract Coverage

- [x] 2.1 Add isolated PowerShell contract tests for local mode, raw remote mode, dirty checkout blocking, missing bundle blocking, and Node-version blocking.
- [x] 2.2 Verify the installer parses under PowerShell 5.1 and 7 and that the unchanged Bash installer still passes a syntax check.

## 3. Documentation and Capability Contracts

- [x] 3.1 Document public, local, override, restore, and completion behavior in the root README, CLI README, and docs site.
- [x] 3.2 Add delta requirements for native PowerShell installation and Windows CLI documentation in the existing area-prefixed capabilities.
- [x] 3.3 Confirm generated `.claude`, `.codex`, and `.cursor` adapter files remain unchanged.

## 4. Validation

- [x] 4.1 Run the focused PowerShell installer contract tests, docs build, full workspace lint, and whitespace validation.
- [x] 4.2 Run strict OpenSpec validation for the completed change and its affected main specifications.
