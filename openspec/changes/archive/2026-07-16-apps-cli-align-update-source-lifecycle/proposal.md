## Why

`chc status` reports the checkout that actually provides the running command, but `chc update` always targets the default managed checkout. A locally linked installation can therefore inspect or replace an unrelated checkout, silently switch back to remote mode, or claim that `chc` is current by comparing the wrong source.

## What Changes

- Make update source selection aware of the checkout that provides the running `chc` command.
- **BREAKING** Stop default `chc update` and `chc update --check` from operating on the managed checkout when the running command is linked to a local checkout; return a clear local-development outcome without mutating either checkout or the global npm link.
- Keep automatic Git mutation for the default managed installation and keep `--install-dir` as the explicit advanced override for selecting another checkout.
- Resolve managed update defaults from the selected checkout's actual origin and checked-out branch, exact tag, or commit so one-shot fork and ref selections are not silently replaced by the official `main` target.
- Verify the target commit contains the committed CLI bundle before changing the live checkout, and apply the exact commit approved by preflight rather than a later moving branch head.
- Apply credential redaction consistently to update plans, verbose command events, failures, JSON output, and command diagnostics.
- Bring the remote installer and CLI updater safety contracts into alignment for dirty, diverged, and invalid target checkouts.
- Update lifecycle documentation and focused tests for local, managed, custom-source, pinned-ref, detached-head, failure-redaction, and plan/apply race scenarios.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Align default update behavior with the actual installed source, preserve explicit source selection, and prevent unsafe or implicit installation-mode switches.
- `apps-cli-update-experience`: Extend preflight classification and apply guarantees for local-linked sources, target-bundle validation, exact-commit application, and redacted failures.
- `apps-docs-site`: Document source-aware update behavior, local-development recovery, explicit managed switching, and custom or pinned update targets.

## Impact

- Affects `apps/cli/src/domain/self-update-manager.ts`, the lifecycle command and renderer, CLI diagnostics redaction, `scripts/install-chc.sh`, and the committed CLI bundle.
- Changes default human and JSON outcomes for `chc update` when the running installation is local-linked.
- Requires unit, integration, installer-contract, global-bin, output, and documentation coverage.
- Does not add a background updater, publish an npm package, or automatically reset, rebase, stash, or clean user work.
