## Context

The observability stack is managed by Argo CD using the upstream `kube-prometheus-stack` chart. The chart values currently leave `additionalPrometheusRulesMap` empty but document it as the preferred extension point for custom rules. The backend now exposes Prometheus metrics using `cthutool_backend_*` names and the stack already scrapes annotated CthuTool backend services.

## Goals / Non-Goals

**Goals:**

- Add conservative CthuTool alert rules through `additionalPrometheusRulesMap`.
- Use existing backend metric families and Prometheus `up` target status.
- Keep labels bounded and avoid request/trace/command identifiers in alert labels.
- Document rule intent and future tuning points.
- Verify rule wiring with a repository contract test.

**Non-Goals:**

- Do not configure external Alertmanager receivers such as email, Slack, PagerDuty, or webhooks.
- Do not add recording rules unless required for clear alerts.
- Do not deploy standalone `PrometheusRule` manifests in this first rule change.
- Do not change backend metric names or instrumentation.

## Decisions

### Use `additionalPrometheusRulesMap`

Place CthuTool alert groups in the existing kube-prometheus-stack Helm values. This keeps the rule selector compatible with the chart-managed Prometheus and avoids introducing a separate CRD manifest whose selector compatibility would need extra validation.

### Start with conservative warning/critical rules

Use simple rules that cover common failure modes:

- backend scrape target down
- backend readiness degraded
- elevated 5xx/error outcome rate
- high p95 HTTP latency
- browser task timeout activity
- agent command unavailable or timeout activity

Thresholds should be conservative and easy to tune after real operational data is available.

### Keep notification routing out of scope

Alertmanager is already enabled, but notification routing requires environment-specific receiver secrets and escalation policy choices. This change only creates alert signals.

## Risks / Trade-offs

- [Risk] Alert thresholds are too noisy for a homelab deployment. -> Mitigation: use `for` windows and warning severity for operational symptoms that need tuning.
- [Risk] Rules reference metric names before a new backend image is rolled out. -> Mitigation: Prometheus handles absent series; backend target-down still catches scrape availability.
- [Risk] YAML embedded in Helm values is easy to regress. -> Mitigation: add a contract test that parses the Argo CD Application and checks the expected rules.

## Migration Plan

1. Add CthuTool alert groups to `additionalPrometheusRulesMap`.
2. Document rule scope and future receiver setup.
3. Add a contract test for alert rule presence and key expressions.
4. Validate OpenSpec and run focused contract tests.

Rollback is a GitOps rollback of the Argo CD Application values. Removing rules stops new alerts without changing backend behavior.

## Open Questions

- Which external Alertmanager receivers should be configured in a future environment-specific change?
