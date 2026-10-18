## 1. CLI help and compatibility

- [x] 1.1 Add optional manifest help and read-only selected-script rendering; verify canonical/compatibility help, scripts without metadata, and unchanged JSON catalog.
- [x] 1.2 Register deprecated Agent env as compatibility-only; verify it is hidden in help/completion and retains the migration error.

## 2. Agent usage guidance

- [x] 2.1 Correct Agent CLI documentation and reconcile the lifecycle specification; review native-settings/latest-release instructions against the implementation.
- [x] 2.2 Add CthuCodex cthutool-cli skill, invocation metadata, and workflow reference; validate packaging and review inspection/update/conversion/interactive-only scenarios.

## 3. Integration and delivery

- [x] 3.1 Restore locked dependencies, run focused tests and CLI type/lint checks, rebuild the pinned CLI distribution, and verify installed Node help.
- [x] 3.2 Validate this OpenSpec change, reconcile its scoped main specs, and verify generated adapters and neighboring changes remain untouched.
- [x] 3.3 Review the final scoped diff and verify that only intended files are ready for PR delivery.

Verification: 56 focused tests passed, one zsh-execution test skipped because
zsh is unavailable on this Windows host. CLI type/lint, pinned bundle consistency,
packaged Node help, skill validation, docs build/index, and all 68 main specs pass.
The broader Windows run had 203 passing tests and five failures in untouched
Obsidian/source presentation and diagnostics tests; Linux CI remains required
before merging.
