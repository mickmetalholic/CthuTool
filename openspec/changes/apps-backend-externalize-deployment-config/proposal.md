## Why

CthuTool no longer owns homelab deployment state. Kubernetes manifests, Argo CD
Applications, image promotion, TLS, and cluster-level logging/observability are
managed by the separate `CthuOps` repository. Keeping a second deployment and
observability stack under CthuTool creates conflicting sources of truth and
leaves the repository's documentation and CI contracts describing a deployment
path that is no longer used.

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
- Preserve a clear note for any non-CthuTool application currently listed in
  the old GitOps tree so its deployment is not silently lost during cleanup.

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

## Impact

- Affected repository areas: `k8s/`, `gitops/`, `.github/workflows/backend.yml`,
  `scripts/ci/affected-workflow.mjs`, deployment/operations documentation,
  OpenSpec requirements, and deployment/observability contract tests.
- The separate `CthuOps` repository becomes the source of truth for Backend
  Deployment, Service, Ingress, Secrets, TLS, Argo CD, image digest promotion,
  and cluster logging/observability.
- Backend runtime APIs and local diagnostic behavior remain compatible; no
  application package or public API removal is intended by this change.
- Any workflows or operators that still expect CthuTool's `k8s/` or `gitops/`
  paths must switch to CthuOps before the removed files can be used.
