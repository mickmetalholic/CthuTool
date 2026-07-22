# Agent release signing keys

Production release manifests use Ed25519 signatures over canonical JSON. The CLI
must pin the corresponding public key and key id before production publication is
enabled. Private keys are stored only in the protected `agent-production` GitHub
environment and are read from a temporary file or masked secret, never from a
command-line argument.

This repository intentionally contains no placeholder production key. The release
workflow fails closed unless both `AGENT_RELEASE_PRIVATE_KEY_PEM` and
`AGENT_RELEASE_PUBLIC_KEY_PEM` are provided and form a valid signing pair.
