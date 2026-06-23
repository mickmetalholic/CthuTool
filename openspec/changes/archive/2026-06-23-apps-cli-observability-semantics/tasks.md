## 1. CLI Diagnostics Contract

- [x] 1.1 Define CLI diagnostic event shape for command identity, mode, duration, exit code, and stable error code.
- [x] 1.2 Define stdout, stderr, quiet mode, JSON mode, and interactive mode behavior for diagnostics.
- [x] 1.3 Define redaction rules for credentials, environment values, sensitive paths, and unbounded payloads.

## 2. CLI Integration

- [x] 2.1 Add command-boundary lifecycle diagnostics for start, completion, and failure.
- [x] 2.2 Route bundled script selection, validation, progress, completion, and failure diagnostics through the shared contract.
- [x] 2.3 Preserve the existing JSON stdout contract while allowing diagnostics on stderr or another diagnostics channel.
- [x] 2.4 Update convert-to-cbz progress diagnostics to follow the shared contract where needed.

## 3. Verification

- [x] 3.1 Add tests that JSON mode writes exactly one parseable stdout value when diagnostics are emitted.
- [x] 3.2 Add tests for quiet mode and non-interactive diagnostics behavior.
- [x] 3.3 Add tests for bundled script failure diagnostics and redaction.
- [x] 3.4 Run CLI typecheck and relevant tests.
