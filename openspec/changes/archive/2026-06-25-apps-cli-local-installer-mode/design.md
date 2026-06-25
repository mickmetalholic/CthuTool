## Context

The current installer always treats installation as a managed remote checkout flow. Even when a developer runs `scripts/install-chc.sh` from an active local checkout, the script clones or updates `~/.cthutool/source/CthuTool` and globally installs that managed checkout.

That behavior is correct for the public raw installer, but it adds friction for local CLI development. Developers need a separate `npm link` step to point global `chc` at the checkout they are editing, even though the installer already performs the right global package registration command.

## Goals / Non-Goals

**Goals:**

- Preserve public raw installer behavior for `curl -fsSL .../install-chc.sh | bash`.
- Make local file execution install the repository containing `scripts/install-chc.sh`.
- Keep install behavior explicit and recoverable with mode overrides.
- Preserve committed bundle verification before global installation.
- Preserve target-machine prerequisites: `git`, Node 24, and `npm`; no `pnpm` or `bun` for install/update.
- Document the development loop: local install through the script plus a CLI dist watch build.

**Non-Goals:**

- Publish the CLI to npm.
- Change the root package `bin` entry or the `chc` executable name.
- Run TypeScript directly in development.
- Remove the need to rebuild `apps/cli/dist/index.js` after CLI source edits.
- Change `chc update` behavior unless it is explicitly extended by a future change.

## Decisions

- Use an `auto` install mode by default.
  - Rationale: the command users already type can do the expected thing in both contexts: public raw usage installs from the managed checkout, while local script usage installs from the local checkout.
  - Alternative considered: add a separate `--local` flag only. That is explicit, but it keeps the common local development flow more cumbersome than necessary.

- Detect local mode from the script file path, not the caller's current working directory.
  - Rationale: a developer may run `/path/to/CthuTool/scripts/install-chc.sh` from any directory. The source should be the repository containing the script, not whichever directory the shell happens to be in.
  - Alternative considered: use `$PWD`. That is fragile and can install the wrong directory.

- Treat stdin execution as remote mode.
  - Rationale: `curl ... | bash` does not provide a reliable repository-local script path, and public install must continue to fetch the selected repository/ref into the managed checkout.
  - Alternative considered: infer a temporary script path. That would be shell-dependent and would not identify a real checkout.

- Add explicit mode override through an environment variable.
  - Rationale: developers need a clear way to force managed remote installation after a local development install, and automation may need deterministic behavior independent of invocation path.
  - Alternative considered: rely only on auto-detection. That is convenient but makes recovery and scripted usage less obvious.

- Keep `npm install -g --ignore-scripts <install-source>` as the global registration mechanism.
  - Rationale: local folder global installation registers the root package bin and points `chc` at the selected checkout, while `--ignore-scripts` avoids target-machine lifecycle builds.
  - Alternative considered: switch local development to `npm link`. That works, but it duplicates the install pathway instead of letting the installer own the behavior.

## Risks / Trade-offs

- [Risk] Local mode can expose stale `apps/cli/dist/index.js` if a developer edits source without running the CLI build or watch command. -> Mitigation: keep bundle verification and document `pnpm --filter @cthutool/cli dev` as the local development companion command.
- [Risk] Auto-detection may surprise users who expected local script execution to refresh the managed checkout. -> Mitigation: provide and document an explicit remote mode override.
- [Risk] Deriving the repository root from the script path may fail if the script is copied outside the repository. -> Mitigation: validate the derived root contains the expected root `package.json` and CLI bundle path before installing.
- [Risk] A local install points global `chc` at a mutable development checkout. -> Mitigation: document remote mode as the recovery path for returning to the managed source checkout.
