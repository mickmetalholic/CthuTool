## ADDED Requirements

### Requirement: CthuTool Prometheus alert rules
The GitOps-managed observability stack SHALL define CthuTool-specific Prometheus alert rules for backend availability, readiness, latency, error rate, browser task timeout, and desktop agent command failure signals using existing metrics and bounded labels.

#### Scenario: Backend target alert is configured
- **WHEN** the kube-prometheus-stack GitOps Application values are inspected
- **THEN** they include an alert that fires when the CthuTool backend scrape target is down for a sustained window

#### Scenario: Backend readiness alert is configured
- **WHEN** backend readiness metrics report degraded state for a sustained window
- **THEN** Prometheus has a CthuTool alert rule that can notify Alertmanager of readiness degradation

#### Scenario: Backend request health alerts are configured
- **WHEN** backend HTTP request metrics show elevated error rate or high p95 latency
- **THEN** Prometheus has CthuTool alert rules for those symptoms using bounded metric labels

#### Scenario: Browser and agent operation alerts are configured
- **WHEN** browser task timeout metrics or agent command unavailable/timeout metrics are observed for a sustained window
- **THEN** Prometheus has CthuTool alert rules for those operational symptoms

#### Scenario: Notification receivers are deferred
- **WHEN** CthuTool alert rules are configured
- **THEN** they do not require environment-specific Alertmanager receiver secrets or external notification endpoints in this change
