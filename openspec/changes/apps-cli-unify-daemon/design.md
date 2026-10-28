## Context

See `proposal.md` for motivation and the delta specs for observable contracts. Inspection of the current tree established these implementation boundaries:

- `apps/agent/src/index.ts` composes configuration/migration, locks, `AgentRuntimeService`, `AgentControlServer`, the local HTTP bridge, a `ws` client, and Playwright. The reusable execution core is already in `packages/agent-runtime`; Rust does not execute browser commands.
- `apps/cli/src/infra/agent-platform.ts` starts an installed Rust tray. Its macOS registration is a LaunchAgent and its Windows registration is an HKCU Run value; crash supervision lives in the Rust tray rather than in that Windows registration.
- `packages/agent-runtime/src/control-protocol.ts` already provides versioned socket/named-pipe management, but its operations are limited to health/status/shutdown, bridge launch, and environment selection. Configuration and Profile management must replace the removed UI/HTTP entrypoints.
- `apps/web/src/app/agent`, the bridge client, dedicated proxy/CSP/headers, and `agent-bridge-protocol` form one removable local-Web boundary. The Web home is a separate management scaffold.
- The Backend already exposes browser session/actions/close APIs and routes commands over Agent WSS with environment/Agent/connection-generation correlation. `@cthutool/browser-client` wraps those APIs with controlled page helpers and has no runtime package dependencies.
- Root CLI installation uses `apps/cli/bin/chc.mjs`, committed `apps/cli/dist` output, system Node 24, and the source installation/update flow. The current updater can mutate the source checkout and does not provide whole-CLI transactional rollback.
- The SDK is `private: true`, points at untracked `dist` output, and has no external package/release workflow. Its build configuration extends repository TypeScript settings, so consumers should receive compiled output rather than build its source.

Some main specs still mix catalog/native/Web requirements with the newer single-Origin self-use implementation. This change explicitly removes obsolete requirement blocks instead of leaving contradictory obligations after the refactor. It does not sync or archive neighboring changes.

## Goals / Non-Goals

**Goals:**

- Separate short-lived CLI management from one long-lived user-owned Node runtime while sharing one installation and build identity.
- Keep the runtime locally diagnosable without Backend/Chrome readiness, with one authority for configuration and Profile mutations.
- Give macOS, Windows, and Linux the same command contract and explicit platform-service behavior.
- Preserve existing user data and Backend/SDK browser semantics while reducing local protocols and release artifacts.
- Make the existing SDK installable from a versioned prebuilt GitHub archive in another repository.

**Non-Goals:**

- New device scheduling/selection APIs, public enrollment/API credentials, remote daemon administration UI, arbitrary code execution, or attaching to everyday user Chrome sessions.
- A privileged machine-wide service, a replacement custom watcher, a new HTTP bridge, or a single-file executable distribution.
- Whole-CLI immutable version activation/automatic rollback, remote graphical login for headless servers, and support for every Linux init system.
- Renaming existing Backend wire methods/package identities or modifying generated skills/the protected business plugin. Any stale plugin-facing command examples require a separate authorized plugin change.

## Decisions

### 1. One CLI package with a lazy daemon composition entrypoint

Move the assembly work from `apps/agent/src/index.ts` into an `apps/cli/src/daemon` composition boundary. Register a public `daemon.command.ts` through the existing static command registry. Keep runtime behavior in `@cthutool/agent-runtime`; provide separate lightweight control/types and execution exports so help, completion, version, and source diagnostics do not eagerly import Playwright.

Build a dedicated daemon JavaScript artifact with the CLI distribution. Both background launch and `chc daemon start --foreground` execute the same composition/lifecycle code; the extra artifact is an implementation detail of one installed CLI, not a separately installed Agent. Services use absolute Node/CLI entrypoint paths, the data root, and explicit arguments rather than a shell command string.

```text
External app --> browser-client SDK --> Backend HTTP API
                                           |
                                           | Agent WSS
                                           v
chc daemon commands -- private IPC --> Node runtime --> Playwright --> host Chrome
                                           ^
                                           |
                               Native current-user service manager
```

Retain the internal `agent-runtime`, `agent-protocol`, `browser-runtime-protocol`, and `browser-client` package names. The public command name is `daemon`; the existing remote `agent.hello`, `agent.heartbeat`, `agentId`, and browser method names remain compatible.

Alternatives considered: simply renaming the old command would retain the tray/install layers; merging the execution engine into CLI command files would couple browser logic to terminal rendering; introducing a separate daemon distribution would recreate the ownership/version split.

### 2. Finite management commands and one foreground runtime path

The canonical command set is:

