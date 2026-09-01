## Why

`chc status` currently renders installation details as an undifferentiated list, which makes the source identity and installation health harder to scan. Local-linked development checkouts also expose only a short commit hash, so developers cannot quickly tell when that commit was created or what it changed.

## What Changes

- Replace the flat human-readable status list with a compact, grouped presentation for source and installation details.
- Add lightweight terminal decoration and semantic color for the title, installation mode, commit identity, and bundle state while keeping the output understandable without color.
- Report the checked-out commit's committer time and single-line subject when status inspects a local-mode Git checkout.
- Add optional `commitTime` and `commitMessage` fields to the structured status result for local mode without changing the single-value JSON stdout contract.
- Preserve existing `--quiet`, non-TTY, missing-Git-metadata, and bundle-presence behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Extend `chc status` with scannable adaptive human output and local commit metadata.

## Impact

- CLI installation status collection and human rendering under `apps/cli`.
- Unit and integration coverage for local/remote metadata, color adaptation, output decoration, message bounding, and JSON compatibility.
- CLI lifecycle documentation and the committed `apps/cli/dist/index.js` runtime bundle.
- No new runtime dependency or change to update/install mutation behavior.
