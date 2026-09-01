## 1. Contract Tests

- [x] 1.1 Add `apps/cli/tests/integration/language-feedback-mcp-server.test.ts` coverage for MCP initialization, tool metadata, the versioned UI resource URI, resource media type, and self-contained resource delivery; verify the new focused test passes.
- [x] 1.2 Add valid, normalized, boundary, and invalid version `1` payload fixtures covering required strings, compact defaulting, ordered note categories, note counts, and string limits; verify successful results contain both structured content and complete readable fallback text while invalid calls return structured errors.
- [x] 1.3 Extend `language-coach-hook.test.ts` to assert progressive tool and Markdown-fallback instructions while rerunning every existing detector fixture unchanged; verify both active and silent hook paths pass.
- [x] 1.4 Extend plugin manifest, MCP configuration, and cache-copy contract tests to require separate `anki` and language-feedback servers and inclusion of the versioned UI asset; verify existing Anki configuration assertions still pass.

## 2. Language-Feedback MCP Server

- [x] 2.1 Add a dependency-free `language-feedback-mcp-server.mjs` with exported version `1` normalization, validation, error summarization, and fallback-text helpers; verify the payload fixtures from 1.2 pass without network or persistent writes.
- [x] 2.2 Implement the stdio MCP initialize, tools/list, tools/call, resources/list, and resources/read paths for `cthu_language_feedback_present` and `ui://cthu-language-feedback/v1.html`; verify protocol fixtures cover success, unknown method/tool/resource, and malformed input behavior.
- [x] 2.3 Register the language-feedback server beside the unchanged Anki entry in `codex/plugins/cthu-codex/.mcp.json`; verify a server launched from a copied plugin directory can read its UI resource without repository-relative dependencies.

## 3. Compact MCP Apps Component

- [x] 3.1 Add the self-contained version `1` HTML resource with standards-first MCP Apps initialization and tool-result handling; verify a browser harness can deliver structured content and render the labelled heading, original prose, emphasized best version, and ordered categorized notes.
- [x] 3.2 Implement compact, empty-notes, narrow-layout, light-theme, and dark-theme styles with semantic labels, readable contrast, wrapping, and visible keyboard focus; verify the browser harness assertions and captured light/dark/narrow screenshots show the required hierarchy without clipping.
- [x] 3.3 Implement the local copy-best-version control with accessible live success/failure status and selectable text fallback; verify browser tests cover keyboard activation, successful copying of only `bestVersion`, denied clipboard access, and absence of tool or network calls.

## 4. Hook, Documentation, and Plugin Release

- [x] 4.1 Replace the fenced-text-only coaching instruction in `language-coach.mjs` with structured `cthu_language_feedback_present` invocation guidance, actual-task continuation, and prominent Markdown fallback guidance; verify detector logic and silent `{}` output remain byte-for-byte behaviorally unchanged through the focused hook tests.
- [x] 4.2 Update `codex/plugins/cthu-codex/README.md` and `apps/docs/src/content/docs/modules/codex-plugin.md` with the compatible-host UI behavior, no-UI fallback, compact version `1` scope, and read-only privacy boundary; verify documentation examples match the tool name, payload fields, and resource URI.
- [x] 4.3 Bump the CthuCodex plugin version and refresh affected plugin-cache test expectations only after all assets are final; verify a cache synchronization fixture contains the server script and versioned HTML resource while preserving unrelated skills, hooks, and Anki assets.

## 5. Verification

- [x] 5.1 Run the focused Bun integration tests for the language-feedback server, language-coach hook, Anki MCP server, and plugin cache contracts; verify all selected tests pass without starting or stopping any local service.
- [x] 5.2 Run Biome on the changed JavaScript, TypeScript, JSON, and HTML files plus the repository's applicable TypeScript check; verify no lint or type errors remain and run `git diff --check` for whitespace errors.
- [x] 5.3 Run `openspec validate --strict add-cthu-codex-language-feedback-ui` and verify every new and modified capability delta passes strict validation.
- [ ] 5.4 Install the finalized local plugin in a fresh Codex desktop task and verify inline rendering, actual-task continuation, light/dark appearance, narrow layout, keyboard copy, and readable fallback on a no-UI protocol client; retain reviewable screenshots or equivalent visual evidence without committing machine-local state.
- [x] 5.5 Confirm `git diff --name-only -- .agents .cursor/skills .opencode` is empty, no OpenSpec adapter regeneration was performed, and a before/after diff snapshot around `pnpm check:ai-tooling` shows that the check command adds no changes under `codex/plugins/cthu-codex`.
