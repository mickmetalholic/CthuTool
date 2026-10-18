## Context

See proposal.md for motivation. The source manager already resolves runtime, cwd, and a version-1 saved repository anchor; only the command adapter needs explicit registration. Current switching writes that anchor before npm or bootstrap verification.

## Goals / Non-Goals

Keep registry compatibility and automatic discovery while publishing an anchor only after a successful source selection. Git updates, bootstrap policy, registry schema, unrelated OpenSpec changes, and generated adapters are outside this change.

## Decisions

- Delete the register command and its arguments/registration entry. The shared discovery tree then removes execution, help, and completion together. A hidden alias would retain the redundant public contract, so it is not kept.
- Retain the validated internal registration helper and version-1 registry. Move its calls after installed-target verification inside the existing switch lock. For managed switches, remember the previous development candidate; for local switches, remember the selected candidate. An already-active local selection still repairs or establishes the anchor.
- Preserve the existing registry on validation, lock, bootstrap, relink, and postcondition failure. Registry persistence errors remain visible; filesystem/npm changes cannot form one atomic transaction and no automatic npm rollback is introduced.
- Update the authored CthuCodex workflow reference directly because the user explicitly requested this business-plugin change. Generated OpenSpec adapter skills remain unchanged.

## Risks / Trade-offs

- Existing scripts invoking register will fail: documentation and recovery hints direct callers to `source use <path>`, which intentionally switches the active source.
- A registry write can fail after npm succeeds: report the failure and preserve the installed-target checks; do not claim atomicity or silently roll back global npm state.

## Migration Plan

Ship the updated committed bundle, docs, and skill together. Existing registries need no migration. Reverting this change restores the command and prior ordering.
