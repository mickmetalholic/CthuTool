# CthuTool

Turborepo monorepo for CthuTool. Workspace layout follows the official `create-turbo` baseline, trimmed to empty `apps/*` and `packages/*` skeletons plus shared `@cthutool/*` packages.

## Prerequisites

- **Node.js** 20.x or newer (see `engines` in root `package.json`).
- **pnpm** 9.15.4 (see `packageManager` in root `package.json`). Recommended:

  ```bash
  corepack enable
  corepack prepare pnpm@9.15.4 --activate
  ```

## Install

From the repository root:

```bash
pnpm install
```

## Common commands

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm run build`  | Runs `turbo run build` across workspace members. |
| `pnpm run check`  | Runs `turbo run check` across workspace members. |
| `pnpm run test`   | Root Jest suite (contract + integration tests).  |

## Layout

- **`apps/`** — application packages (`apps/*` are matched by `pnpm-workspace.yaml`).
- **`packages/`** — libraries and tooling packages (`packages/*`).
- **Package names** — use the `@cthutool/*` scope (see **Naming** below).

### Naming and directories

- Put apps under `apps/<name>/` with a `package.json` named `@cthutool/<name>` (or your chosen suffix under the scope).
- Put libraries under `packages/<name>/` with `name`: `@cthutool/<name>`.
- Ensure `pnpm-workspace.yaml` globs (`apps/*`, `packages/*`) cover new folders; you do **not** need to duplicate root scripts — `pnpm run build` / `pnpm run check` already orchestrate the whole workspace via Turborepo.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `pnpm install` and `pnpm run check` at the repo root, matching the local entrypoints above. `pnpm run test` runs in CI with `SKIP_ROOT_WORKSPACE_CHECK` set so the optional root `pnpm run check` integration test is not duplicated inside the job.

## More documentation

- Contributor quickstart: [`specs/001-init-turborepo/quickstart.md`](specs/001-init-turborepo/quickstart.md)
