# Verification

Completed on 2026-07-22 from the repository worktree.

## Public contract

- `chc agent` exposes `install`, Agent-only `update`, `start`, `stop`,
  `restart`, `status`, `settings`, `logs`, `env`, `autostart`, `doctor`, and
  `uninstall` through the static command registry.
- `env` exposes `list`, `get`, `set`, and `set-secret`; `autostart` exposes
  `enable`, `disable`, and `status`. Completion tests derive the same tree.
- Success and error responses use schema version 1 and stable Agent-specific
  error codes. Integration tests confirm JSON stdout remains parseable and
  excludes secrets, bridge tickets, and instance nonces.
- `set-secret` has no plaintext argv form. Stdin and user-private file input
  write a mode-0600 file on Unix and a user-only ACL on Windows.

## Release and lifecycle safety

- Installer tests use an Ed25519-signed production manifest, three-target
  matrix, signed archive, and manifest-bound HTTPS/WSS environment catalog.
- Tests cover archive tampering, unsafe catalog origins, path traversal,
  unsupported platforms, corrupt/interrupted extraction, failed smoke cleanup,
  altered local same-version contents, and idempotent reinstall.
- Download and extraction limits are enforced while streaming/decompressing;
  GitHub CDN redirects must remain HTTPS.
- Active/previous pointers remain atomic and mutable user data remains outside
  version roots. A failed running update restores the prior pointer, readiness,
  and autostart launcher.

## Clean lifecycle smoke

The targeted fixtures exercise the requested sequence without touching the
developer's real installation:

1. signed clean install and bundled smoke;
2. verified environment listing/selection and stdin secret configuration;
3. exact-instance readiness plus idempotent start contracts;
4. fresh tray `open` request for deployed-Web settings;
5. running environment switch over authenticated same-user local control;
6. tray-owned coordinated stop and record removal;
7. staged update, simulated readiness failure, prior-version rollback, and
   autostart repointing;
8. default uninstall preserving selection/secrets/profiles/logs, followed by a
   separately confirmed purge test.

The release package smoke additionally runs the Agent with its bundled Node and
an empty `PATH`, loads and switches the release catalog, launches the local
bridge, checks bootstrap readiness, and coordinates shutdown.

## Commands run

- `pnpm --filter @cthutool/cli test` — 112 unit and 74 integration tests passed.
- `pnpm --filter @cthutool/cli lint`
- `pnpm --filter @cthutool/cli typecheck`
- `pnpm --filter @cthutool/cli build`
- `pnpm run check:cli-dist`
- `pnpm --filter @cthutool/agent-release typecheck`
- `pnpm --filter @cthutool/agent-release test` — 34 tests passed.
- `pnpm --filter @cthutool/agent-runtime typecheck`
- `pnpm --filter @cthutool/agent-runtime test` — 38 tests passed.
- `pnpm --filter @cthutool/agent typecheck`
- `pnpm --filter @cthutool/agent test` — 2 tests passed.
- `cargo fmt --all -- --check`
- `cargo clippy -p cthutool-agent-tray --all-targets -- -D warnings`
- `cargo test -p cthutool-agent-tray` — 29 tests passed.
- `git diff --check`
- `openspec validate add-cli-agent-lifecycle --strict`

The public-key build hook was also exercised with a temporary output directory
to confirm that `AGENT_RELEASE_PUBLIC_KEY_PEM` is embedded in the compiled CLI.
The committed development bundle intentionally contains no production key and
therefore fails closed until release configuration supplies one.

No `.claude/`, `.codex/`, or `.cursor/` adapter files were changed, and no
neighboring OpenSpec change was archived or synchronized.
