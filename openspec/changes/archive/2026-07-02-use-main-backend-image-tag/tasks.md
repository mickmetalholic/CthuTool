## 1. Backend Image Workflow

- [x] 1.1 Remove the `Pin deployment manifest to commit image` step from `.github/workflows/backend.yml`.
- [x] 1.2 Remove the `Commit deployment manifest update` step from `.github/workflows/backend.yml`.
- [x] 1.3 Reduce workflow permissions so the main-branch publish job no longer requests repository `contents: write` solely for deployment manifest commits.
- [x] 1.4 Confirm the workflow still publishes both `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>` for qualifying `main` pushes.

## 2. GitOps Deployment Manifest

- [x] 2.1 Change `k8s/deployment.yaml` to use `ghcr.io/mickmetalholic/cthutool-backend:main`.
- [x] 2.2 Keep `imagePullPolicy: Always` on the backend container.
- [x] 2.3 Ensure no repository workflow step attempts to commit `k8s/deployment.yaml` directly to `main`.

## 3. Documentation And Tests

- [x] 3.1 Update backend image CI tests or affected-workflow tests that assert deployment manifest pinning behavior.
- [x] 3.2 Update GitOps/backend deployment documentation to state that `:main` requires Argo CD Image Updater digest strategy or an equivalent rollout trigger for automatic redeploys.
- [x] 3.3 Run formatting or lint checks for changed workflow, manifest, docs, and tests.

## 4. Verification

- [x] 4.1 Run OpenSpec validation for `use-main-backend-image-tag`.
- [x] 4.2 Run the targeted repository tests covering backend image workflow behavior.
- [x] 4.3 Verify `git status` does not include generated agent adapter files under `.claude/`, `.codex/`, or `.cursor/`.
- [ ] 4.4 After merge, confirm the backend image workflow succeeds on `main` without a deployment manifest push attempt.
- [ ] 4.5 Confirm the deployment environment has Argo CD Image Updater digest tracking or another rollout trigger configured before relying on automatic rollout from `:main`.
