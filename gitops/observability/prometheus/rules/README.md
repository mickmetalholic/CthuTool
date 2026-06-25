# Prometheus Rule Extension Point

Future CthuTool platform alert and recording rules should preferably be added
through the `kube-prometheus-stack` chart's `additionalPrometheusRulesMap`
values. If rules are later managed as standalone `PrometheusRule` manifests,
verify they match the chart-managed Prometheus rule selector so built-in stack
rules remain active.

Use this project ownership label on CthuTool-specific rules:

```yaml
observability.cthutool.io/rule-scope: platform
```

Do not replace the default kube-prometheus-stack `ruleSelector` only with this
label; that can exclude the chart's built-in alerting and recording rules.
