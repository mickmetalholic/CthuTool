## Context

The CLI already has contracts for JSON stdout, stderr diagnostics, quiet mode, and bundled script execution. Observability semantics should extend those contracts without breaking machine-readable output.

## Goals / Non-Goals

**Goals:**
- Define command and script lifecycle diagnostics that preserve JSON stdout correctness.
- Standardize duration, exit code, error code, mode, and script id fields.
- Clarify redaction rules for paths, environment values, secrets, and unbounded payloads.

**Non-Goals:**
- Streaming telemetry to a remote service from CLI commands.
- Changing existing command behavior or output semantics.
- Logging command arguments verbatim.

## Decisions

1. Keep diagnostics off stdout in JSON mode.
   - Rationale: Existing JSON consumers require exactly one parseable stdout value.
   - Alternative considered: include diagnostic lines before JSON. That breaks consumers.

2. Use command boundary wrappers for lifecycle diagnostics.
   - Rationale: Most commands can share start, finish, duration, and error handling at the boundary.
   - Alternative considered: require each command to emit its own lifecycle events. That causes drift.

3. Treat bundled script progress as diagnostics rather than result output.
   - Rationale: Scripts can be verbose, but progress must not corrupt JSON mode.
   - Alternative considered: suppress all script progress. That hurts interactive debugging.

## Risks / Trade-offs

- Redaction can obscure useful file context -> allow safe normalized paths when they are not secrets and are already user-provided.
- Existing scripts may write directly to console -> migrate through shared progress/logger helpers.
- Quiet mode semantics can be ambiguous -> define quiet as suppressing nonessential info/progress while preserving errors.

## Migration Plan

1. Define CLI diagnostic event shape and redaction helpers.
2. Add command-boundary timing and outcome diagnostics.
3. Route bundled script progress through the shared diagnostics contract.
4. Add tests that stdout remains valid in JSON mode.

## Open Questions

- Should diagnostics support a structured stderr JSON mode, or stay human-readable initially?
- Which path fields should be redacted versus normalized?
- Should command duration be included in JSON result payloads or diagnostics only?
