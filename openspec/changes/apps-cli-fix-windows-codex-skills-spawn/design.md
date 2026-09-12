## Context

`runSkillsProcess` uses `execFile` so backend arguments are passed as an array. On Windows, npm exposes `npx.cmd`, which Node cannot start through this API; Node raises `EINVAL` before `skills@1.5.19` runs.

## Decision

On Windows, execute the npm-bundled `node_modules/npm/bin/npx-cli.js` next to `process.execPath` with that Node executable. Pass the existing `--yes`, pinned package, and skill arguments unchanged. Retain the direct `npx` executable on other platforms. This avoids command-shell quoting and preserves the current backend contract.

The internal `CHC_SKILLS_NPX_CLI_PATH` override lets integration tests run a fake JavaScript entrypoint without replacing a system executable or installing a skill. Production uses the entrypoint bundled with the active Node installation.

## Verification

The integration test checks the exact pinned invocation and JSON inventory through the real process runner. A built CLI read-only `codex skills --json` invocation checks the production entrypoint with the installed skills CLI. Unit tests continue to cover backend lifecycle arguments.
