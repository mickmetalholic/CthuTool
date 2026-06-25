# CthuTool

<p align="center">
  <img src="docs/assets/cthutool-logo.png" alt="CthuTool logo" width="560" />
</p>

Turborepo monorepo for CthuTool. Workspace layout follows the official `create-turbo` baseline, trimmed to empty `apps/*` and `packages/*` skeletons plus shared `@cthutool/*` packages.

## Prerequisites

- **Node.js** 24.x (see `engines` and `volta` in root `package.json`).
- **pnpm** 9.15.4 (see `packageManager` in root `package.json`). Recommended:

  ```bash
  corepack enable
  corepack prepare pnpm@9.15.4 --activate
  ```
- **Bun** for CLI build and tests (`apps/cli` uses `bun build` and `bun test`).

## Install

From the repository root:

```bash
pnpm install
```

After installing dependencies, use the root commands as the canonical check
surface for the root-managed workspace:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## Personal CLI Install

Target machines only need `git`, Node.js 24.x, and `npm` to install or update
the global CLI. The installer uses the committed `apps/cli/dist/index.js`
bundle and does not run `pnpm` or `bun` on the target machine.

For personal use from GitHub, run the public installer directly:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

The public raw installer runs in remote mode. It clones or updates
`https://github.com/mickmetalholic/CthuTool.git` into
`~/.cthutool/source/CthuTool`, verifies the committed CLI bundle, and runs
`npm install -g --ignore-scripts` for the root package that exposes `chc`.

For local checkout development, run the installer from the checkout:

```bash
scripts/install-chc.sh
pnpm --filter @cthutool/cli dev
chc --help
```

Local script execution runs in local mode by default. It installs global `chc`
from the repository containing `scripts/install-chc.sh`, so the command follows
that checkout while the `dev` script rebuilds `apps/cli/dist/index.js`.

To restore global `chc` to the managed checkout after local development:

```bash
CHC_INSTALL_MODE=remote scripts/install-chc.sh
```

Use environment variables to install a different source or version:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | CHC_REF=v0.1.0 bash
CHC_INSTALL_MODE=remote CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_INSTALL_MODE=remote CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_INSTALL_DIR="$HOME/.cthutool/source/CthuTool" scripts/install-chc.sh
```

`CHC_INSTALL_MODE` accepts `auto`, `local`, or `remote`. In `auto` mode, which
is the default, raw stdin execution selects `remote` and local file execution
selects `local`. Repository, ref, and install-dir overrides apply to `remote`
mode.

After the first install, update from the CLI:

```bash
chc version
chc status
chc update
chc update --ref v0.1.0
```

When changing CLI source, refresh and commit the runtime bundle in the same
change:

```bash
pnpm --filter @cthutool/cli build
pnpm run check:cli-dist
```

## Common commands

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm run build`  | Runs `turbo run build` across workspace members. |
| `pnpm run check:cli-dist` | Verifies the committed CLI bundle matches source. |
| `pnpm run lint`   | Runs `biome check .` at repo root.               |
| `pnpm run lint:fix` | Runs `biome check --write .` at repo root.   |
| `pnpm run typecheck` | Runs `turbo run typecheck` across workspace members. |
| `pnpm run test`   | Runs root Jest tests plus workspace tests via Turborepo. |

## Layout

- **`apps/`** — application packages (`apps/*` are matched by `pnpm-workspace.yaml`), including backend, CLI, and desktop apps.
- **`packages/`** — libraries and tooling packages (`packages/*`), including shared protocol and package tooling.
- **`scratches/collection-hub/`** — experimental nested workspace. It is intentionally outside the root `pnpm-workspace.yaml`; verify it from that directory with its own workspace commands such as `pnpm run check`.
- **Package names** — use the `@cthutool/*` scope (see **Naming** below).

### Naming and directories

- Put apps under `apps/<name>/` with a `package.json` named `@cthutool/<name>` (or your chosen suffix under the scope).
- Put libraries under `packages/<name>/` with `name`: `@cthutool/<name>`.
- Ensure `pnpm-workspace.yaml` globs (`apps/*`, `packages/*`) cover new folders; you do **not** need to duplicate root scripts — `pnpm run build` / `pnpm run test` already orchestrate the whole workspace via Turborepo.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

- Commitlint (on `pull_request` and `push`)
- `pnpm run lint` (Biome)
- `pnpm run typecheck` (Turborepo)
- `pnpm run test` (with `SKIP_ROOT_WORKSPACE_CHECK=true`)

The workflow triggers on `push` to `main` and on `pull_request`, so Biome and commit message gates stay consistent between local and CI.

## Biome quality gates

### Editor gate (Cursor / VS Code)

- Repository default settings are in `.vscode/settings.json`.
- Diagnostics are enabled while typing (onType via Biome language service).
- Format on save is enabled and defaults to Biome.

### Pre-commit gate

- `.husky/pre-commit` only checks staged files under `apps/` and `packages/`.
- The hook blocks commit on failure and prints a direct fix command.

### Commitlint boundary

- Commitlint validates commit message format.
- Biome validates source formatting and lint rules.
- The two gates run independently to avoid responsibility overlap.

## More documentation

- Docs site: `apps/docs/` (`pnpm --filter @cthutool/docs dev`).
- Documentation index: `docs/README.md`.
- Desktop app and agent console: `docs/desktop-agent-console.md`.
- Browser login state and auth profile ownership: `docs/browser-auth.md`.
- Package-level notes live in package `README.md` files such as `apps/cli/README.md` and `apps/backend/README.md`.
- OpenSpec requirements live under `openspec/specs/`.
- CthuCodex plugin details live in `codex/plugins/cthu-codex/README.md`.
