## 1. Release contract and publication

- [x] 1.1 Update `packages/agent-release/src/contracts.ts` with the self-use manifest schema/provenance, non-required signature fields, HTTPS/size/SHA-256 validation, catalog binding, and generated-version rules.
- [x] 1.2 Update `packages/agent-release/src/publication.ts` and `packages/agent-release/src/cli.ts` to build and validate unsigned self-use manifests/receipts without platform certificates, notarization, detached archive signatures, channel pointers, or protected production inputs.
- [x] 1.3 Update `packages/agent-release/src/contracts.spec.ts` and `packages/agent-release/src/publication.spec.ts` for valid self-use manifests, rejected legacy/unknown contracts, catalog/archive mismatches, missing integrity metadata, and the absence of signing prerequisites.

## 2. Repository catalog and bundle build

- [x] 2.1 Add `release/agent/environments.json` from the approved non-secret deployment catalog and validate that it contains no Agent secrets or operator credentials.
- [x] 2.2 Update `.github/actions/build-agent-bundle/action.yml` to use an explicit self-use mode, read the repository catalog, skip Apple/Windows signing, notarization, and Ed25519 signing, and retain target assembly, inventory, checksums, receipts, and clean-host smoke validation.
- [x] 2.3 Update bundle and workflow-facing tests/fixtures, including `packages/agent-release/src/assembly.spec.ts`, `packages/agent-release/src/workflow.spec.ts`, and catalog fixtures, for versioned self-use assets and unsigned receipts.

## 3. Automatic latest-release workflow

- [x] 3.1 Rewrite `.github/workflows/agent-release.yml` to trigger relevant `main` pushes and optional manual dispatch, generate `0.0.<github.run_number>`-style versions, and remove the release-tag trigger, `agent-production` environment, channel input, and signing secret requirements.
- [x] 3.2 Add a single self-use publication concurrency group and ensure the aggregate job waits for every supported target, catalog validation, inventory, checksum, and smoke result before publication.
- [x] 3.3 Upsert the GitHub Release with the internal `agent-latest` tag, upload versioned target artifacts/checksums/receipts/catalog before `manifest.json`, and verify that the manifest references one coherent artifact set.
- [x] 3.4 Keep pull-request validation artifacts isolated from `agent-latest`, and cover the workflow contract with the existing release workflow tests or an equivalent static validation.

## 4. CLI latest resolution and lifecycle

- [x] 4.1 Update `apps/cli/src/infra/agent-release-installer.ts` to fetch the fixed `agent-latest/manifest.json`, accept only the self-use schema, remove the pinned public-key/channel-pointer/archive-signature path, and retain HTTPS, catalog, size/SHA-256, safe-extraction, compatibility, and smoke checks.
- [x] 4.2 Update `apps/cli/src/infra/agent-lifecycle-service.ts` and `apps/cli/src/command/agent.command.ts` so install/update have one latest-release mode and no `--channel` or remote version selector, while local versioned activation and rollback remain unchanged.
- [x] 4.3 Update `apps/cli/tests/unit/agent-release-installer.test.ts`, `apps/cli/tests/unit/agent-lifecycle-service.test.ts`, and `apps/cli/tests/integration/agent-command.test.ts` for latest resolution, removed options, unsigned integrity validation, unavailable latest releases, and rollback preservation.

## 5. Documentation and migration

- [x] 5.1 Update `docs/agent-release.md`, `apps/docs/src/content/docs/reference/cli.md`, and relevant release-key/catalog README text to describe the single automatic unsigned self-use mode, generated versions, `agent-latest`, OS warning handling, and its lack of authenticity guarantees.
- [x] 5.2 Remove instructions that require `agent-production`, Apple/Windows certificates, Ed25519 keys, manual release tags, or stable/beta channel promotion from the supported self-use workflow.
- [x] 5.3 Document local rollback and the source-revert/rebuild procedure for remote recovery, and state that Agent secrets remain local and are not part of the catalog or bundle.

## 6. Verification and handoff

- [x] 6.1 Run OpenSpec validation for `simplify-agent-self-use-release` and confirm all proposal, design, spec, and task artifacts are complete without modifying neighboring changes.
- [x] 6.2 Run the affected package/CLI tests plus target-file ESLint and TypeScript checks, then run `git diff --check`.
- [x] 6.3 Perform one authorized manual workflow dispatch or equivalent dry-run verification covering both target artifacts, manifest-last publication, fresh-host smoke, CLI install/update, and local rollback before enabling the automatic path.
