## Context

`chc` is a monorepo CLI whose global binary is exposed from the root package and whose implementation is built from `apps/cli`. Publishing a private npm package is unnecessary for personal use, and the repository is public, so GitHub can be the distribution source.

The existing global install flow assumes a local checkout. The new flow needs to support a first install from a raw GitHub script URL, keep a reusable source checkout for future builds, and let the installed CLI update itself without requiring users to remember the Git and npm commands.

## Goals / Non-Goals

**Goals:**

- Provide a one-command public GitHub install path.
- Keep a deterministic local source checkout that can be reused by install and update flows.
- Build the CLI before global installation so the Node-backed `chc` bin can run without Bun at command runtime.
- Expose `chc self-update` with JSON/quiet behavior consistent with the shared CLI contract.
- Allow overriding repository URL, Git ref, and install directory.

**Non-Goals:**

- Publish the package to npm.
- Support binary releases or prebuilt artifact downloads.
- Replace the existing local `npm install -g .` development flow.
- Manage installation of Node, pnpm, Bun, git, or npm.

## Decisions

- Use `https://github.com/mickmetalholic/CthuTool.git` as the default repository URL.
  - Rationale: the repository is public, so HTTPS lets the raw installer work without SSH key setup.
  - Alternative considered: SSH default. That would fit private repos but would make the public one-line installer fail on machines without GitHub SSH configuration.

- Keep the source checkout under `~/.cthutool/source/CthuTool` by default.
  - Rationale: global npm installation from a Git URL does not cleanly support this monorepo's build step and root package bin layout, while a managed checkout can run workspace install, build, and `npm install -g`.
  - Alternative considered: install directly from `git+https` with npm. That would depend on npm lifecycle behavior and a fully prepared package shape.

- Implement self-update as the same clone/fetch, checkout, dependency install, build, and global install sequence used by the shell installer.
  - Rationale: install and update should converge on the same resulting local checkout and global binary.
  - Alternative considered: make `self-update` shell out to the installer script. Keeping the core update sequence in TypeScript makes it testable and integrates with CLI JSON/error rendering.

- Preserve branch and tag behavior with a remote branch check before pulling.
  - Rationale: branches should fast-forward from `origin/<ref>`, while tags and commit refs should be checked out without attempting an invalid pull.

## Risks / Trade-offs

- A global update can fail midway if dependencies cannot be fetched or the build fails -> the previous globally installed `chc` remains available until the final `npm install -g` step succeeds.
- The installer requires build tooling on the user's machine -> documentation lists `git`, Node 24, `npm`, `pnpm`, and `bun` as prerequisites.
- The default branch install tracks `main` and can change over time -> users can pin a tag with `CHC_REF` or `chc self-update --ref`.
- The managed checkout may contain local user edits -> update uses fast-forward pulls for branch refs, so conflicting local changes fail visibly instead of being overwritten.
