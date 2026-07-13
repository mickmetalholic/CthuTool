## Context

The current update path combines option resolution, Git mutation, committed-bundle verification, global installation, and human rendering in one linear operation. It records a step before each command but does not know whether the target differs from the current checkout, whether the checkout is safe to mutate, or what user-facing state should be reported. Subprocess output is buffered until failure, and the final human state is always `updated`.

The CLI already has shared JSON, quiet, non-interactive, diagnostics, and output contracts plus `@clack/prompts` for TTY rendering. The update mechanism must continue to run from the committed Node bundle on machines with Git, Node 24, and npm but without pnpm or Bun. Package version is currently not a useful update identity, so ref and commit remain authoritative.

## Goals / Non-Goals

**Goals:**

- Separate update inspection and planning from checkout and global-install mutation.
- Make no-op, install, update, blocked, and failure states explicit and testable.
- Preserve an efficient one-command managed update while protecting dirty or diverged checkouts.
- Give TTY users live progress and all users concise current-to-target and recovery information.
- Keep JSON deterministic, quiet mode quiet, diagnostics structured, and failure details bounded.

**Non-Goals:**

- Periodic, background, or shell-startup update checks.
- Semantic-version release selection or a new release channel service.
- Automatic stash, reset, clean, rebase, rollback, or repair of user Git state.
- Changing the public repository, default ref, managed checkout location, committed bundle, or npm global-install mechanism.
- Replacing Citty, the shared CLI context, or existing observability infrastructure.

## Decisions

- Introduce a domain-level update plan before apply.
  - The plan carries a stable classification (`install_required`, `update_available`, `up_to_date`, or `blocked`), source configuration, optional before/target identities, change count, bounded commit subjects, and block reason.
  - Existing checkout inspection checks Git availability, repository state, worktree cleanliness, current identity, target identity, and fast-forward safety before checkout-file or global-install mutation.
  - Rationale: rendering and execution need the same factual state, and tests should not infer state from emitted step strings.
  - Alternative considered: add prettier output around the existing linear runner. This would still reinstall no-op updates and discover unsafe checkout state only after mutations begin.

- Keep `chc update` direct for a safe managed checkout.
  - An explicit update command is sufficient user intent; it does not ask for a second confirmation in the normal path.
  - Dirty or diverged checkouts are blocked rather than prompting to overwrite, stash, reset, or rebase.
  - Rationale: this preserves fast manual updates while placing friction only where user work is at risk.
  - Alternative considered: confirm every update. This adds ceremony, complicates automation, and does not improve safety for clean managed state.

- Add `--check` as a mode of the existing update command.
  - Check mode resolves remote availability and returns a plan without cloning, checking out, pulling, verifying for installation, or invoking npm.
  - Remote branch and tag identities should be queried without changing checkout files; unsupported or unreachable targets fail with bounded check-phase context.
  - Rationale: a flag preserves `chc update` as the simple lifecycle entry point and avoids turning it into another command group.
  - Alternative considered: `chc update check` and `chc update apply`. This is structurally explicit but makes the common action more verbose and introduces compatibility routing for little benefit.

- Treat commit identity as the update comparison key.
  - The plan compares the current checkout commit with the resolved branch, tag, or commit target.
  - For branch targets, the updater verifies that the current commit can fast-forward to the target before apply.
  - Equal commits return `up_to_date` and skip checkout, bundle verification for installation, and global npm installation.
  - Rationale: the repository package version is currently static and cannot distinguish builds reliably.

- Replace step callbacks with structured update events and results.
  - Stable phases are `preflight`, `check_remote`, `clone` or `fetch`, `checkout`, `verify_bundle`, and `install_global`.
  - Events distinguish phase start, phase completion, state discovery, and failure; results distinguish `installed`, `updated`, and `up_to_date`.
  - The default change summary contains at most five commit subjects, each bounded in length, and reports an omitted count. JSON uses the same bounded data.
  - Rationale: renderers and diagnostics can share lifecycle facts without parsing prose.

- Use mode-specific renderers over the same event stream.
  - Interactive human mode uses existing TTY-capable prompt primitives for one active phase and completed checkmarks.
  - Non-TTY human mode writes stable plain lines without cursor controls.
  - Quiet mode suppresses source detail, progress, and changelog while preserving errors.
  - JSON mode emits no human progress and writes exactly one final value.
  - `--verbose` adds bounded command and subprocess details to human stderr and diagnostics but never to JSON stdout.
  - Rationale: output mode is a presentation concern and must not change update decisions.

- Introduce typed phase failures while preserving the public error code.
  - Internal update failures carry phase, concise summary, bounded safe cause, recovery hint, and optional command metadata.
  - The command boundary continues returning `update_failed`; default human rendering omits raw cwd and full subprocess output, while verbose and diagnostics may expose bounded non-secret details.
  - Rationale: stable automation behavior and useful human recovery are both required.

- Keep install and update execution on the current mechanism.
  - Missing checkouts clone, existing safe checkouts fetch and fast-forward or check out the selected immutable ref, selected output verifies `apps/cli/dist/index.js`, and npm installs the repository root globally with `--ignore-scripts`.
  - Rationale: this change improves planning and experience rather than replacing distribution.

## Risks / Trade-offs

- [Risk] Remote identity resolution differs for branches, annotated tags, lightweight tags, and raw commits. → Normalize targets to peeled commit ids and cover each ref type with dependency-injected Git command tests.
- [Risk] A worktree can change after preflight but before checkout. → Recheck cleanliness immediately before the first checkout mutation and fail closed.
- [Risk] TTY progress can corrupt captured or piped output. → Gate cursor-based rendering on output TTY and use a plain renderer otherwise.
- [Risk] Verbose subprocess output can be large or contain sensitive values. → Bound line count and length, redact configured repository credentials, and keep raw environment values out of events.
- [Risk] Skipping global installation on equal commits could miss a manually removed or broken global link. → Treat repair as explicit future behavior; users can reinstall through the installer, while `chc status` remains the diagnostic path.
- [Trade-off] Blocking dirty custom checkouts makes some developer workflows less automatic. This is preferable to silently stashing or overwriting user work.

## Migration Plan

1. Add update plan, identity, state, event, and typed failure models behind the existing command API.
2. Add preflight and check-mode Git operations with unit coverage before changing apply routing.
3. Route apply through the plan, add no-op and safety behavior, then add mode-specific rendering.
4. Extend JSON additively while retaining `ok`, `command`, result source fields, and `update_failed`.
5. Update integration tests, documentation, and the committed CLI bundle.

Rollback is code-only: the previous linear runner and coarse renderer can be restored without migrating persisted user data. Managed checkouts and global installation layout do not change.

## Open Questions

- None. The safety, direct-update, output-mode, and scope boundaries are defined above.
