## Context

The root CLI currently registers `version` and `status` as visible sibling commands. `version` reads only the package version, while `status` includes that version and inspects the source checkout with optional Git subprocesses. The CLI also implements the conventional `--version` fast path. The overlap is therefore in the discoverable command surface, not in the underlying workloads.

Compatibility matters because `chc version` supports both human output and the shared `--json` contract. The command framework derives help and completion from the same root command tree used for dispatch, so the legacy command must remain dispatchable while being filtered from discovery surfaces.

## Goals / Non-Goals

**Goals:**

- Present `chc --version`, `chc status`, and `chc update` as the canonical lifecycle interface.
- Preserve current `chc version` behavior for existing users and scripts.
- Keep the lightweight version path independent of status checkout inspection.
- Align help, completion, tests, and documentation with the consolidated interface.

**Non-Goals:**

- Merge status diagnostics into version output.
- Change status fields, Git inspection, JSON schemas, or exit codes.
- Remove the legacy `chc version` parser entry in this change.
- Introduce a nested lifecycle command group.

## Decisions

- Keep `versionCommand` registered for dispatch but treat it as a hidden compatibility alias.
  - Rationale: this preserves human and JSON contracts without requiring a migration deadline.
  - Alternative considered: remove the command immediately. That simplifies registration but needlessly breaks callers.

- Filter the legacy alias at the help-rendering and completion-candidate boundaries.
  - Rationale: these are the two discovery surfaces that define the visible command interface, while dispatch remains unchanged.
  - Alternative considered: special-case raw arguments before command dispatch. That would duplicate argument parsing and risk losing shared flags such as `--json`.

- Keep `chc --version` as a direct lightweight fast path and keep version included in `chc status`.
  - Rationale: scripts expect a cheap standard version check, whereas status is intentionally a richer diagnostic that can spawn Git commands.
  - Alternative considered: make version invoke status. That would make version checks slower and change both human and JSON output contracts.

- Update normative specs and user-facing examples to name only canonical entry points, while explicitly specifying legacy compatibility.

## Risks / Trade-offs

- [Risk] A future help-rendering change could expose `version` again. → Keep an integration assertion that top-level help omits the alias.
- [Risk] Completion and help could diverge. → Test both discovery surfaces against the same expected canonical command set.
- [Risk] Users may assume the hidden alias is removed. → Preserve explicit compatibility tests for plain and JSON invocation.
