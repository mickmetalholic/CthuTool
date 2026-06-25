# Prometheus Rule Extension Point

Future CthuTool platform alert and recording rules should be added here or another GitOps-managed manifest path and labeled:

```yaml
observability.cthutool.io/rule-scope: platform
```

The kube-prometheus-stack Application configures Prometheus to select rules with that label.
