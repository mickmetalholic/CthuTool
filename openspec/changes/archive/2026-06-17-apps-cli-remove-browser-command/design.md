## Context

`apps/cli` currently exposes a `browser` command group with `doctor` and `status` subcommands. The same package also still contains an older browser-auth helper domain module whose behavior belongs to the pre-desktop ownership model: open a login browser, write storage-state bundles, and verify third-party identity from CLI-owned state.

CthuDesktop now owns local browser runtime, profile storage, login windows, verification, and user-facing browser status. The backend owns browser orchestration, public browser status APIs, and pending auth tasks. Keeping a CLI browser wrapper adds another surface to explain without adding a capability that Desktop cannot provide.

## Goals / Non-Goals

**Goals:**

- Remove the entire `chc browser` command group from the CLI root command.
- Remove CLI browser command tests and the old CLI browser-auth helper tests.
- Remove CLI browser-auth helper implementation instead of preserving unused auth-bundle code.
- Update documentation to direct regular browser workflows to CthuDesktop and developer troubleshooting to backend APIs.
- Remove the `apps-cli-browser-runtime` OpenSpec capability instead of leaving a negative placeholder capability.
- Generalize incomplete top-level command handling so each top-level command can print its own help from the entrypoint.

**Non-Goals:**

- Do not change backend browser APIs.
- Do not change Desktop browser runtime, login, verification, or task-center behavior.
- Do not introduce a replacement CLI command in this change.
- Do not keep compatibility stubs for `chc browser`.

## Decisions

### Decision: Hard-remove the command group

Remove `browser` from the root command map and delete `browser.command.ts`. The alternative was to keep a deprecated command that prints Desktop guidance, but that would still preserve `chc browser` as an apparent supported surface and would make future CLI capability design less clear.

### Decision: Remove old CLI auth helper code

Delete the CLI browser-auth helper and tests alongside the command removal. Even though the helper is not registered as a public command, it still encodes removed ownership semantics and can mislead future browser-auth work.

### Decision: Keep backend and Desktop contracts untouched

Developer troubleshooting remains possible through backend browser APIs and Desktop status views. The CLI no longer wraps those APIs. This keeps this change scoped to CLI ownership and avoids mixing it with backend data-model cleanup.

### Decision: Remove the OpenSpec capability instead of inverting it

The existing `apps-cli-browser-runtime` capability only describes CLI browser runtime/status behavior. This change removes those requirements rather than replacing them with a long-lived negative contract. If future CLI browser-adjacent capabilities are needed, they should get a fresh capability name and proposal.

### Decision: Resolve incomplete top-level commands from the root command map

Replace the `chc codex` entrypoint special case with a helper that looks up a single top-level argument in `rootCommand.subCommands` and renders that command's native help. This preserves `chc codex` behavior while making `chc scripts` and `chc completion` behave consistently. Internal commands such as `__complete` remain handled by the normal command runner.

## Risks / Trade-offs

- [Risk] Users lose a quick terminal status check for browser state. -> Mitigation: document that regular users use Desktop, and developers can call backend browser APIs directly.
- [Risk] Future work might accidentally reintroduce CLI browser ownership. -> Mitigation: remove the stale implementation, tests, docs, and OpenSpec capability together.
- [Risk] Removing the whole command is a breaking CLI change. -> Mitigation: this CLI surface is not treated as a stable external contract yet, and the removal is intentional.
- [Risk] `chc scripts` no longer enters interactive script selection at the binary entrypoint. -> Mitigation: users can run `chc scripts <id>` or `chc scripts --script <id>`, and the help output shows those forms.
