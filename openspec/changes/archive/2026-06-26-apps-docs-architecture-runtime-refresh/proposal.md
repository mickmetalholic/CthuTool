## Why

After observability, public browser API, SDK, and installer changes, the architecture pages no longer show the full runtime topology. Readers need one coherent view that connects clients, backend APIs, desktop agents, browser SDK usage, GitOps deployment, and observability data flow.

## What Changes

- Refresh topology and runtime placement docs for observability, public browser API/SDK, and client installation boundaries.
- Update backend/web architecture docs for `/metrics`, `/health/ready`, client event ingestion, public browser API, and browser SDK flow.
- Update package map/source references for `packages/browser-client`, observability GitOps files, and relevant specs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Refresh architecture documentation to reflect current runtime topology and implementation boundaries.

## Impact

- Affects architecture and runtime placement docs under `apps/docs/src/content/docs/`.
- No runtime code changes are expected.
