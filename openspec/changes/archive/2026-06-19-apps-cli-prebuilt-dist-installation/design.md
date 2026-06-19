## Context

The current GitHub installer clones the public repository, installs workspace dependencies, builds `@cthutool/cli` with Bun, and then installs the root package globally. That keeps build output out of Git, but it makes every install/update machine carry the development toolchain.

The CLI bin wrapper already loads `apps/cli/dist/index.js`. If that bundle is committed and refreshed with CLI source changes, install and update can become checkout-and-install operations instead of build operations. The same change is a good time to group CLI-owned introspection at the top level: `version`, `status`, and `update`.

## Goals / Non-Goals

**Goals:**

- Make public GitHub installation work without `pnpm` or `bun` on the target machine.
- Keep `chc` runtime behavior unchanged: the root package exposes `apps/cli/bin/chc.mjs`, which loads `apps/cli/dist/index.js`.
- Make install and update use the committed dist bundle and avoid root package lifecycle scripts that would rebuild locally.
- Add clear CLI self-management commands: `chc version`, `chc status`, `chc update`, and `chc --version`.
- Preserve `chc self-update` as a compatibility alias while documenting `chc update` as the preferred command.
- Document release discipline so CLI source changes include the regenerated dist bundle.

**Non-Goals:**

- Publish to npm.
- Add GitHub Release artifacts or binary downloads.
- Remove Bun/pnpm from repository development workflows.
- Add a nested `chc self ...` command group.
- Change the managed checkout location.

## Decisions

- Commit `apps/cli/dist/index.js` as a versioned runtime artifact.
  - Rationale: this removes the target-machine build step while preserving the current bin wrapper and package layout.
  - Alternative considered: continue local build. That is simpler for source consistency but keeps install prerequisites heavier.

- Install with npm lifecycle scripts disabled for the managed checkout.
  - Rationale: the root package has lifecycle hooks such as `prepack` that can trigger a workspace build. The prebuilt route must not invoke those hooks on target machines.
  - Alternative considered: remove or weaken lifecycle hooks globally. That would affect local packaging workflows beyond the installer path.

- Keep the managed checkout flow.
  - Rationale: update still needs a durable Git checkout to fetch/pull refs and reinstall from the repository state.
  - Alternative considered: install directly from a Git URL. That still risks npm lifecycle behavior and gives less control over update diagnostics.

- Use top-level `version`, `status`, and `update` commands instead of a `self` command group.
  - Rationale: this is a personal utility CLI with a small command surface. Top-level lifecycle commands are easier to remember, and domain-specific status remains namespaced as needed, such as `chc codex status`.
  - Alternative considered: `chc self version/status/update`. That is more explicit but adds a grouping layer that does not currently carry enough weight.

- Keep `self-update` as an alias for `update`.
  - Rationale: existing scripts or documentation may already call `chc self-update`.
  - Alternative considered: hard rename. That would simplify the command tree but create avoidable breakage.

- Make `chc --version` a shortcut for `chc version`.
  - Rationale: `--version` is a standard CLI convention and should not require users to remember a subcommand.
  - Alternative considered: support only `chc version`. That is simple but misses common CLI muscle memory.

## Risks / Trade-offs

- [Risk] `dist/index.js` can drift from TypeScript source -> Mitigate by adding tests or release checks that rebuild and assert the committed bundle is current.
- [Risk] The committed bundle increases repository noise -> Mitigate by limiting committed output to the single runtime bundle needed by `chc`.
- [Risk] npm lifecycle scripts may still run if install flags are missed -> Mitigate by centralizing install command construction in the shell installer and self-update manager tests.
- [Risk] A target machine may already have an old managed checkout without dist -> Mitigate by requiring self-update to fail clearly when the committed bundle is missing after checkout.
- [Risk] Top-level `status` could be confused with domain-specific status commands -> Mitigate by documenting it as CLI installation status and keeping domain status commands under their existing namespaces, such as `chc codex status`.
