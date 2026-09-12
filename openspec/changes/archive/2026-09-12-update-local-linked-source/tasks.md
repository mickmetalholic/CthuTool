## 1. Update behavior

- [x] 1.1 Make default local-linked update/check select the running Git checkout; verify unit tests cover safe target and non-Git source.
- [x] 1.2 Preserve tracked changes while allowing nonconflicting untracked files in a linked local checkout; verify managed dirty behavior and local Git collision protection.
- [x] 1.3 Skip global reinstall when updating the running local checkout; verify unit and integration results retain status and identity fields.

## 2. Documentation and validation

- [x] 2.1 Update CLI, root, and docs-site lifecycle documentation for local auto-update and bundle rebuild; verify the old blocked-mode guidance is gone.
- [x] 2.2 Run targeted tests, typecheck, build the committed CLI bundle, strict OpenSpec validation, and scoped diff checks; verify generated agent Skills and CthuCodex plugin remain unchanged.
- [x] 2.3 Sync only this change's three delta specs, archive it, and verify the main specifications match the implemented behavior.
