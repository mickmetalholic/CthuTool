# Agent release signing keys

Self-use Agent releases are unsigned. The automatic `agent-latest` publication
path does not require Ed25519 keys, Apple or Windows certificates, notarization
material, or the protected `agent-production` GitHub environment.

Integrity for self-use installs is HTTPS transport plus archive size and SHA-256
checks bound by the self-use manifest. That is not an authenticity guarantee.

This directory remains only as a historical note for the retired signed-channel
workflow. Do not commit private keys here.
