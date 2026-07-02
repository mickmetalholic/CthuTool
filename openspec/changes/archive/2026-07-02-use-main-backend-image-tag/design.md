## Context

The backend image workflow currently builds and pushes `ghcr.io/mickmetalholic/cthutool-backend:main` and `:<commit-sha>` for qualifying `main` pushes, then rewrites `k8s/deployment.yaml` to pin the deployment to the commit SHA image. The final commit/push step conflicts with repository rules that require changes to `main` to go through pull requests, so the workflow reports failure after a successful image publish.

The deployment manifest already uses `imagePullPolicy: Always`, and the repository is delivered by ArgoCD from the `k8s/` path. Moving the manifest to `:main` removes the need for CI to mutate Git on every backend image build, but mutable tags require a separate rollout trigger because ArgoCD auto-sync only reacts to Git/live-state drift.

## Goals / Non-Goals

**Goals:**

- Keep backend image publishing green under repository rules that block direct `main` pushes.
- Keep publishing immutable commit SHA tags for debugging and rollback references.
- Make `k8s/deployment.yaml` stable by referencing `ghcr.io/mickmetalholic/cthutool-backend:main`.
- Make the rollout dependency explicit: Argo CD Image Updater digest tracking, or another rollout trigger, must restart Pods when the `:main` digest changes.

**Non-Goals:**

- Do not add GitHub App bypass credentials or direct-push exemptions.
- Do not implement Argo CD Image Updater installation or cluster credentials in this repository.
- Do not remove commit SHA image publication.
- Do not change backend application runtime behavior.

## Decisions

1. Use `:main` as the deployment tag instead of `:latest`.

   `:main` matches the existing published tag and branch semantics. It is less ambiguous than `:latest` while still avoiding per-commit manifest rewrites.

2. Remove CI manifest rewrite and push steps.

   The backend image workflow should publish images only. Repository state changes should enter `main` through normal PR rules, or be handled by a purpose-built GitOps component. This avoids granting broad bypass permissions to GitHub Actions just to update one image line.

3. Keep `imagePullPolicy: Always`.

   `Always` ensures restarted Pods pull the current `:main` digest instead of reusing a stale node-local image. It does not itself trigger a rollout, so the requirement must be paired with an external update trigger.

4. Treat redeployment automation as GitOps runtime configuration.

   Argo CD Image Updater with digest strategy is the preferred mechanism for mutable tags because it can detect digest changes behind a stable tag. A manual or CI-triggered `kubectl rollout restart` remains a valid operational alternative, but it is not implemented by this change.

## Risks / Trade-offs

- Mutable tag deployments reduce Git manifest traceability for the exact running backend image. Mitigation: continue publishing `:<commit-sha>` tags and use image registry/cluster runtime metadata for audit and rollback.
- ArgoCD alone will not redeploy when only the registry digest behind `:main` changes. Mitigation: configure Argo CD Image Updater digest strategy or an equivalent rollout trigger before relying on fully automatic deployment.
- A rollout trigger failure can leave the cluster running the previous image while CI remains green. Mitigation: document the dependency and verify the live Deployment image digest during deployment monitoring.
