## 1. Confirm ownership and migration boundaries

- [ ] 1.1 Verify the active CthuOps Backend Deployment, image-promotion instructions, and repository link; record the external ownership boundary in CthuTool documentation.
- [ ] 1.2 Confirm where the existing PixelPlayground Argo CD Application is owned before deleting CthuTool's `gitops/` tree, and record the outcome or migration follow-up.
- [ ] 1.3 Inventory active CthuTool references to `k8s/`, `gitops/`, Loki, Tempo, Grafana, Alloy, Prometheus stack, and the OpenTelemetry Collector so no deployment path is left undocumented.

## 2. Keep Backend CI image-only

- [ ] 2.1 Remove `k8s/**` and other CthuTool deployment-manifest assumptions from `scripts/ci/affected-workflow.mjs` and its contract tests.
- [ ] 2.2 Verify `.github/workflows/backend.yml` only validates, builds, and publishes the Backend image to GHCR, with no Kubernetes manifest update or deployment step.
- [ ] 2.3 Update Backend image CI OpenSpec requirements and related CI documentation to describe CthuOps as the external digest-promotion and rollout owner.

## 3. Remove CthuTool-owned deployment state

- [ ] 3.1 Remove the CthuTool `k8s/` manifests after the CthuOps and unrelated-application ownership checks pass.
- [ ] 3.2 Remove CthuTool's `gitops/` Argo CD, namespace, and cluster deployment manifests, preserving an explicit pointer to CthuOps where operators need a deployment entry point.
- [ ] 3.3 Update or remove deployment contract tests that read deleted Kubernetes or Argo CD files.

## 4. Remove the CthuTool cluster observability stack

- [ ] 4.1 Remove the Prometheus/Grafana/Loki/Tempo/Alloy/OpenTelemetry Collector GitOps Applications and platform documentation from CthuTool.
- [ ] 4.2 Remove CthuTool Kubernetes OTEL environment wiring and Prometheus scrape annotations while preserving application-level metrics and optional tracing code.
- [ ] 4.3 Remove or update observability stack contract tests and active GitOps observability requirements so they no longer require CthuTool-managed storage, collectors, dashboards, or alert rules.
- [ ] 4.4 Update application observability and structured-log requirements to remain collector-neutral and preserve stdout/stderr, `/metrics`, request context, and local diagnostic behavior.

## 5. Align documentation and active specifications

- [ ] 5.1 Update quick-start, deployment, operations, architecture, repository-boundary, and GitOps reference pages to point at CthuOps instead of CthuTool paths.
- [ ] 5.2 Correct package-local Backend development commands and distinguish local development from external homelab deployment.
- [ ] 5.3 Verify archived OpenSpec changes and generated agent adapter files remain untouched.

## 6. Validate the cleanup

- [ ] 6.1 Run OpenSpec validation and confirm the change artifacts remain apply-ready.
- [ ] 6.2 Run targeted Backend/Web/CLI checks and relevant contract tests after the file removals; confirm application observability imports and runtime APIs still compile.
- [ ] 6.3 Run `git diff --check` and search for stale active references to CthuTool-owned `k8s/`, `gitops/`, or the removed platform observability stack.
- [ ] 6.4 Separately render the CthuOps Kustomize roots and confirm its Backend deployment remains valid before releasing a new image.
