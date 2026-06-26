## 1. Alert Rule Contract

- [x] 1.1 Add OpenSpec requirements for CthuTool-specific Prometheus alert rules.
- [x] 1.2 Keep receiver configuration and notification secrets out of this change.

## 2. GitOps Rule Implementation

- [x] 2.1 Add CthuTool alert rules to the existing `kube-prometheus-stack` `additionalPrometheusRulesMap`.
- [x] 2.2 Cover backend scrape down, readiness degraded, high backend error rate, high p95 latency, browser task timeout activity, and agent command unavailable/timeout activity.
- [x] 2.3 Document rule scope, threshold intent, and future Alertmanager receiver setup.

## 3. Tests and Verification

- [x] 3.1 Add a contract test that parses the observability Application and verifies CthuTool alert rules are present.
- [x] 3.2 Run the focused contract test.
- [x] 3.3 Run `openspec validate gitops-observability-alert-rules --strict`.
