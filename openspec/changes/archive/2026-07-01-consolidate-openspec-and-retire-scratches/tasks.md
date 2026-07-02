## 1. OpenSpec Change Artifacts

- [x] 1.1 Create proposal, design, delta specs, and task list for retiring scratches and consolidating low-signal specs.
- [x] 1.2 Validate `consolidate-openspec-and-retire-scratches` before implementation.

## 2. Retire Scratches And Collection Hub

- [x] 2.1 Delete `scratches/collection-hub/**`.
- [x] 2.2 Remove Collection Hub module docs, docs navigation, capability index entries, and root README references.
- [x] 2.3 Update root AGENTS/OpenSpec naming guidance so it no longer points agents at `scratches/collection-hub`.
- [x] 2.4 Update root contract tests so they assert the root workspace boundary without referencing the deleted scratch workspace.

## 3. Consolidate OpenSpec Capabilities

- [x] 3.1 Move retired backend browser marker requirements into `apps-backend-browser-service` and delete standalone marker specs.
- [x] 3.2 Move agent state exclusion into `apps-backend-agent-registry` and delete `apps-backend-agent-state`.
- [x] 3.3 Create `gitops-delivery` from bootstrap, ArgoCD Application, and namespace specs; delete the old small GitOps specs.
- [x] 3.4 Move backend image delivery into `apps-backend-image-ci` and delete `apps-backend-image-delivery`.
- [x] 3.5 Move package observability requirements into `packages-agent-protocol` and `packages-app-shell-runtime`; delete the standalone package observability specs.
- [x] 3.6 Delete Collection Hub specs and update `openspec/specs/README.md`.

## 4. Verification

- [x] 4.1 Run OpenSpec validation for the active change and all main specs.
- [x] 4.2 Run root contract tests that cover workspace boundaries and generated-output exclusions.
- [x] 4.3 Run repository searches to confirm live `scratches/collection-hub` and Collection Hub references are gone except archived changes if intentionally preserved.
- [x] 4.4 Review `git diff` for scope.