| Command | Ownership/effect |
| --- | --- |
| `chc daemon setup [--origin ...]` | Terminal wizard or non-interactive initial configuration; no implicit start/autostart |
| `chc daemon config show/set` | Supported typed configuration; daemon-owned writer when running |
| `chc daemon start [--foreground]` | Select managed/unmanaged background ownership, or occupy this terminal |
| `chc daemon stop/restart` | Exact identity-checked cleanup and explicit replacement |
| `chc daemon status/logs/doctor` | Local read-only state, redacted logs, bounded diagnostics |
| `chc daemon profile list/login/verify/remove` | Typed local operations against the running daemon |
| `chc daemon autostart enable/disable/status` | Owned future-start registration; no silent run-mode replacement |

`start` checks configuration, then instance identity/locks, launches once, and waits for local control readiness. It does not wait for Backend registration. Chrome failure produces browser-unavailable state and no advertised browser capability. Backend failure produces reconnecting state without replacing the process. Missing setup fails before a persistent process is established.

Finite commands preserve the existing non-interactive/error/one-JSON-value contracts. Foreground execution and followed logs are explicitly streaming operations; reject incompatible one-result JSON combinations rather than mixing progress with a management result. Status reports configured/process/backend/browser/service dimensions separately, plus CLI and running build identities so an older process is visible even if package versions are both `0.0.0`.

Instance records carry protected data-root ownership, actual launch paths, PID/process-start identity, random nonce, protocol version, launch mode, and build identity. Reuse locks and nonce handshakes, extending identity checks to all three platforms. Never terminate by process name or PID alone. Normal stop rejects new work, closes owned browser resources, releases locks/endpoints, and exits; timeout escalation revalidates the exact process first.

Alternative considered: separate public `run` and `start --foreground` paths. One public foreground flag is sufficient and avoids divergent initialization and signal handling.

### 3. Private IPC replaces the HTTP management boundary

Remove local HTTP binding, bootstrap tickets, Web bearer sessions, loopback-fetch permissions, and bridge-specific protocol types. Expand the existing socket/named-pipe control boundary with bounded typed operations for configuration and Profile list/login/verify/remove. Keep these types with lightweight runtime control exports rather than creating another protocol package.

The runtime owns configuration and Profile mutation while active; a stopped CLI configuration command obtains an exclusive configuration lock and rechecks daemon ownership before writing. A shared facade routes local browser work and Backend browser work through the same existing execution queue and Profile-use checks. Deletion requires explicit confirmation and refuses occupied Profiles. No public arbitrary RPC/evaluate endpoint is introduced.

Upgrade the local control version for the expanded contract; keep only the minimal legacy same-user health/shutdown client required for takeover. Remote WSS/browser wire versions do not need a rename-driven break. Validate effective socket/file permissions and Windows named-pipe/record user isolation in platform tests, not just random endpoint names.

Read-only commands must not call migration helpers that create files as a side effect. Run migration only during explicit setup/start under ownership locks. Diagnostics may inspect stopped configuration and logs without starting the daemon.

Alternatives considered: retaining a loopback JSON server preserves the removed browser trust/bootstrap machinery; allowing CLI commands to write running Profile/config files independently creates competing writers.

### 4. Single deployment configuration and host-owned browser data

Keep the current user data root, stable Agent ID, and existing `environments/self-use` browser namespace. The runtime connection view needs the deployment Origin, derived Backend HTTP/WSS addresses, fixed `self-use` environment, and data paths; remove Web Agent URL/Origin binding and catalog selection from normal configuration.

For stopped setup/configuration, schema-valid input can be saved offline and connectivity is reported as unverified. For an active connection, verify a candidate Origin through a bounded temporary WSS client with a transient Agent ID before committing. The probe neither takes the active Profile lock nor replaces the registered real device. On success, stop accepting old work, close old sessions, commit atomically, and reconnect; on verification failure leave the known-good deployment intact. Disabled connections skip network probing. Invalid field/path/protocol input never persists.

Host Chrome remains an external prerequisite: discover standard installations through the existing Chrome channel or use an explicit executable path. Playwright runs as a daemon dependency and launches owned Chrome processes with independent site/Profile directories. CLI login opens a visible context owned by the daemon, returns after opening, and leaves it alive after the CLI exits; verification is explicit or follows the existing verified close behavior when a verify URL is supplied. URL inputs come from a Backend challenge or explicit CLI arguments, not a duplicate local site implementation.

Linux headless execution works when Chrome/system dependencies and suitable Profiles are present. Human login needs an actual graphical session; return a clear prerequisite error instead of attempting a hidden authentication flow or exporting cookies. Existing Backend site/action allowlists and bounded results remain unchanged.

Alternative considered: renaming/moving data directories with the command rename adds unnecessary Profile migration risk. Multiple daemon deployments/environments and a remote-desktop login mechanism are deferred; multiple site/account browser Profiles remain supported.

### 5. Native service adapters with explicit run modes

Use an adapter per platform for query/register/unregister/start/stop/restart/refresh operations:

