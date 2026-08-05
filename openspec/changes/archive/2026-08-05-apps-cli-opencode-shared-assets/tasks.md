## 1. Shared repository plugin source

- [x] 1.1 Extract the enabled repository plugin resolver shared by Codex installation and OpenCode adapters.
- [x] 1.2 Preserve plugin manifest enable/disable semantics and reject repository paths outside the managed plugin root.

## 2. OpenCode configuration adapters

- [x] 2.1 Add OpenCode config path discovery with `opencode.jsonc` preference, JSON fallback, and explicit CLI overrides.
- [x] 2.2 Implement idempotent skill path synchronization from plugin manifests into `skills.paths`.
- [x] 2.3 Implement MCP translation from plugin `.mcp.json` into OpenCode local and remote server entries.
- [x] 2.4 Preserve unrelated configuration, handle JSONC input, write atomically, and fail safely on invalid data or MCP name collisions.

## 3. CLI and user-facing integration

- [x] 3.1 Register `chc opencode skills` and `chc opencode mcp` with the existing diagnostics, output, JSON, help, and completion contracts.
- [x] 3.2 Keep `chc codex install` as the plugin installation boundary and document the OpenCode synchronization workflow.
- [x] 3.3 Regenerate and commit the bundled CLI output required by the repository check.

## 4. Verification

- [x] 4.1 Add unit and integration coverage for command discovery, config path selection, JSONC preservation, skill synchronization, MCP translation, and command boundaries.
- [x] 4.2 Run CLI unit/integration tests, typecheck, lint, bundle freshness, and `git diff --check`.
- [x] 4.3 Confirm generated agent adapter instructions remain unchanged and keep this OpenSpec change isolated from neighboring changes.
