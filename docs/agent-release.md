# Agent self-use release

The CthuTool local Agent ships as a versioned native bundle for private
self-use. The deployed Web application remains independent and is never packaged
or served by the local Agent.

This distribution mode protects HTTPS transport and accidental corruption with
SHA-256 checks. It is **not** an authenticated public release channel: there is
no platform code signing, notarization, or Ed25519 release signature, and a
compromised repository or GitHub Release can still publish a malicious
manifest.

## Supported bundles

The release matrix is the checked-in contract in
`release/agent/supported-targets.json`:

- macOS arm64 (`darwin-arm64`)
- macOS x64 (`darwin-x64`)
- Windows x64 (`windows-x64`)

Each archive includes the native tray, native setup executable
(`cthutool-agent-setup`), Node.js 24.14.1 from the checksummed upstream archive,
compiled Agent code, production dependencies including Playwright, Slint
attribution text, and license notices. Inventory validation rejects Electron
applications, WebView runtimes, desktop renderer content, deployed Web
application content, local HTML/JavaScript/CSS application assets, deployment
URL catalogs, and mutable user data.

The immutable bundle root contains `layout.json`, target-specific tray and setup
entry points, bundled Node, `agent/dist/index.js`, and licenses under
`licenses/` (including `LICENSE-SLINT.md`). Deployment Origin, browser profiles,
logs, legacy secret files, and runtime locks remain in the user-scoped data root
outside `versions/<version>`. Self-use installs no longer ship
`agent/environments.json`; users configure the Origin through the native setup
UI or `chc agent settings` after install. Existing `agent-secret` files are
ignored and left untouched.

## First-run configuration

A fresh archive starts the tray in `SetupRequired` and does not start the
headless Agent until a valid deployment Origin is saved. The
native setup executable is packaged next to the tray under `bin/` and is
launched for first-run / settings. After configuration, the Agent derives the
fixed `self-use` environment from the Origin.

## Release manifest

Self-use manifests use schema version 3. They describe compatible platform
archives, Agent/backend and bridge protocol compatibility, URL, byte size,
SHA-256 digest, provenance, and layout entry points (tray, setup, node, agent)
without a catalog schema/digest binding. Development-only environment catalogs
remain outside the self-use archive path.

## Automatic self-use publication

Relevant pushes to `main` and optional manual `workflow_dispatch` runs build
every supported target, validate inventory/native-setup/smoke results, and
publish one latest release. CI generates a semver such as
`0.0.<github.run_number>` for bundle metadata; you do not create or push a
release tag.

Publication upserts the GitHub Release whose internal tag is `agent-latest`,
uploads versioned archives, checksums, and receipts first, and uploads
`manifest.json` last. A single concurrency group cancels stale runs so the
latest manifest always references one coherent artifact set.

The self-use build mode intentionally skips Apple/Windows certificates,
notarization, and Ed25519 signing. macOS Gatekeeper and Windows SmartScreen may
still warn or block launch; open/trust the app as the repository owner when that
happens.

## CI failure diagnostics

Bundle smoke failures are prefixed so packaging issues are not confused with
runtime or connectivity problems:

| Prefix | Meaning |
| --- | --- |
| `NATIVE_SETUP_PACKAGING` | Inventory, forbidden assets/catalog/secrets, missing setup executable |
| `AGENT_RUNTIME` | SetupRequired/readiness/control protocol failures inside the bundled Agent |
| `BACKEND_CONNECTIVITY` | Local bridge bootstrap probe failures after Agent readiness |

Clean-host CI runs both a fresh-archive `SetupRequired` smoke and a
configured-archive readiness smoke before creating a target receipt.

## Pull-request validation

Pull requests build all supported targets with deterministic inputs and run the
bundle using its bundled Node while `PATH` is empty. Smokes verify
`SetupRequired` on a fresh user-data root, readiness with a configured Origin
and the absence of embedded catalogs/secrets.

PR archives include `-unsigned-pr-` in the filename and use
`pull-request-validation` provenance. They never upload to `agent-latest`, expire
after seven days, and are not GitHub Release assets.

## Install, update, and recovery

```bash
chc agent install
chc agent update
```

Both commands fetch the fixed HTTPS
`.../releases/download/agent-latest/manifest.json`, accept only the unsigned
self-use schema, and validate archive size/SHA-256, layout, compatibility, safe
extraction, and startup smoke before atomic activation. There is no `--channel`
or remote `--version` selector. Mutable Origin/profile data is preserved
across updates by default.

For a local failure, use the existing atomic rollback to restore the previous
active version retained under `versions/`. For a remote failure, revert the
offending source commit and let the next `main` or manual workflow publish a new
generated version.

## Derived endpoints

From one exact HTTPS Origin (no path, query, or hash):

| Derived value | Rule |
| --- | --- |
| Web Origin | the configured Origin |
| Web console | `Origin + /agent` |
| Backend HTTP | same Origin |
| Agent WebSocket | `wss://<host>/ws/agents` |
| Environment id / namespace | fixed `self-use` |

Development localhost HTTP is allowed only with an explicit development opt-in.
Reverse proxy ownership of `/agent`, Backend HTTP, and `/ws/agents` remains a
deployment concern; the Agent does not invent alternate paths.

## Troubleshooting

```bash
chc agent status          # SetupRequired vs ready / backend offline
chc agent status --json   # redacted machine-readable status
chc agent settings        # open native first-run / settings UI
chc agent doctor          # bounded redacted diagnostics
chc agent doctor --json
chc agent logs
```

Native vs Web settings ownership is documented in
`docs/agent-native-settings-boundary.md`. Origin is never set from the Web
console or CLI arguments.
