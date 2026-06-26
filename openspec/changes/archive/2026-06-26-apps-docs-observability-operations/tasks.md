## 1. Source Review

- [x] 1.1 Review current `k8s/`, `gitops/apps/observability-*`, `gitops/observability/README.md`, backend metrics/health code, and observability specs.

## 2. Operations Documentation

- [x] 2.1 Add `operations/observability.md` and include it in sidebar and operations overview.
- [x] 2.2 Update `operations/health-logs.md` and `operations/gitops-rollouts.md` for `/health`, `/health/ready`, `/metrics`, structured logs, and Prometheus/Loki/Tempo checks.
- [x] 2.3 Update deployment configuration docs for OTEL environment variables, readiness probe semantics, and Prometheus Service annotations.

## 3. Reference and Specs

- [x] 3.1 Update `reference/gitops.md` with observability namespace, Application CRs, and `gitops/observability/` paths.
- [x] 3.2 Update `reference/backend-apis.md` for `/health/ready`, `/metrics`, and client-event ingestion if relevant.
- [x] 3.3 Ensure the OpenSpec capability index remains synchronized.

## 4. Validation

- [x] 4.1 Run focused docs validation or equivalent docs index/build/typecheck steps.
- [x] 4.2 Run `openspec validate apps-docs-observability-operations --strict`.
