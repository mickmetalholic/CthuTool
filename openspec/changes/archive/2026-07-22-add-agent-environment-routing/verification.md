# Verification

| Boundary | Evidence |
| --- | --- |
| Catalog and local isolation | `packages/agent-runtime/src/environment.spec.ts` |
| Switch drain, namespace change, degraded target | `packages/agent-runtime/src/runtime-service.spec.ts` |
| Protocol environment/generation and secret rejection | `packages/agent-protocol/src/index.spec.ts` |
| Public operator and Agent-secret boundary | `apps/backend/src/modules/operator-access/single-operator-access.service.spec.ts`, `apps/backend/e2e/agent-access.e2e-spec.ts` |
| Registry generation and environment isolation | `apps/backend/src/modules/agent/registry/agent-registry.service.spec.ts` |
| Explicit environment routing/no fallback | `apps/backend/src/modules/agent/command-gateway/agent-command-gateway.service.spec.ts` |
| Structural diagnostics redaction | `apps/backend/src/observability/backend-observability.service.spec.ts`, `packages/agent-runtime/src/observability.spec.ts` |
