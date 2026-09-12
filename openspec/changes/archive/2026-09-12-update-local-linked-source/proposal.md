## Why

`chc source update` currently refuses to update a local checkout even though the installed command runs directly from that checkout. Users expect the command to fetch and fast-forward its actual source, and the present error suggests a manual workaround for the command's core purpose.

## What Changes

- Allow default `chc source update` and `--check` to target the linked local Git checkout instead of blocking it.
- Preserve tracked changes and divergent branches. Permit unrelated untracked files in the linked local checkout while letting Git reject a merge that would overwrite them.
- Skip global npm reinstallation when the running command already points at the updated local checkout; keep the managed and explicitly selected source behavior intact.
- Update lifecycle documentation, tests, and the affected OpenSpec contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Local-linked update and check behavior, safety, and documentation.
- `apps-cli-update-experience`: Local preflight, source resolution, and update result behavior.
- `apps-docs-site`: Client-facing local-linked update instructions.

## Impact

The CLI self-update manager, its tests, root/CLI/docs-site documentation, committed CLI bundle, and these three existing specs change. Other plugins, agent adapters, and unrelated OpenSpec changes remain untouched.
