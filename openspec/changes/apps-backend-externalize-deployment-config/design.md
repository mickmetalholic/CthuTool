## Context

The CthuTool repository currently contains two different kinds of operational
configuration:

1. Backend image production in `apps/backend/Dockerfile` and
   `.github/workflows/backend.yml`.
2. Cluster desired state in `k8s/` and `gitops/`, including the Backend
   Deployment, Argo CD Applications, and a Prometheus/Grafana/Loki/Tempo/Alloy
   and OpenTelemetry Collector stack.

The separate `CthuOps` repository now owns the homelab cluster. It already
contains a Kustomize-rendered CthuTool Deployment, Service, Ingress, digest
pinning, Argo CD bootstrap, and a manual image-promotion workflow. CthuTool
should not retain a second copy of that desired state.

The Backend and client runtimes also contain application-level diagnostics:
structured stdout/stderr records, request context, Prometheus-compatible
metrics, optional OTLP tracing, and local Web/CLI/Agent diagnostics. Those are
runtime contracts rather than cluster deployment configuration and remain in
scope.

## Goals / Non-Goals

**Goals:**

- Make CthuTool an image-producing source repository for the Backend.
- Remove CthuTool-owned Kubernetes, Argo CD, and cluster observability
  manifests.
- Keep Backend image CI, code-quality CI, tests, and Agent release workflows
  working independently of Kubernetes files.
- Remove CthuTool-specific OTEL collector wiring and platform logging-stack
  contracts.
- Preserve application diagnostics and public runtime behavior.
- Update documentation and OpenSpec requirements so CthuOps is the explicit
  deployment source of truth.

**Non-Goals:**

- Do not modify the CthuOps repository in this change.
- Do not remove Backend structured logging, `/metrics`, `/api/client-events`,
  request correlation, optional tracing, or local client diagnostics.
- Do not redesign Backend authentication, TLS, Secret management, or image
  promotion automation in CthuOps.
- Do not change Backend APIs or runtime behavior.
- Do not archive or modify unrelated OpenSpec changes.

## Decisions

### 1. CthuOps is the only cluster desired-state owner

Remove CthuTool's `k8s/` and `gitops/` deployment ownership rather than
maintaining a forwarding copy. CthuTool's Backend workflow continues to publish
GHCR tags; CthuOps pins a verified digest and lets Argo CD reconcile it.

**Alternative considered:** Keep the old manifests as documentation or a second
Argo CD source. Rejected because two desired-state sources can drift and the
old manifests already describe a different image-promotion model.

### 2. Backend CI is image-only

Keep `.github/workflows/backend.yml` for pull-request image validation and
main-branch GHCR publication. Remove `k8s/**` from affected-input detection and
remove any wording or behavior that implies the workflow updates deployment
manifests. Root CI remains responsible for lint, typecheck, test, and build.

**Alternative considered:** Add cross-repository writes from CthuTool directly
to CthuOps as part of this cleanup. Rejected for this change; the existing
CthuOps digest-promotion PR process remains the boundary and can be automated
later as a separate change.

### 3. Remove the platform observability stack, not application diagnostics

Delete the CthuTool GitOps Applications and documentation for Prometheus,
Grafana, Loki, Tempo, Grafana Alloy, and the OpenTelemetry Collector. Remove
the CthuTool `k8s` OTEL environment wiring and platform contract tests.

Keep runtime code that writes safe structured records to stdout/stderr, exposes
Prometheus-compatible metrics, accepts bounded client diagnostic events, and
optionally exports traces when an external deployment supplies an endpoint.
Rewrite application specs so they describe collector-neutral contracts rather
than requiring Loki or a CthuTool-managed Prometheus stack.

**Alternative considered:** Remove all `observability` and `metrics` source
modules. Rejected because those modules are imported by health, browser, Agent,
and error-handling paths and because local diagnostics remain a deliberate
runtime capability.

### 4. Rewrite repository documentation to express the ownership boundary

Deployment and operations pages will point operators to CthuOps for Kubernetes,
Argo CD, TLS, Secrets, and image digest promotion. They will identify the
external deployment platform as the current owner of cluster logging and
observability. CthuTool documentation will retain local development and Backend
image-build guidance.
Historical archived OpenSpec artifacts remain untouched; active requirements
that describe the old ownership are changed or removed through this change's
delta specs.

### 5. Accept deferred PixelPlayground handover

The old CthuTool `gitops/` tree includes a PixelPlayground Application in
addition to CthuTool and observability resources. CthuOps currently owns only
the CthuTool Backend and Emby, so PixelPlayground is not migrated as part of
this change. The accepted decision is to remove its old CthuTool Application
and namespace now, record that the handover is deferred, and let a future
CthuOps change restore ownership if the workload is still needed. This change
must not claim that PixelPlayground has already been migrated.

## Risks / Trade-offs

- **[Risk] Existing operators still apply CthuTool's old GitOps paths** → Update
  quick-start and operations docs to link CthuOps and remove the old commands;
  validate that no active workflow still references `k8s/` or `gitops/`.
- **[Accepted trade-off] Deleting `gitops/` also removes the PixelPlayground
  Application** → accept the temporary loss of CthuTool desired-state
  ownership, retain the migration note, and create a separate CthuOps change
  before the workload needs continued GitOps management. This cleanup does not
  itself delete live cluster resources.
- **[Risk] Platform log collection disappears before an external platform
  replaces it** → keep application stdout/stderr diagnostics and state
  explicitly that cluster log storage is an external deployment-platform
  responsibility; CthuOps may take it over later.
- **[Risk] Contract tests fail after source removal** → Replace deployment and
  observability-stack contract tests with image-only and external-ownership
  assertions; do not weaken unrelated CI checks.
- **[Risk] CthuOps and CthuTool release timing diverge** → Keep immutable GHCR
  SHA tags and the CthuOps digest-promotion process; do not reintroduce mutable
  deployment state in CthuTool.

## Migration Plan

1. Verify CthuOps contains the active Backend Deployment and record the
   ownership/promotion link in CthuTool documentation.
2. Update active specs, CI affected-path logic, tests, and documentation to
   remove CthuTool-owned deployment and cluster-observability assumptions.
3. Remove the CthuTool `k8s/` and `gitops/` trees after the accepted deferred
   PixelPlayground handover decision is recorded.
4. Run repository-targeted lint, typecheck, tests, and `git diff --check`.
5. Validate the external CthuOps Kustomize roots separately in the CthuOps
   repository before deploying an updated Backend image.

Rollback is a Git revert of the CthuTool cleanup commit. Since CthuOps is not
modified by this change, the active cluster desired state remains available
there during rollback.

## Deferred Follow-up

- If PixelPlayground remains active, create a separate CthuOps change for its
  Argo CD Application and namespace before relying on CthuOps as its desired
  state owner.
- Should CthuOps later own Prometheus scrape annotations and OTLP configuration,
  or should the cluster platform remain entirely log/metric-system agnostic?
- CthuOps must add production Backend configuration before a new image is
  promoted: `CTHUTOOL_ENVIRONMENT_ID=production` matching the Agent catalog,
  `CTHUTOOL_OPERATOR_ACCESS_MODE=trusted-proxy`,
  `CTHUTOOL_TRUSTED_PROXY_IPS` matching the ingress controller source IPs and
  supplied through the out-of-band Backend Secret, a `CTHUTOOL_AGENT_SECRET`
  (32+ characters) in that Secret, and an Ingress TLS secret for
  `cthutool.cthulhu.home.arpa`. Prepared in a separate CthuOps pull request on branch
  `cthutool-production-config`.
