## 1. Shared Lifecycle Command Routing

- [x] 1.1 Refactor status and update command construction to accept explicit diagnostic and JSON route identities while sharing the existing argument definitions, renderers, error adapters, and domain operations; verify focused self-update command tests cover both route descriptors without duplicated handlers.
- [x] 1.2 Register public `status` and `update` operations under `source` and change the root registrations to `compat`; verify command-registry tests show source operations as public, root aliases as directly executable, and bare `source` as help-first.

## 2. Command Contracts and Discovery

- [x] 2.1 Add canonical `source status` coverage for human, quiet, `--install-dir`, failure, and JSON behavior while retaining direct `status` alias coverage; verify canonical JSON reports `command: "source status"` and legacy JSON remains `command: "status"`.
- [x] 2.2 Add canonical `source update` coverage for `--check`, managed no-op/apply planning, explicit repo/ref/install-dir overrides, failures, and JSON behavior while retaining direct `update` alias coverage; verify canonical JSON reports `command: "source update"`, legacy JSON remains `command: "update"`, and tests perform no real Git or global npm mutation.
- [x] 2.3 Update root/source help and shell-completion expectations; verify root discovery contains `source` but omits top-level `status`/`update`, source discovery contains `list`, `status`, `use`, `update`, and `register`, and `current` remains absent.
- [x] 2.4 Preserve the separation between `source list` inventory and `source status` diagnosis; verify source integration tests show list returns all candidates with active identity while status returns only detailed installation state.

## 3. Documentation and Distribution

- [x] 3.1 Update the root README, CLI README, and docs-site CLI/source/install/reference content to use `chc source status` and `chc source update` canonically, explain list versus status, and mention top-level aliases only as compatibility guidance; verify a repository search finds no unintended canonical `chc status` or `chc update` examples.
- [x] 3.2 Refresh the committed `apps/cli/dist/index.js` bundle after source changes; verify the CLI build/parity check succeeds and the bundled CLI exposes the same root/source help and canonical commands as the source entrypoint.

## 4. Verification and Scope

- [x] 4.1 Run the focused CLI unit and integration suites for root registration, command discovery, completion, source commands, self-update commands, status output, diagnostics, and global bin behavior; verify all selected tests pass.
- [x] 4.2 Run the CLI TypeScript typecheck, target-file lint/format checks, and `git diff --check`; verify no type, lint, formatting, or whitespace errors remain.
- [x] 4.3 Run `openspec validate apps-cli-consolidate-source-lifecycle-commands --strict`; verify the change is valid, the neighboring `apps-cli-streamline-source-selection` artifacts are not modified by apply, generated `.agents/.cursor/.opencode` OpenSpec adapter trees remain unchanged, and `codex/plugins/cthu-codex` is untouched.
