# Agent release fixtures

`catalog.valid.json` is deliberately non-secret and uses reserved example
domains. Unit tests construct versioned layout, manifest, channel, archive,
signature, and digest fixtures from this catalog. Test-only Ed25519 key pairs are
generated in memory so no private signing key is checked into the repository.

Negative fixtures cover unknown manifest schemas, unsupported targets, old CLI
versions, altered catalogs, altered archives, invalid signatures, partial
extraction, failed activation, production references to unsigned PR artifacts,
and missing production matrix/signing attestations.
