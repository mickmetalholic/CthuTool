## 1. Metrics Foundation

- [x] 1.1 Add a backend Prometheus client dependency and update lockfile/package metadata consistently.
- [x] 1.2 Create a backend metrics module/service that owns the Prometheus registry, metric definitions, and label-safety helpers.
- [x] 1.3 Add `GET /metrics` on the existing backend HTTP port with Prometheus-compatible text exposition and content type.
- [x] 1.4 Decide and document whether default Node.js process metrics are enabled in the first implementation.

## 2. Backend Instrumentation

- [x] 2.1 Record HTTP request count and duration from one request lifecycle point with bounded method, route/category, status class, and outcome labels.
- [x] 2.2 Record readiness dependency status metrics for browser agent availability and diagnostics storage.
- [x] 2.3 Record browser task runner queue length, active count, duration, and outcome metrics.
- [x] 2.4 Record agent command dispatch count and duration metrics for success, failure, timeout, and unavailable outcomes.
- [x] 2.5 Ensure instrumentation does not change existing request, readiness, browser task, or agent command behavior when metrics recording fails.

## 3. Label Safety

- [x] 3.1 Keep request IDs, trace IDs, command IDs, raw URLs, query strings, subject IDs, profile paths, tokens, cookies, HTML, screenshots, and free-form error messages out of metric labels.
- [x] 3.2 Normalize routes, task labels, command types, dependency names, status classes, and outcomes to bounded values before recording metrics.
- [x] 3.3 Add tests or helper assertions that catch unsafe label keys or high-cardinality label values.

## 4. Tests and Verification

- [x] 4.1 Add backend unit tests for metrics service registration and label normalization.
- [x] 4.2 Add backend e2e tests that `GET /metrics` returns scrape-compatible output and includes required CthuTool metric families.
- [x] 4.3 Add tests covering HTTP, readiness, browser task, and agent command metric recording.
- [x] 4.4 Run affected backend test, typecheck, and lint commands.
- [x] 4.5 Run `openspec status --change apps-backend-prometheus-metrics` and verify all artifacts are apply-ready.
