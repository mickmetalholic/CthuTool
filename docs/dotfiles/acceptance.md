# Migration acceptance record

Date: 2026-10-22. This records executed checks separately from untested native-machine acceptance. The two external repositories and all existing machine bindings remain in place; retirement is not authorized by these results.

| Environment / concern | Evidence | Status |
| --- | --- | --- |
| macOS arm64, Node 24.18.0 | Native temporary home, real Git and npm prefix/launcher install, actual chezmoi 2.73.3 rendering; source use to an isolated Git worktree and SSH-origin update check using a local fixture remote | Passed |
| Complete installable tarball outside checkout | Node-only package install with no development node_modules, empty PATH, no network; bare groups, offline validate, host-neutral doctor and all five host dry-runs using simulated OS metadata | Passed |
| Five published host plans | All upstream inventory fixture package IDs, methods, package names, order, provenance and runtime separation; current strict health/service/release model | Passed |
| API/auth/snapshot fixtures | Three-source API round-trip, pagination and relation pagination, retries/permissions, Token priority/private cache/fault preservation, explicit retirement and first-alignment gate | Passed |
| Snapshot publication failure | Failure at every replacement, complete rollback, interrupted generation recovery and conflicting later user edits | Passed |
| Existing home configuration | Native add/template merge, less-interactive collision prompts, noninteractive dry-run, private backup failure, Git identity and completion/PATH repeated apply | Passed |
| POSIX bootstrap with fake system prerequisites | Missing Git/OpenSSH, incompatible Node, full Node/npm checksum/extraction, reuse, bad checksum rejection, selected key/agent/passphrase, auth cancellation, matching checkout and explicit HTTPS-origin conversion | Passed |
| Windows x64/arm64 | Complete official archive locks, Windows-model rendering, native npm argv resolver and ACL failure mocks; no native PowerShell/ACL/bootstrap execution here | Pending native acceptance |
| Linux x64/arm64 and WSL | Host/OS/WSL filtering, package dispatch and k3s readiness/filesystem/process fixtures; no native system installation here | Pending native acceptance |
| macOS x64 / fresh OS account | Archive lock and model/render checks only; no separate native x64 or disposable-machine run | Pending native acceptance |
| Live Notion software/toolsets/hosts | No NOTION_TOKEN/cache available during implementation; prior planning observations remain explicitly marked in reconciliation.md. alignmentReviewed remains false | Blocked on local authentication and separate data review |

Final local verification:

- CLI TypeScript: `pnpm --filter @cthutool/cli exec tsc --noEmit` passed; affected TypeScript/package files passed the repository's Biome checks.
- Focused model/auth/sync/bootstrap/configuration suite: 42 tests, 1,283 assertions, zero failures under pinned Bun 1.3.11, with `CHC_TEST_CHEZMOI` pointing to a checksum-verified temporary chezmoi 2.73.3. Command from apps/cli: `../../scripts/run-bun.sh test --timeout 120000 --preload ./tests/setup.ts tests/unit/dotfiles.test.ts tests/unit/dotfiles-bootstrap.test.ts tests/integration/dotfiles-command.test.ts`.
- The broader CLI regression run passed 134 tests across ten files; the root CI/precommit contract run passed 17 tests. Later dotfiles changes were rechecked by the final focused suite.
- `pnpm run check:cli-dist` passed after regenerating the saved bundle. It checks identical rebuilt bytes, all 25 required assets, all six Node/npm archive locks and an independently installed Node-only package with five host dry-runs.
- `openspec validate apps-cli-migrate-dotfiles --strict`, `git diff --check`, new-file whitespace and protected-scope checks passed.

CI uses a checksum-verified temporary renderer and runs fixture tests without a Notion Token or real package/service installation. Mocked platform metadata does not establish native installer correctness. No commits, user-home application or external repository retirement were performed.

Before retiring old entry points, choose disposable native macOS/Windows/Linux/WSL test environments, exercise fresh bootstrap and existing-source/file migration, verify a new terminal and source relinks, then record outcomes here. Real k3s/software installation requires an explicitly selected test machine. Do not use the developer's active machine for this acceptance.

2026-10-23 native-capability follow-up: removed chc's adoption receipts/approval digests, manual source path mapping and private template editor. SSH uses create-only source attributes. Configuration discovery delegates to chezmoi while available, retaining only an offline read fallback. The CLI now requires chezmoi 2.73.3. Interactive apply follows native sequential skip/overwrite semantics; earlier confirmed writes are not rolled back on a later skip/cancellation. Follow-up verification: all 34 model/bootstrap tests passed, followed by all 10 real-renderer integration tests, including PTY-driven native merge, skip and explicit overwrite. CLI typecheck/Biome, strict OpenSpec validation and check:cli-dist passed. The complete native Windows/Linux/WSL acceptance and live Notion alignment remain pending as shown above.

2026-10-23 init reporting follow-up: the combined suite passed 46 tests with 1,329 assertions, including installer failure/reuse reporting and real CLI human/JSON/quiet output. Existing tool versions are displayed without changing upgrade policy. Typecheck, Biome and standalone distribution checks passed.
