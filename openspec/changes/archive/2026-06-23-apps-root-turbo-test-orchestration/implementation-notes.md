## Audit

Package scripts using `build:deps` before this change:

- `@cthutool/backend`: `build`; test layer scripts also built dependencies before Vitest.
- `@cthutool/desktop`: `build`, `typecheck`, `test`, and `test:cov`.
- `@cthutool/app-shell`: `build`, `typecheck`, `test`, and `test:cov`.

The package `build` scripts keep dependency builds because direct build commands need built workspace artifacts. `@cthutool/app-shell` also keeps `build:deps` for `typecheck` because its public type contract imports UI components through the package surface.

## Orchestration Summary

Root Turbo validation now declares upstream `^build` dependencies for `test`, `test:cov`, `typecheck`, and standardized test layer tasks. Package test commands that dropped `build:deps` either use source aliases or package-local imports so direct filtered commands remain runnable.

No package validation script is intentionally Turbo-only after this change.

## Direct Command Checks

- `pnpm --filter @cthutool/backend test`
- `pnpm --filter @cthutool/desktop test`
- `pnpm --filter @cthutool/desktop typecheck`
- `pnpm --filter @cthutool/app-shell test`

## Turbo Graph Check

`pnpm exec turbo run test --dry=json` confirms these root orchestration edges:

- `@cthutool/backend#test` depends on `@cthutool/agent-protocol#build` and `@cthutool/config#build`.
- `@cthutool/desktop#test` depends on `@cthutool/agent-protocol#build`, `@cthutool/app-shell#build`, and `@cthutool/ui#build`.
- `@cthutool/app-shell#test` depends on `@cthutool/ui#build`.
- Package `test` task definitions use `dependsOn: ["^build"]` with no durable outputs.
