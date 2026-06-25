## Context

CthuTool is a pnpm/Turborepo monorepo whose root workspace intentionally manages `apps/*` and `packages/*` while excluding experimental nested workspaces such as `scratches/collection-hub`. The current primary CI workflow runs lint, typecheck, tests, and coverage, but it does not run a full workspace build or the CLI distribution check before merge. It also relies on pnpm dependency caching without persisting Turborepo task cache across GitHub Actions runs.

The repository already defines Turbo tasks for `build`, `test`, `typecheck`, and `test:cov`, but some workflows and package scripts still bypass the workspace task graph through direct package filters or hand-written dependency builds. The CI redesign should use Turbo as the monorepo task scheduler while keeping heavyweight platform packaging and image publishing in focused workflows.

## Goals / Non-Goals

**Goals:**
- Ensure root CI validates lint, typecheck, runtime tests, builds, coverage generation, and CLI distribution integrity for root-managed packages.
- Use Turbo task orchestration so workspace package tasks run in parallel while respecting dependency order.
- Persist Turbo cache across GitHub Actions runs in addition to the existing pnpm store cache.
- Keep desktop packaging in its dedicated workflow, but ensure desktop dependency changes trigger packaging validation.
- Validate backend Docker image builds on pull requests without publishing images.
- Keep main branch backend image publishing and deployment manifest updates, with concurrency protection.
- Keep the root workspace boundary explicit and avoid absorbing `scratches/collection-hub` into root CI.

**Non-Goals:**
- Running persistent or interactive scripts such as `dev`, `start`, `test:watch`, `commit`, or local hook setup in CI.
- Adding production signing, notarization, or release publishing for desktop artifacts.
- Changing deployment architecture, ArgoCD application layout, or Kubernetes manifests beyond the backend image tag update workflow.
- Regenerating or editing agent adapter instructions under `.claude/`, `.codex/`, or `.cursor/`.

## Decisions

1. Use Turbo as the primary workspace validation entrypoint.

   Root CI should call `pnpm turbo run <task>` or root scripts that delegate to Turbo for package-level lint, typecheck, test, coverage, and build tasks. This keeps package execution parallel and dependency-aware. The alternative is keeping root-level serial scripts and direct package filters, but that duplicates dependency orchestration and makes caching less effective.

2. Keep CI jobs focused and parallel at the GitHub Actions level.

   The primary CI workflow should split lint, typecheck, tests, build, CLI distribution checks, and coverage into separate jobs. This gives faster feedback and clearer failure attribution than a single serial check job. Shared setup can be duplicated per job because pnpm and Turbo caches reduce repeated work.

3. Cache `.turbo/cache` explicitly with GitHub Actions cache.

   `actions/setup-node` with `cache: pnpm` speeds dependency installation only; it does not persist Turbo task outputs. The workflow should restore and save `.turbo/cache` with broad restore keys so repeated pushes and nearby branches can reuse package task results where inputs match.

4. Keep coverage independent from required correctness gates unless a coverage threshold is added later.

   Coverage should still generate artifacts, publish the PR summary, and upload to Codecov. Codecov upload failure may remain non-blocking unless the project decides to enforce coverage thresholds. The validation path for correctness should remain lint, typecheck, tests, build, and CLI distribution checks.

5. Use Turbo filtered graph for desktop validation before platform packaging.

   Desktop CI should validate the desktop package and its dependency graph with `--filter=@cthutool/desktop...`. Platform-specific packaging can still call desktop package scripts after build. This avoids missing changes in `packages/app-shell` and `packages/ui`, which affect desktop output.

6. Separate backend image validation from publication.

   Pull requests should run a Docker build without registry login or push. Main branch runs should push `main` and commit-SHA tags, then update the deployment manifest. This catches Docker build failures before merge while preserving the current GitOps publishing behavior.

7. Protect backend manifest update with workflow concurrency.

   The backend image workflow writes back to `main`. It should use a stable concurrency group for main branch publishing so overlapping runs do not race when updating `k8s/deployment.yaml`.

## Risks / Trade-offs

- Broader CI coverage increases total compute work -> Mitigate with GitHub job parallelism, pnpm cache, Turbo cache, and Turbo dependency-aware task reuse.
- Turbo cache can hide stale outputs if task inputs or outputs are incomplete -> Mitigate by keeping `turbo.json` inputs and outputs aligned with generated artifacts and by preserving `--frozen-lockfile` installs.
- Splitting jobs duplicates dependency installation setup -> Mitigate with pnpm store caching and accept the trade-off for faster failure visibility and parallel wall-clock time.
- Running full builds on every PR may expose existing latent build failures -> Mitigate by implementing the workflow changes with contract tests first, then fixing any package build issues surfaced by CI.
- Backend manifest push can still fail if branch protection blocks GitHub Actions writes -> Mitigate by keeping the current permissions model unless policy requires a pull-request based GitOps update.

## Migration Plan

1. Add or update contract tests for required CI workflow structure and workspace script coverage.
2. Update root scripts and Turbo task usage so root validation flows through Turbo where appropriate.
3. Add Turbo cache restore/save steps to relevant GitHub Actions jobs.
4. Split the primary CI workflow into focused jobs and add build plus CLI distribution gates.
5. Update desktop artifact workflow paths and validation commands.
6. Update backend image workflow for PR build-only behavior, main publish behavior, exact tool versions, and concurrency.
7. Run the affected root contract tests locally, then run targeted lint/typecheck/tests/build commands as feasible.

## Open Questions

- Should Codecov upload failure remain non-blocking, or should coverage upload become a required signal?
- Should backend deployment manifest updates continue to push directly to `main`, or move to an automated pull request flow if branch protection becomes stricter?
