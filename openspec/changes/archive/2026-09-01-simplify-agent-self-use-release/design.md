## Context

The repository currently has a production-oriented Agent release pipeline. A protected `agent-production` environment supplies a non-secret catalog and signing credentials, the build action signs/notarizes platform artifacts, the publication job signs a manifest and archive set, and the CLI resolves stable/beta channel pointers using a pinned release key. This is appropriate for authenticated public distribution, but the requested operating model is a private self-use build maintained by one user.

The supported bundle contents and runtime safety checks remain valuable: every target still needs the native tray, pinned Node runtime, headless Agent, catalog, licenses, inventory validation, clean-host smoke coverage, SHA-256 checks, safe extraction, atomic activation, and local rollback. The change is therefore a release-contract and workflow simplification, not a reduction of bundle or lifecycle correctness checks.

## Goals / Non-Goals

**Goals:**

- Build supported macOS and Windows targets automatically from `main` without user-managed release tags.
- Publish one latest self-use release with no signing credentials, platform certificates, notarization, release signatures, protected GitHub environment, or stable/beta channels.
- Keep HTTPS transport, archive size/SHA-256 verification, catalog validation, compatibility checks, smoke checks, safe extraction, and local atomic rollback.
- Make the CLI install and update the latest self-use build through one deterministic endpoint.
- Make the mutable publication safe against concurrent runs and partially uploaded assets.

**Non-Goals:**

- This is not a design for public distribution, tamper-resistant update authenticity, or bypassing macOS Gatekeeper/Windows SmartScreen.
- Do not remove the Agent secret, local protected storage, backend authentication, environment validation, or process/lifecycle safety checks.
- Do not preserve stable/beta promotion, arbitrary remote version selection, or a signed-release compatibility mode in the simplified CLI.
- Do not redesign the native tray, bundled runtime, Web deployment, or backend protocols.

## Decisions

### 1. Use `main` pushes and generated versions

The release workflow will trigger on relevant pushes to `main` and retain a manual `workflow_dispatch` rebuild path. It will generate a valid semver such as `0.0.<github.run_number>` for bundle metadata, rather than reading a user-created tag. The workflow will create or update the GitHub Release whose internal tag is `agent-latest`; that tag is an implementation detail of the publisher and is never a manual release step.

Manual tags and per-version immutable releases were considered. Tags make a single-user release depend on an extra manual operation, while immutable releases add history and cleanup policy that the user does not need. The generated version is still required for installation layout, diagnostics, and cache-busting.

### 2. Make the self-use manifest an explicit schema version

Introduce a new manifest schema version for the unsigned self-use contract. A self-use manifest identifies `provenance.kind = self-use` and carries the release version, compatibility metadata, catalog schema/digest, archive URL, byte size, archive SHA-256, and layout version. Archive detached signatures and platform-signing/notarization assertions are not required for this schema; the build receipt records that those gates were intentionally not used.

The CLI will accept only the new self-use contract for this mode and will fail closed on unknown schemas. This prevents an older signed-channel client from silently interpreting an unsigned manifest as a trusted production release. Keeping the old schema and making signatures conditionally optional was considered, but would leave ambiguous semantics and make accidental public-channel use easier.

SHA-256 remains an integrity and corruption check after the manifest is fetched over HTTPS. It does not authenticate the manifest or protect against a compromised repository, GitHub release, or network endpoint. That limitation is documented and is an explicit trade-off of self-use mode.

### 3. Keep the environment catalog in the repository

The release input will be a tracked, schema-versioned non-secret catalog at `release/agent/environments.json`, populated from the existing deployment values. CI will validate its IDs, namespaces, origins, endpoints, and absence of secrets, then bind its digest into the manifest. Agent secrets continue to be entered and stored locally by the CLI and are never copied into the catalog or archive.

A protected GitHub secret/environment value was considered, but it would reintroduce the configuration burden this change is intended to remove. If a future deployment treats an endpoint itself as confidential, that deployment is outside this self-use contract and must not be silently added to the catalog.

### 4. Publish versioned assets behind one latest manifest