| Platform | Managed execution |
| --- | --- |
| macOS | Current-user LaunchAgent, absolute Node/CLI paths, failure-only keepalive with native throttling |
| Windows | Current-user scheduled task with interactive-token logon and finite failure retry settings; replace the old HKCU Run entry |
| Linux | systemd user unit with restart-on-failure and rate limiting; no system-wide install or implicit linger |

All adapters run the foreground entrypoint in the user context. Capture required non-secret runtime settings explicitly rather than assuming a login shell environment. Status exposes the actual manager, availability, registration, running launch mode, and effective restart policy. Windows retry intervals differ from Unix policies; do not advertise the old Rust supervisor's timing on every platform.

Ordinary `start` without registration uses a detached child and no automatic process supervisor. When registration is active, start/restart use the owned native adapter; stop coordinates manager intent and clean IPC shutdown so it is not immediately revived. Enabling/disabling future-login registration does not silently kill/relaunch an existing healthy daemon. Keep active service ownership distinct from future registration; explicit restart performs any mode handover. Never let both launch paths own the Profile root.

On Linux without a usable systemd user session, foreground and detached operation stay available while autostart reports unavailable. Browser login remains tied to the execution host's interactive session; enabling a privileged service or remote login is not a fallback.

Alternatives considered: the Windows Run registry cannot replace tray crash supervision; a new Node/Rust watcher adds another custom process; universal boot-time system services introduce privilege and interactive-browser problems.

