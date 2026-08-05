## 1. Confirm ownership and migration boundaries

- [x] 1.1 Verify the active CthuOps Backend Deployment, image-promotion instructions, and repository link; record the external ownership boundary in CthuTool documentation.
- [x] 1.2 Confirm that CthuOps does not currently own the existing PixelPlayground Argo CD Application, accept the deferred handover, and record the follow-up.
- [x] 1.3 Inventory active CthuTool references to `k8s/`, `gitops/`, Loki, Tempo, Grafana, Alloy, Prometheus stack, and the OpenTelemetry Collector so no deployment path is left undocumented.

## 2. Keep Backend CI image-only

- [x] 2.1 Remove `k8s/**` and other CthuTool deployment-manifest assumptions from `scripts/ci/affected-workflow.mjs` and its contract tests.
- [x] 2.2 Verify `.github/workflows/backend.yml` only validates, builds, and publishes the Backend image to GHCR, with no Kubernetes manifest update or deployment step.
- [x] 2.3 Update Backend image CI OpenSpec requirements and related CI documentation to describe CthuOps as the external digest-promotion and rollout owner.

## 3. Remove CthuTool-owned deployment state

- [x] 3.1 Remove the CthuTool `k8s/` manifests after the CthuOps ownership check and deferred PixelPlayground decision are recorded.
- [x] 3.2 Remove CthuTool's `gitops/` Argo CD, namespace, and cluster deployment manifests, preserving an explicit CthuOps pointer and the deferred PixelPlayground handover note.
- [x] 3.3 Update or remove deployment contract tests that read deleted Kubernetes or Argo CD files.

## 4. Remove the CthuTool cluster observability stack

- [x] 4.1 Remove the Prometheus/Grafana/Loki/Tempo/Alloy/OpenTelemetry Collector GitOps Applications and platform documentation from CthuTool.
- [x] 4.2 Remove CthuTool Kubernetes OTEL environment wiring and Prometheus scrape annotations while preserving application-level metrics and optional tracing code.
- [x] 4.3 Remove or update observability stack contract tests and active GitOps observability requirements so they no longer require CthuTool-managed storage, collectors, dashboards, or alert rules.
- [x] 4.4 Update application observability and structured-log requirements to remain collector-neutral and preserve stdout/stderr, `/metrics`, request context, and local diagnostic behavior.

## 5. Align documentation and active specifications

- [x] 5.1 Update quick-start, deployment, operations, architecture, repository-boundary, and GitOps reference pages to point at CthuOps instead of CthuTool paths.
- [x] 5.2 Correct package-local Backend development commands and distinguish local development from external homelab deployment.
- [x] 5.3 Verify archived OpenSpec changes and generated agent adapter files remain untouched.
- [x] 5.4 Add a collector-neutral `apps-docs-site` spec delta so documentation requirements no longer require CthuTool-managed Loki, Tempo, or OpenTelemetry Collector paths.
- [x] 5.5 Soften observability ownership wording across docs to describe an external deployment platform that CthuOps may take over later.

## 6. Validate the cleanup

- [x] 6.1 Run OpenSpec validation and confirm the change artifacts remain apply-ready.
- [x] 6.2 Run targeted Backend/Web/CLI checks and relevant contract tests after the file removals; confirm application observability imports and runtime APIs still compile.
- [x] 6.3 Run `git diff --check` and search for stale active references to CthuTool-owned `k8s/`, `gitops/`, or the removed platform observability stack.
- [x] 6.4 Separately render the CthuOps Kustomize roots and confirm its Backend deployment remains valid before releasing a new image.
