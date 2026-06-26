## Why

Prometheus and Alertmanager are deployed, and backend metrics are now exposed, but the stack does not yet define CthuTool-specific alerts. Without alert rules, operators must manually inspect Grafana to notice backend scrape failures, readiness degradation, high error rates, latency regressions, browser task timeouts, or desktop agent command failures.

## What Changes

- Add CthuTool-specific Prometheus alert rules through the existing `kube-prometheus-stack` Helm values.
- Cover backend target availability, readiness degradation, HTTP error rate, HTTP p95 latency, browser task timeouts, and agent command unavailable/timeout outcomes.
- Document alert ownership, routing expectations, and threshold intent in GitOps observability docs.
- Add a contract test that verifies the alert rules remain wired through `additionalPrometheusRulesMap` and use the expected metric families.

## Capabilities

### New Capabilities

### Modified Capabilities

- `gitops-observability-stack`: The observability stack gains CthuTool backend alert rules using the existing Prometheus/Alertmanager foundation.

## Impact

- Affected files: `gitops/apps/observability-kube-prometheus-stack/application.yaml`, `gitops/observability/README.md`, `gitops/observability/prometheus/rules/README.md`, and contract tests.
- Affected runtime: Prometheus evaluates CthuTool-specific alerting rules; Alertmanager receives firing alerts.
- Non-goals: no Alertmanager external receiver secrets, no notification provider setup, no backend metric changes, no Tempo tracing.
