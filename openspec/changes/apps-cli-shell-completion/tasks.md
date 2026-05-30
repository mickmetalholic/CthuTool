## 1. Command Tree Setup

- [ ] 1.1 Extract the root `citty` command definition from `apps/cli/src/index.ts` into a reusable module.
- [ ] 1.2 Update the CLI entrypoint to run the exported root command without changing existing no-argument help behavior.
- [ ] 1.3 Register a public `completion` command group.
- [ ] 1.4 Register an internal `__complete` command for shell adapters.

## 2. Completion Domain

- [ ] 2.1 Add a completion domain module that traverses `citty` command definitions.
- [ ] 2.2 Implement root and nested subcommand candidate generation.
- [ ] 2.3 Implement long flag candidate generation from command args.
- [ ] 2.4 Filter candidates by the current word prefix.
- [ ] 2.5 Treat already-provided non-repeatable flags as unavailable for the current completion request.
- [ ] 2.6 Reuse bundled script discovery to provide `scripts` command script id candidates.
- [ ] 2.7 Ensure completion never invokes interactive prompts.

## 3. Shell Script Rendering

- [ ] 3.1 Implement `chc completion powershell` script rendering with `Register-ArgumentCompleter`.
- [ ] 3.2 Implement `chc completion zsh` script rendering with a zsh completion function and `compdef`.
- [ ] 3.3 Ensure both shell adapters call `chc __complete` and pass command words safely.
- [ ] 3.4 Return a clear error for unsupported shell names.

## 4. Internal Protocol

- [ ] 4.1 Implement `chc __complete` to print newline-delimited candidates.
- [ ] 4.2 Keep `__complete` stdout free of human status output and JSON contract wrappers.
- [ ] 4.3 Keep completion failures quiet and conservative.
- [ ] 4.4 Add direct tests for representative `__complete` requests.

## 5. Documentation

- [ ] 5.1 Add a Shell Completion section to `apps/cli/README.md`.
- [ ] 5.2 Document PowerShell setup using `chc completion powershell`.
- [ ] 5.3 Document zsh setup using `chc completion zsh`.
- [ ] 5.4 Mention that users need a globally installed or linked `chc` command.

## 6. Verification

- [ ] 6.1 Add tests for PowerShell script output.
- [ ] 6.2 Add tests for zsh script output.
- [ ] 6.3 Add tests for root command, nested command, shell name, and flag candidates.
- [ ] 6.4 Add tests for dynamic bundled script id candidates.
- [ ] 6.5 Run `pnpm --filter @cthutool/cli test`.
- [ ] 6.6 Run `pnpm --filter @cthutool/cli typecheck`.
- [ ] 6.7 Run `openspec status --change apps-cli-shell-completion`.
