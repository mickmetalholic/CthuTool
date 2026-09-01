# Agent release fixtures

`catalog.valid.json` remains available for development-only catalog validation
helpers. Self-use archives and manifests no longer embed or bind a deployment
URL catalog; unit tests construct versioned layout, self-use manifest, archive,
and digest fixtures without `agent/environments.json`.

Negative fixtures cover unknown or legacy manifest schemas, unsupported targets,
old CLI versions, altered archives, missing integrity metadata, partial
extraction, failed activation, embedded catalogs, self-use references to
unsigned PR artifacts, and missing self-use matrix/smoke attestations.
