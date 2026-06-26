## Context

The current installer script:

- requires `git`, Node.js 24.x, and `npm`
- uses committed `apps/cli/dist/index.js`
- does not require `pnpm` or `bun` on target machines
- supports `CHC_INSTALL_MODE=auto|local|remote`
- chooses remote mode for raw/stdin execution and local mode for checkout script execution

The CLI exposes `chc update`, `chc status`, `chc version`, and `chc self-update` as a backwards-compatible alias.

## Decisions

### Keep user install docs concise but accurate

The client install page should include the public raw installer command, explain target prerequisites, and document mode overrides. Detailed development notes can remain in `apps/cli/README.md`.

### Prefer current command names

Docs should show `chc update` as the primary update command. `chc self-update` should be listed as an alias for old users and scripts.

### Preserve package README boundary

Package-local command authoring and test details remain in `apps/cli/README.md`; docs site contains user installation and command usage.

## Risks / Trade-offs

- Full installer environment matrix can get noisy; docs should show the common remote path first and then the local checkout path.
- Some readers may still have old `self-update` scripts; keeping the alias documented avoids unnecessary breakage.
