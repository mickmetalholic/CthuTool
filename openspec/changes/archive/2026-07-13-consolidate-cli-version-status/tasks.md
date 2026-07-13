## 1. CLI Command Surface

- [x] 1.1 Hide the legacy `version` subcommand from top-level help while preserving command dispatch and output contracts.
- [x] 1.2 Exclude the legacy `version` subcommand from top-level completion candidates without affecting nested candidates.
- [x] 1.3 Update CLI integration tests for canonical discovery and legacy compatibility behavior.

## 2. Documentation

- [x] 2.1 Replace canonical `chc version` examples with `chc --version` in root, package-local, and docs-site lifecycle documentation.
- [x] 2.2 Document that `chc status` includes the installed version and remains the full installation diagnostic command.

## 3. Generated Runtime and Verification

- [x] 3.1 Refresh the committed CLI runtime bundle and confirm generated agent adapter files remain unchanged.
- [x] 3.2 Run focused CLI tests, CLI type checking, committed-bundle verification, and OpenSpec validation.
