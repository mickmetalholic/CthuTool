## Context

See `proposal.md` for motivation. Generated OpenSpec adapters are ignored by Git, while the repository currently uses Husky 9 through `prepare: husky`. Husky configures `core.hooksPath` as `.husky/_`, but that dispatcher directory is generated during dependency installation and is absent when a fresh linked worktree performs its first checkout. Standard Git does invoke `post-checkout` after `git worktree add` unless checkout is suppressed, so the hook entrypoint must already be present in the newly checked-out tree.

The existing AI tooling setup is idempotent and uses only Node built-ins plus the documented global OpenSpec prerequisite. The protected `codex/plugins/cthu-codex` tree must remain outside this workflow.

## Goals / Non-Goals

**Goals:**

- Make standard Git lifecycle behavior the shared bootstrap mechanism across AI hosts and manual worktree creation.
- Keep hook installation automatic after normal root dependency installation.
- Preserve current commit-time checks while eliminating the generated-dispatcher bootstrap gap.
- Reuse the existing AI tooling check/setup implementation and keep generated adapters ignored.
- Make skipped or failed initialization visible and recoverable.

**Non-Goals:**

- Supporting tools that copy directories without using Git worktrees or that suppress checkout hooks.
- Installing or changing the machine-wide OpenSpec prerequisite automatically during a Git operation.
- Starting application services, building the monorepo, or installing dependencies inside every new worktree.
- Modifying the protected CthuCodex business plugin or changing user-scope third-party skill management.

## Decisions

### Use a tracked `.githooks` directory as the active hook path

The repository will track executable `pre-commit`, `commit-msg`, and `post-checkout` entrypoints under `.githooks` and configure `core.hooksPath=.githooks`. A relative tracked path resolves inside each checkout after Git has populated it, so the initial worktree checkout can invoke `post-checkout` without first generating a dispatcher.

The existing `.husky/pre-commit` and `.husky/commit-msg` command bodies will move to the corresponding tracked hook entrypoints. Husky and its generated `.husky/_` dispatcher will no longer be the active hook mechanism.

Alternatives considered:

- Keeping `.husky/_`: rejected because the generated dispatcher is missing at the moment a new worktree first needs `post-checkout`.
- Codex Local Environment setup: rejected as the repository-wide mechanism because other AI hosts and manual Git workflows do not share it.
- Committing generated OpenSpec adapters: rejected because it conflicts with the repository's generated-adapter ownership policy and can leave adapters stale relative to durable inputs.

### Install the hook path through a dependency lifecycle script

A dependency-free Node installer under `scripts/` will run from the root `prepare` lifecycle. It will detect whether it is in a local Git checkout, skip documented CI or disabled-hook contexts, and set the repository-local `core.hooksPath` idempotently. Because linked worktrees share the common repository configuration by default, later worktrees inherit the setting.

The installer will also invoke the shared AI tooling ensure path for the current checkout when prerequisites are available. It will provide an explicit standalone package command so developers can repair configuration after `--ignore-scripts` or other suppressed lifecycle execution.

Alternatives considered:

- A global Git template or global `core.hooksPath`: rejected because it changes unrelated repositories and cannot be safely committed as project policy.
- Requiring a manual command after every clone: rejected because it recreates the setup gap the change is intended to remove.

### Share one check-then-repair bootstrap implementation

Both the dependency installer and `post-checkout` will call one repository-owned bootstrap entrypoint. The entrypoint will first run the existing read-only AI tooling check. It will call the existing idempotent setup only when verification fails for repairable generated-state reasons, then verify again. File checkouts (`post-checkout` flag `0`) will not trigger bootstrap.

Prerequisite failures and setup failures will remain distinguishable from a valid no-op. Diagnostics will name `pnpm setup:ai-tooling` and the documented OpenSpec prerequisite commands. The hook will propagate an incomplete-bootstrap result so the invoking tool cannot silently claim that the worktree is fully initialized; the diagnostic will state that checkout files may already exist because `post-checkout` runs after Git populates the worktree.

Alternatives considered:

- Always regenerating on every checkout: rejected because ordinary branch switches would do unnecessary writes and increase latency.
- Silently returning success after setup failure: rejected because AI hosts could start without the workflows the repository contract requires.

### Keep automation narrowly scoped

The automatic path will generate only the OpenSpec-owned adapter surfaces already managed by `pnpm setup:ai-tooling`. It will not run dependency installation, builds, application services, third-party skill installation, or business-plugin synchronization. Contract tests will inspect hook commands, hook-path installation behavior, skip guards, and protected-path boundaries without requiring a live AI host.

## Risks / Trade-offs

- **[Risk] A missing or drifted global OpenSpec prerequisite makes worktree creation report a hook failure after files are checked out.** → Validate and explain prerequisites during root dependency installation, keep the failure message explicit about the existing worktree, and provide the exact repair command.
- **[Risk] Replacing Husky changes a familiar hook layout.** → Preserve the existing command bodies verbatim, add contract tests, and remove the dependency only after the tracked hooks are active.
- **[Risk] Some AI tools may invoke `git worktree add --no-checkout` or disable hooks.** → Document these as explicit exceptions and provide the standalone hook installer and AI tooling setup commands.
- **[Risk] Checkout hooks add latency.** → Run the read-only verification first and regenerate only when required; do not install dependencies or build the project.
- **[Risk] Relative hook-path behavior differs if a tool does not use a normal working tree.** → Scope the contract to standard local Git linked worktrees and safely skip non-worktree/non-Git contexts.

## Migration Plan

1. Add the tracked hook directory and copy the existing commit hook command bodies into it.
2. Add the dependency-free hook installer and shared AI tooling bootstrap entrypoint with contract tests.
3. Change the root `prepare` lifecycle to run the installer and expose an explicit repair command.
4. Remove the Husky dependency and obsolete tracked `.husky` entrypoints after equivalent behavior is verified.
5. Update AI tooling documentation and root agent policy with automatic behavior, prerequisites, exceptions, and recovery commands.
6. Run targeted contract tests, AI tooling check/setup idempotence checks, and `git diff --check`.

Rollback consists of restoring `prepare: husky`, the Husky dependency and tracked hooks, then running dependency installation to restore `.husky/_`. Generated adapter directories remain ignored and can still be repaired manually with `pnpm setup:ai-tooling` throughout migration.
