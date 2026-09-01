## Context

The root CLI currently registers an `opencode` command group. Its command implementation delegates to a dedicated configuration manager, while the shared `CodexConfigPaths` model also carries OpenCode roots, config selection, and override options. OpenCode-specific tests and documentation cover that surface, and the committed CLI bundle must remain synchronized with the source. Codex plugin discovery and installation are separate flows and must remain intact.

## Goals / Non-Goals

**Goals:**

- Make `chc opencode` unavailable from the public command registry and shell completion.
- Remove the OpenCode-only command, configuration manager, path fields, and override options.
- Keep Codex command behavior, plugin assets, and shared repository plugin discovery used by Codex unchanged.
- Leave existing OpenCode configuration files untouched.
- Keep source files, tests, documentation, and the committed CLI bundle consistent.

**Non-Goals:**

- Adding a generic multi-agent manager or replacing OpenCode with another agent adapter.
- Changing the supported GitHub and local skill source forms in `apps-cli-codex-skill-source-inputs`.
- Removing repository plugin manifests, Codex plugin skills, MCP declarations, or other assets that remain inputs to Codex installation.
- Migrating, deleting, or rewriting files under a user's OpenCode configuration directory.

## Decisions

1. **Remove the OpenCode command at the registration boundary.** Delete its root registration and dedicated command module so discovery, help, completion, and execution all derive the same smaller public command set. Keeping a hidden or deprecated command was considered, but would preserve an unsupported maintenance surface and conflict with the requested removal.

2. **Delete the dedicated OpenCode configuration layer and simplify the path model.** Remove the OpenCode config manager and the OpenCode-only fields/options from `CodexConfigPaths`, retaining only paths required by Codex commands. A future generic agent abstraction was considered, but no current requirement needs it and introducing one would expand this change.

3. **Test removal through public CLI surfaces.** Delete OpenCode synchronization behavior tests and update command discovery, completion, global-bin help, root-command, and path-model tests to assert that OpenCode is absent while Codex paths and commands continue to work. This catches stale registrations and stale generated output without preserving tests for removed behavior.

4. **Retire the OpenCode capability and its user-facing documentation.** Apply the removal delta to `apps-cli-opencode-shared-assets`, explicitly remove its `openspec/specs/README.md` index entry, and delete OpenCode setup instructions from CLI and plugin documentation. The Codex plugin README will continue to document Codex installation.

5. **Regenerate the committed CLI bundle after source changes.** Use the repository's existing CLI build/refresh workflow so `apps/cli/dist` does not retain an executable OpenCode command. Bundle consistency checks will be part of verification.

## Risks / Trade-offs

- [Breaking change] Existing scripts invoking `chc opencode skills` or `chc opencode mcp` will fail after upgrade → remove those invocations from project setup scripts and call out the change in release notes.
- [Stale generated output] The committed bundle could continue exposing OpenCode after source removal → regenerate it and run the repository CLI distribution consistency check.
- [Incomplete cleanup] An indirect import or option reference could keep dead OpenCode code reachable → run the focused test/typecheck suite and repository-wide OpenCode reference search over non-archived source, tests, and docs.
- [User configuration expectations] Users may expect CthuTool to continue syncing an existing OpenCode file → explicitly preserve the file and document that CthuTool no longer manages it.

## Migration Plan

1. Remove the source-level command, configuration layer, path options, and related tests/docs.
2. Regenerate and validate the committed CLI bundle.
3. Run focused lint, typecheck, tests, `git diff --check`, and strict OpenSpec validation.
4. Archive the completed OpenSpec change so the active OpenCode capability spec and index are retired according to the repository workflow.

Rollback is a source and bundle revert; no user configuration migration or cleanup is required.
