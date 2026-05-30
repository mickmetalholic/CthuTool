## 1. Command Tree Setup

- [x] 1.1 Extract the root `citty` command definition from `apps/cli/src/index.ts` into a reusable module.
- [x] 1.2 Update the CLI entrypoint to run the exported root command without changing existing no-argument help behavior.
- [x] 1.3 Register a public `completion` command group.
- [x] 1.4 Register an internal `__complete` command for shell adapters.

## 2. Completion Domain

- [x] 2.1 Add a completion domain module that traverses `citty` command definitions.
- [x] 2.2 Implement root and nested subcommand candidate generation.
- [x] 2.3 Implement long flag candidate generation from command args.
- [x] 2.4 Filter candidates by the current word prefix.
- [x] 2.5 Treat already-provided non-repeatable flags as unavailable for the current completion request.
- [x] 2.6 Reuse bundled script discovery to provide `scripts` command script id candidates.
- [x] 2.7 Ensure completion never invokes interactive prompts.

## 3. Shell Script Rendering

- [x] 3.1 Implement `chc completion powershell` script rendering with `Register-ArgumentCompleter`.
- [x] 3.2 Implement `chc completion zsh` script rendering with a zsh completion function and `compdef`.
- [x] 3.3 Ensure both shell adapters call `chc __complete` and pass command words safely.
- [x] 3.4 Return a clear error for unsupported shell names.

## 4. Internal Protocol

- [x] 4.1 Implement `chc __complete` to print newline-delimited candidates.
- [x] 4.2 Keep `__complete` stdout free of human status output and JSON contract wrappers.
- [x] 4.3 Keep completion failures quiet and conservative.
- [x] 4.4 Add direct tests for representative `__complete` requests.

## 5. Documentation

- [x] 5.1 Add a Shell Completion section to `apps/cli/README.md`.
- [x] 5.2 Document PowerShell setup using `chc completion powershell`.
- [x] 5.3 Document zsh setup using `chc completion zsh`.
- [x] 5.4 Mention that users need a globally installed or linked `chc` command.

## 6. Verification

- [x] 6.1 Add tests for PowerShell script output.
- [x] 6.2 Add tests for zsh script output.
- [x] 6.3 Add tests for root command, nested command, shell name, and flag candidates.
- [x] 6.4 Add tests for dynamic bundled script id candidates.
- [x] 6.5 Run `pnpm --filter @cthutool/cli test`.
- [x] 6.6 Run `pnpm --filter @cthutool/cli typecheck`.
- [x] 6.7 Run `openspec status --change apps-cli-shell-completion`.
