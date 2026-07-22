# Verification

Completed on 2026-07-22.

## Release tooling

- `pnpm --filter @cthutool/agent-release lint`
- `pnpm --filter @cthutool/agent-release typecheck`
- `pnpm --filter @cthutool/agent-release test` — 34 tests passed
- `pnpm --filter @cthutool/agent-release build`

The tests cover exact catalog and manifest contracts, Ed25519 signatures,
catalog/archive tampering, unsupported targets, old CLI versions, unknown
schemas, deterministic archives, forbidden UI inventory, partial staging,
failed activation, production matrix aggregation, channel isolation, pinned
Node downloads, workflow gates, and bundled-Node smoke behavior.

## Runtime and tray compatibility

- `pnpm --filter @cthutool/agent-runtime lint`
- `pnpm --filter @cthutool/agent-runtime typecheck`
- `pnpm --filter @cthutool/agent-runtime test` — 37 tests passed
- `pnpm --filter @cthutool/agent lint`
- `pnpm --filter @cthutool/agent typecheck`
- `pnpm --filter @cthutool/agent test` — 2 tests passed
- `cargo fmt --all -- --check`
- `cargo test -p cthutool-agent-tray` — 29 tests passed
- `cargo clippy -p cthutool-agent-tray --all-targets -- -D warnings`

## Real archive smoke

The macOS arm64 test downloaded the locked Node.js 24.14.1 archive, verified
SHA-256 `25495ff85bd89e2d8a24d88566d7e2f827c6b0d3d872b2cebf75371f93fcb1fe`,
and verified its Apple code signature. A real `pnpm --prod deploy` Agent and
release-mode native tray were assembled with that runtime. With no system Node
available to the child process, the smoke test loaded the catalog, selected the
production fixture, observed the loopback bridge, fetched `/v1/bootstrap`,
requested coordinated shutdown, and confirmed lock cleanup.

## Workflow and OpenSpec

- YAML parsing for the workflow and composite action passed.
- `actionlint v1.7.7 .github/workflows/agent-release.yml` passed.
- `openspec validate add-agent-release-artifacts --strict --json` passed with
  no issues.
- `git diff --check` passed.
- `.claude/`, `.codex/`, and `.cursor/` had no generated-adapter changes.
