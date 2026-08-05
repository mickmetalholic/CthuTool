## Why

CthuTool no longer owns homelab deployment state. Kubernetes manifests, Argo CD
Applications, image promotion, and TLS are managed by the separate `CthuOps`
repository. Cluster-level logging and observability are an external deployment
platform responsibility that CthuOps may take over later. Keeping a second
deployment and observability stack under CthuTool creates conflicting sources
of truth and leaves the repository's documentation and CI contracts describing
a deployment path that is no longer used.

The Backend source repository should therefore remain responsible for building
and publishing its container image, while CthuOps remains responsible for
promoting and deploying that image. Application-level diagnostics remain in
place so removing the platform stack does not change runtime behavior or remove
useful local troubleshooting data.

## What Changes

- **BREAKING** Remove CthuTool-owned Kubernetes and GitOps desired-state files,
  including the in-repository Backend deployment and cluster observability
  Applications.
- Keep `.github/workflows/backend.yml` as the Backend image build and GHCR
  publication workflow; it must not update or deploy Kubernetes manifests.
- Remove Backend CI affected-path assumptions that refer to CthuTool-owned
  `k8s/` manifests.
- Remove CthuTool's Prometheus/Loki/Tempo/Alloy/OpenTelemetry Collector
  deployment configuration and cluster OTEL wiring.
- Keep Backend structured stdout/stderr logging, request context, metrics,
  `/metrics`, optional OTLP tracing code, and client/local diagnostic contracts.
- Update documentation and OpenSpec requirements to point deployment ownership
  at `CthuOps` and describe CthuTool as the image-producing repository.
- Update or remove contract tests that validate deleted deployment and
  cluster-observability files.
- Accept the PixelPlayground handover as deferred: remove its old CthuTool
  GitOps entry now, record that it has not yet migrated, and leave a follow-up
  for CthuOps to restore ownership if the workload is still needed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-backend-image-ci`: Backend CI publishes images only; deployment state
  and image promotion are externalized to CthuOps.
- `gitops-delivery`: Remove CthuTool-owned Kubernetes/Argo CD delivery
  requirements from this repository and document the external ownership
  boundary.
- `gitops-observability-stack`: Remove the CthuTool-owned cluster
  observability stack requirements; the platform stack is no longer managed by
  this repository.
- `apps-backend-observability`: Keep application observability behavior, but
  remove requirements that depend on a particular GitOps-managed collector or
  storage platform.
- `apps-runtime-structured-logs`: Keep the shared local structured-log
  envelope, but remove Loki-specific deployment assumptions.
- `apps-docs-site`: Make documentation requirements collector-neutral so the
  docs describe application-level diagnostics and an external deployment
  platform instead of CthuTool-managed Loki, Tempo, or OpenTelemetry
  Collector paths.

## Impact

- Affected repository areas: `k8s/`, `gitops/`, `.github/workflows/backend.yml`,
  `scripts/ci/affected-workflow.mjs`, deployment/operations documentation,
  OpenSpec requirements, and deployment/observability contract tests.
- The separate `CthuOps` repository becomes the source of truth for Backend
  Deployment, Service, Ingress, Secrets, TLS, Argo CD, and image digest
  promotion. Cluster logging and observability remain with the external
  deployment platform until a future ownership decision.
- PixelPlayground is intentionally not migrated by this change; its old
  CthuTool desired-state entry is removed and any future ownership transfer is
  a separate CthuOps change.
- Backend runtime APIs and local diagnostic behavior remain compatible; no
  application package or public API removal is intended by this change.
- Any workflows or operators that still expect CthuTool's `k8s/` or `gitops/`
  paths must switch to CthuOps before the removed files can be used.
