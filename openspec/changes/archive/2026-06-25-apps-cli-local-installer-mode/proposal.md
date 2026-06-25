## Why

Developers currently need a separate `npm link` step to make the globally available `chc` command point at their active checkout. The same installer script can support both personal remote installation and local development installation by detecting how it was invoked.

## What Changes

- Teach `scripts/install-chc.sh` to run in an automatic install mode by default:
  - Public raw `curl ... | bash` usage keeps using the managed checkout at `~/.cthutool/source/CthuTool`.
  - Local file execution uses the repository containing the script as the install source.
- Add explicit install-mode overrides so users can force remote managed installation or local checkout installation when auto-detection is not desired.
- Keep committed bundle verification and `npm install -g --ignore-scripts` behavior for both modes.
- Document local development installation through the installer plus the CLI watch build command.
- Document the remote-mode restore path for returning `chc` to the managed checkout after local development.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-self-installation`: Installer source selection changes so local script execution can install from the current checkout while public raw execution continues to install from the managed checkout.

## Impact

- Affects `scripts/install-chc.sh`, installer tests or shell-script coverage, root and CLI README installation guidance, and potentially CLI lifecycle status/update documentation where source directory semantics are described.
- Does not change the `chc` command name, root package `bin` contract, committed bundle requirement, Node 24 requirement, or default public GitHub installer behavior.
