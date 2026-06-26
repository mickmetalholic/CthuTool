## Why

Recent backend and GitOps changes added production-facing observability behavior: `/health/ready`, `/metrics`, Prometheus scrape annotations, OTLP trace export configuration, and a GitOps-managed observability stack. The docs site still describes only basic health/log checks, so homelab operators do not have an accurate operations path.

## What Changes

- Add user/operator documentation for the Kubernetes observability stack: Prometheus, Grafana, Loki, Alloy, Tempo, and OpenTelemetry Collector.
- Update deployment configuration and operations docs for `/health`, `/health/ready`, `/metrics`, Service scrape annotations, and OTEL environment variables.
- Update GitOps reference material to include the `observability` namespace, observability Application CRs, and `gitops/observability/` support files.
- Link the docs to the observability and structured logging OpenSpec sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Document observability operations, Kubernetes probe semantics, metrics scraping, trace export configuration, and GitOps observability resources.

## Impact

- Affects Markdown content and sidebar navigation under `apps/docs/src/content/docs/`.
- May update root docs/source-boundary references if needed.
- No runtime code, Kubernetes manifest, or workflow behavior changes are expected.