Reference semantics: [Apple launchd jobs](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html), [Windows failure restart settings](https://learn.microsoft.com/en-us/windows/win32/taskschd/taskschedulerschema-restartonfailure-settingstype-element), [interactive task logon](https://learn.microsoft.com/en-us/windows/win32/taskschd/principal-logontype), and [systemd service restart](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html).

### 6. Existing Backend and SDK remain the remote path

Keep `POST /api/browser/sessions`, session actions, and session closure. Backend continues to hold routing metadata while the daemon holds real pages/contexts/Profiles. Requests carry environment, Agent ID, generation, and command ID; loss of connection fails pending work rather than replaying state-changing browser actions. Automatic Agent selection retains the existing unique-match behavior; new explicit machine selection is outside this change.

CLI local management remains possible while Backend is offline. Other services use the SDK/Backend path; this change does not add general local-service browser IPC access or new Backend configuration/Profile APIs. Removing Web `/agent` does not imply relocating that administration UI to another route.

The private-network socket-peer boundary stays unchanged and is not equivalent to arbitrary Internet device registration. Align self-use deployment examples with Backend `CTHUTOOL_ENVIRONMENT_ID=self-use`; retain existing external HTTP access guidance and private Agent WSS routing.

Alternative considered: exposing daemon CDP or full Playwright objects would change the current bounded protocol and data ownership. Preserve the remote controlled API subset.

### 7. One CLI distribution and coordinated source updates

Extend root package files/dependencies, `build-cli-dist.mjs`, committed artifact checks, and affected-input detection to include the daemon entry and shared runtime/protocol/migration sources. Keep system Node 24 as the installation prerequisite. Bundle suitable JS or ship explicit production dependencies/resources for Playwright and `ws`; verify the resulting install outside the checkout under `--ignore-scripts`, without consumer compilation or automatic browser download. Multiple internal artifacts/dependency files are compatible with one user-facing installation.

Do not preserve `packages/agent-release` as a second CLI version manager. Retire the Agent publication workflow, Rust build action/target matrix, catalog fixtures, `agent-latest` resolution, and bundle-specific activation after migration dependencies are removed. Historical installed archives are user-owned recovery data, not automatically deleted by this change.

Add daemon-aware coordination to the existing source update plan/apply boundary. Check-only, blocked, and no-op flows do not disrupt the daemon. For a real safe update, verify target payload completeness and installation ownership before stopping; preserve running/stopped and registration state, update the source/install through existing safety rules, refresh only owned launch paths, then restart if previously running. If another installation would be affected, fail before mutation; an unrelated daemon is never controlled.

On failure after stopping, attempt recovery only through an entrypoint and dependency payload that can still be verified. Report phase, source/build identity, and actual daemon outcome; never reset/stash a linked checkout or report a rollback that did not occur. This replaces the old standalone Agent rollback contract with explicit failure recovery. Whole-CLI atomic version snapshots would be a separate distribution change.

Alternatives considered: adding `chc daemon update` with its own artifact channel recreates independent versions; promising the old rollback semantics over mutable source updates is inaccurate; adding a full CLI release manager would significantly expand this change.

### 8. Standalone SDK tarballs on GitHub Releases

Keep `@cthutool/browser-client` runtime-independent and `private: true`. Add an explicit packed-file allowlist for JS, declarations, package metadata, and documentation. CI builds and packs the SDK before publication; consumers never execute repository TypeScript builds or workspace lifecycle hooks.

Use independent package semver and tag `browser-client-vX.Y.Z`, archive `cthutool-browser-client-X.Y.Z.tgz`, and a matching GitHub Release. A tag-driven workflow validates the exact tagged revision/version, tests source and the exact archive, and publishes with GitHub-only permissions. Record the source revision and SHA-256; allow idempotent reuse only for byte-identical published assets, otherwise fail. Pull requests validate packaging without publishing. CLI/daemon-only changes do not create an SDK release.

External installation uses a fixed versioned archive URL with npm or pnpm and the same import name. Consumers commit dependency/lockfile updates and explicitly choose another URL to upgrade; no mutable latest download URL is the documented dependency. `private: true` prevents registry publication but does not prevent archive installation. Avoid direct Git subdirectory installation as the default because current dist output is not committed and consumer builds inherit monorepo configuration.

Run clean external npm and pnpm installs against the archive, check import and declaration resolution, and exercise a bounded request against a test Backend HTTP server. Verify the consumer has no access to this repository, workspace dependencies, Playwright, or Chrome. SDK methods remain the existing controlled page helpers; no new remote API or full Playwright compatibility is implied.

References: [npm archive dependencies and private packages](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) and [pnpm supported package sources](https://pnpm.io/package-sources).

### 9. Removal and documentation are part of the same change

Remove the complete local-Web feature slice: Agent route/help pages and tests, bridge Fetch client and tests, Agent-only CSP helper/proxy/header configuration, TypeScript/test aliases, and Web dependency on the bridge protocol. `/agent` and `/agent/help` resolve as removed routes; do not introduce redirects that revive local access. Keep generic redaction protections even if historical ticket-shaped test examples remain useful.

Remove bridge lifecycle fields and exports from runtime/control/health; update repository-owned CLI help, completion, Agent/browser architecture/deployment documentation, package maps, and CI inputs. Explicitly retire native/tray/bridge/release/Web requirement blocks in the deltas. Keep main spec synchronization and archiving for the completion workflow. Retain the existing unrelated pending changes and the protected plugin unchanged.

## Risks / Trade-offs

- [Playwright resources work only inside the workspace] -> Install packed CLI and SDK artifacts in isolated directories with production-only dependencies; run daemon/browser smoke checks on all three OSes.
- [Managed stop immediately restarts or two launch modes race] -> Record launch ownership, coordinate the native manager, and test stop/restart/autostart handover with the same lock/nonce contracts.
- [Windows user-session tasks cannot open login Chrome or have different recovery behavior] -> Use interactive-token registration, test real user-session behavior, and expose native retry limits/timing.
- [Linux lacks systemd user services or a graphical session] -> Keep explicit unmanaged fallback, distinguish browser/headless prerequisites from login prerequisites, and do not elevate privileges automatically.
- [Old tray competes for the same Profile] -> Validate legacy identity, stop it gracefully, remove only its startup registration, and require clean lock ownership before daemon launch.
- [Source update leaves a stopped daemon after a failure] -> Preflight before disruption, recover only verified payloads, and report exact stopped/restored state without destructive checkout rollback.
- [Single self-use naming collides with old documentation] -> Preserve wire identity, update deployment examples, and test Backend environment mismatch diagnostics rather than adding a new authentication scheme.
- [SDK tarball is replaced or accidentally publishes to npm] -> Independent fixed version/digest, conflict refusal, `private: true`, GitHub-only workflow permissions, and external install checks against the exact archive.
- [Removing UI loses local administration] -> Ship CLI setup/config/Profile operations before retiring the native/Web entrypoints.

## Migration Plan

1. Implement/test bridge-free composition and typed local control in the reusable runtime, preserving existing remote browser behavior.
2. Implement the public daemon commands, build identity, configuration writer, Profile operations, and same-user legacy takeover. Preserve existing filesystem roots and data schemas where possible; back up any rewritten configuration metadata, not raw browser data exports.
3. Add native adapters and isolated lifecycle/registration tests for macOS, Windows, and Linux; cover no-systemd and no-GUI cases explicitly.
4. Integrate daemon payload packaging and source-update coordination. Verify a clean installation before retiring the standalone Agent runtime/build/release paths.
5. Remove obsolete native/Web/bridge packages and wiring, update repository-owned guidance, and validate Backend/SDK session parity against the CLI-hosted daemon.
6. Add the independent SDK archive workflow and clean consumer tests; publication occurs only through its release trigger, never as a side effect of implementing or committing this change.

Rollback during development is a code-revision decision, not an automatic product promise. Existing Profiles, logs, and historical Agent archives remain preserved; before manually returning to an older runtime, stop the exact new daemon and its competing registration and verify configuration compatibility. Do not start old/new owners concurrently or overwrite user checkouts to simulate update rollback.