Each build will retain versioned archive and catalog names so a client holding the previous manifest can continue downloading the previous bytes while a new run is being published. The publish job will upsert the `agent-latest` release, upload all target archives, checksums, receipts, and catalog assets first, and upload `manifest.json` last. Old versioned assets will not be deleted as part of the atomic publication path; they are inert unless referenced by a manifest.

The workflow will use a single concurrency group for self-use publication and cancel stale in-progress runs. The manifest is the only selector the CLI follows, so a client never needs to enumerate release history or channel pointers. Fixed asset names were considered, but replacing a fixed archive while an old manifest is still live could create a manifest/bytes mismatch; versioned names avoid that race.

### 5. Remove signature and channel plumbing from the self-use CLI

`chc agent install` and `chc agent update` will fetch the fixed `agent-latest/manifest.json` URL and select the current supported target. They will no longer accept `--channel`, resolve a channel pointer, fetch detached archive signatures, or require a pinned release public key. The commands will retain catalog binding, URL/size/SHA-256, compatibility, safe-extraction, layout, and startup smoke validation before atomic activation.

Remote `--version` selection was considered, but a single mutable self-use release has no supported remote version-selection API. Local version directories and the existing rollback path remain the recovery mechanism. A remote rollback is performed by reverting the source change and allowing the workflow to publish a new generated version.

### 6. Reuse validation and make signing absence intentional

The bundle action will use one explicit self-use build mode for `main`/manual releases. It will skip certificate, notarization, Ed25519 signing, and protected-environment lookups while continuing to run assembly, inventory, catalog, checksum, and clean-host smoke steps on every target. Pull-request validation remains unsigned and must never upload to `agent-latest`.

The absence of a certificate will therefore be a deliberate configuration of the workflow, not a failed production precondition. macOS and Windows users may still see Gatekeeper, SmartScreen, or similar warnings; documentation will explain that the artifacts are intended for the repository owner and are not signed for general distribution.

## Risks / Trade-offs

- **[No update authenticity]** A valid HTTPS response can still point to a malicious or replaced manifest. → Document the self-use boundary, keep the repository/release private where appropriate, and preserve HTTPS plus SHA-256 checks for accidental corruption.
- **[Unsigned platform warnings]** macOS and Windows may warn or block launch. → Document the manual trust/open steps required for the owner; do not weaken operating-system protections in code.
- **[Mutable release publication race]** A client could observe a release during upload. → Use versioned asset names, one workflow concurrency group, upload assets before the manifest, and retain old assets.
- **[Old CLI incompatibility]** Existing clients understand signed v1 channel manifests, not the new self-use schema. → Version the manifest contract, fail clearly on unsupported schema, and deploy the CLI change before switching the workflow.
- **[Catalog drift]** A tracked catalog can become stale or point at an invalid deployment. → Validate every build, bind the catalog digest into the manifest, and fail the aggregate publish when catalog or smoke checks fail.
- **[No one-click remote rollback]** There is no stable/beta pointer to move backward. → Keep local atomic rollback and retained versions; remote rollback is a source revert followed by an automatic rebuild.

## Migration Plan

1. Implement the new self-use manifest contract and CLI resolution/validation while the existing release workflow remains available.
2. Add and validate the repository-managed non-secret environment catalog and update fixtures/tests.
3. Change the bundle action and workflow to the self-use mode, remove protected signing inputs, and enable `main` push publication with the `agent-latest` concurrency group.
4. Run one manual self-use workflow to verify both target archives, manifest-last publication, fresh-host smoke behavior, unsigned launch instructions, and CLI install/update.
5. For a local failure, use the existing atomic rollback to restore the previous active version. For a remote failure, revert the offending source commit and let the next run publish a new generated version.

## Open Questions

- Confirm whether the GitHub repository/release should remain private. The design assumes the release is for the repository owner; public visibility does not make the unsigned artifacts authenticated.
- Confirm the exact deployed environment entries to place in `release/agent/environments.json`; implementation can start from the current production catalog/fixtures, but no secret values should be copied.
