## Context

`scratches/collection-hub` is an isolated experimental workspace with its own package manager state, local docs, tests, and OpenSpec capabilities. Root workspace tests currently assert that this scratch workspace remains outside root orchestration. The user has decided the scratch directory will not be used going forward, so keeping both the directory and its specs would make the repository describe obsolete behavior.

The spec set also includes several first-level capability directories whose only purpose is to state that an old module is retired or that a narrow boundary belongs to another owner. Those specs are useful historically, but they make the current capability map noisier than necessary.

## Goals / Non-Goals

**Goals:**

- Remove `scratches/collection-hub` and all live docs/tests that describe it as a maintained or experimental workspace.
- Remove the Collection Hub specs from the active OpenSpec set.
- Consolidate low-signal specs into existing owner specs where the requirement remains relevant.
- Keep the GitOps deployment requirements available under a single delivery capability.
- Keep the OpenSpec capability map aligned with the remaining first-level specs.

**Non-Goals:**

- Do not migrate Collection Hub into `apps/*` or `packages/*`.
- Do not preserve Collection Hub runtime APIs, package names, or local development commands.
- Do not merge active backend browser content/auth/runtime/public-api/protocol/sdk specs.
- Do not edit archived OpenSpec changes except for the completed change archived before this work started.
- Do not change generated agent adapter outputs.

## Decisions

1. Retire Collection Hub completely.

   The scratch workspace is deleted instead of promoted. Its four specs are removed from the active spec set because they no longer describe maintained behavior.

2. Move remaining boundary requirements to their owner specs.

   Retired backend browser module requirements belong with `apps-backend-browser-service`, and the agent-state exclusion belongs with `apps-backend-agent-registry`. This preserves the useful boundary assertions without keeping one-requirement marker capabilities.

3. Create `gitops-delivery`.

   Bootstrap, namespace, and ArgoCD Application requirements are all part of the same delivery surface. Consolidating them into one capability reduces noise while keeping `gitops-observability-stack` separate because it owns a larger platform concern.

4. Absorb observability specs only where ownership is already obvious.

   `packages-agent-protocol-observability` moves into `packages-agent-protocol`, and `packages-app-shell-observability` moves into `packages-app-shell-runtime`. Broader app-level observability specs remain separate.

5. Keep active product/module specs separate.

   Specs such as backend browser content/auth/service/runtime/public-api and Collection Hub's removed module specs are not used as precedent for merging unrelated active domains.

## Migration Plan

1. Add delta specs that document removed capabilities and moved requirements.
2. Delete `scratches/collection-hub/**`.
3. Remove Collection Hub pages, navigation, and capability index entries from the docs site.
4. Update root README, AGENTS/OpenSpec naming guidance, and contract tests so they no longer mention the deleted scratch workspace.
5. Delete absorbed OpenSpec spec directories and update owner specs plus `openspec/specs/README.md`.
6. Validate OpenSpec, root tests, and relevant docs/build gates.

## Risks / Trade-offs

- [Risk] Deleting a scratch workspace may remove useful prototype code. Mitigation: the change is explicit and reviewable, and no migration is implied.
- [Risk] OpenSpec lacks a first-class capability-directory merge operation. Mitigation: delta specs record removed requirements and implementation tasks perform the directory cleanup manually.
- [Risk] Root tests that previously asserted scratch isolation may become too weak. Mitigation: tests should assert the positive root workspace contract for `apps/*` and `packages/*` instead of referencing a deleted path.
- [Risk] Docs navigation may keep stale module links. Mitigation: run repository searches for `scratches`, `collection-hub`, and `Collection Hub` after edits.

## Open Questions

- None. The requested direction is to remove `scratches`, not to migrate or preserve Collection Hub.
