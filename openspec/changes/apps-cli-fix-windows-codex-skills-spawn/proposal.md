## Why

On Windows, `chc codex skills` fails before it can list installed skills because the backend passes `npx.cmd` to Node's `execFile`, which raises `spawn EINVAL`. The same failure affects the read-only JSON inventory and any skill lifecycle action that starts the pinned backend.

## What Changes

- Run the pinned `skills@1.5.19` CLI through npm's JavaScript `npx-cli.js` entrypoint with the current Node executable on Windows, keeping arguments separate from a shell.
- Keep the existing `npx` invocation on other platforms and preserve the pinned version, Codex scope, environment, and output/error handling.
- Exercise the Windows process path in the CLI integration tests and refresh the committed CLI bundle.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-codex-skill-management`: Require the pinned backend to launch successfully on Windows without executing a `.cmd` shim through `execFile`.

## Impact

- `apps/cli/src/domain/codex-skills-backend.ts`, the CLI integration test, and the committed `apps/cli/dist/index.js` bundle.
- No manifest schema, dependency, skill installation policy, generated OpenSpec adapter, or protected business-plugin change.
