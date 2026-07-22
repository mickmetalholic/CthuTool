# Agent release and signing

The CthuTool local Agent ships as a versioned native bundle. The deployed Web
application remains independent and is never packaged or served by the local
Agent.

## Supported bundles

The release matrix is the checked-in contract in
`release/agent/supported-targets.json`:

- macOS arm64 (`darwin-arm64`)
- macOS x64 (`darwin-x64`)
- Windows x64 (`windows-x64`)

Each archive includes the native tray, Node.js 24.14.1 from the checksummed
upstream archive, compiled Agent code, production dependencies including
Playwright, a non-secret environment catalog, and license notices. Inventory
validation rejects Electron applications, WebView runtimes, desktop renderer
content, deployed Web application content, and mutable user data.

The immutable bundle root contains `layout.json`, target-specific tray and Node
entry points, `agent/dist/index.js`, `agent/environments.json`, and licenses.
Environment selection, Agent secrets, browser profiles, logs, and runtime locks
remain in the user-scoped data root outside `versions/<version>`.

## Environment catalog

Production catalog JSON is supplied through the protected
`AGENT_ENVIRONMENT_CATALOG_JSON` secret. It has `schemaVersion: 1` and a
non-empty `profiles` array. Every profile contains only:

- `environmentId`, `label`, and a unique local `namespace`
- an exact HTTPS `webOrigin`
- the same-origin exact `/agent` HTTPS `webAgentUrl`
- an HTTPS backend URL and WSS Agent endpoint

Credentials, operator sessions, local bridge tickets, and Agent secrets are
invalid catalog fields. Catalog bytes are included in each archive and bound to
the signed manifest by schema version and SHA-256 digest.

## Pull-request validation

Pull requests build all supported targets with deterministic inputs and run the
bundle using its bundled Node while `PATH` is empty. The smoke test loads the
catalog, selects an environment, checks local-bridge readiness, and requests a
coordinated shutdown.

PR archives include `-unsigned-pr-` in the filename and use
`pull-request-validation` provenance. Contract validation prevents them from
appearing in production manifests or channel pointers. They expire after seven
days and are not GitHub Release assets.

## Protected production requirements

Production jobs use the `agent-production` GitHub environment and fail before
publication if any protected input is absent:

- `AGENT_ENVIRONMENT_CATALOG_JSON`
- `AGENT_RELEASE_PRIVATE_KEY_PEM` and `AGENT_RELEASE_PUBLIC_KEY_PEM` (an
  Ed25519 pair; the public key is also pinned by the consuming CLI)
- `MACOS_CERTIFICATE_P12_BASE64`, `MACOS_CERTIFICATE_PASSWORD`, and
  `MACOS_SIGNING_IDENTITY`
- `MACOS_NOTARY_KEY_ID`, `MACOS_NOTARY_ISSUER_ID`, and
  `MACOS_NOTARY_KEY_P8`
- `WINDOWS_CERTIFICATE_PFX_BASE64` and
  `WINDOWS_CERTIFICATE_PASSWORD`

The macOS job verifies the upstream Node signature, signs the tray application,
submits it to Apple notarization, staples the ticket, and validates the staple.
The Windows job verifies the upstream Node Authenticode signature, signs the
tray executable, and runs `signtool verify`. Each platform then re-archives the
signed staging tree, performs the bundled-Node smoke, signs the archive, and
emits a validation receipt.

Publication is fail-closed. The aggregate job requires all three receipts,
revalidates the catalog and manifest, signs the canonical immutable manifest,
and verifies the manifest signature, catalog binding, every archive size and
digest, and every detached archive signature before creating the versioned
GitHub Release.

## Immutable versions and channel rollback

Version assets live under the `agent-v<version>` GitHub Release tag and are
never overwritten. A small signed `stable` or `beta` channel pointer is the only
mutable publication object.

The manual `rollback` workflow accepts an existing version. It downloads that
version's manifest, catalog, archives, and detached signatures, verifies the
complete signed set, creates a new signed channel pointer, and only then replaces
the mutable channel assets. A missing artifact, old schema, digest mismatch, or
invalid signature leaves the current channel unchanged.

Production publishing remains intentionally disabled until the protected
environment and every signing secret above are configured. This is required
even for a single-user installation because a public download path is still a
software supply-chain boundary.
