## Context

See `proposal.md` for motivation. CthuCodex currently detects English prose in a dependency-free `UserPromptSubmit` Node hook and injects fixed developer context. The active Codex model writes the correction in its final response; the hook has no model access and can expose only the hook output contract. CthuCodex also has a stdlib-only Anki stdio MCP server, and plugin installation copies the whole plugin directory into a versioned cache.

The presentation must therefore travel through a normal model-initiated MCP tool call rather than a hook handler result. It must also remain useful when the active client lists MCP tools but does not render MCP Apps UI resources. This change is explicitly about the protected `codex/plugins/cthu-codex` business plugin, so that source may change; generated OpenSpec adapter trees and AI-tooling setup remain outside the change.

## Goals / Non-Goals

**Goals:**

- Establish one stable versioned data contract between model-produced coaching and presentation.
- Make the first compact view visually prominent, theme-aware, accessible, and easy to iterate.
- Keep the detector deterministic and keep correction generation in the active model.
- Preserve full feedback through standard MCP content and explicit Markdown fallback instructions.
- Package the server and component so a cached plugin works without repository-relative dependencies or network access.

**Non-Goals:**

- Do not call an OpenAI model or any remote language service from the hook or MCP server.
- Do not implement diff, learning, or vocabulary variants in version `1`; reserve the variant field for compatible additions.
- Do not add Anki actions, correction history, persistent UI preferences, telemetry, settings UI, modals, picture-in-picture, or fullscreen behavior.
- Do not change English-prose detection thresholds or unrelated CthuCodex hooks and skills.
- Do not regenerate or edit `.agents`, `.cursor`, or `.opencode` OpenSpec adapters.

## Decisions

### Decision: Invoke presentation as a normal MCP tool

The hook will continue to emit only `hookSpecificOutput.additionalContext`. For matching prompts, that context will tell the active model to form a structured correction and call `cthu_language_feedback_present` before completing the user's actual task.

Rationale: lifecycle hook handlers consume the hook output contract even when their handler type is `mcp_tool`; that path is appropriate for policy and context, not for rendering an ordinary tool component. A normal tool call gives the host the tool metadata, structured result, and associated UI resource it needs for MCP Apps presentation.

Alternative considered: make the `UserPromptSubmit` hook call the presentation MCP tool directly. The hook does not generate the correction itself, and hook-triggered MCP output is not a reliable component-rendering path.

### Decision: Add a dedicated stdlib-only UI MCP server

Register a second server, separate from `anki`, in the plugin's `.mcp.json`. The server will implement the small required stdio JSON-RPC surface for initialize, tool listing and calling, resource listing and reading, and structured errors. It will read the checked-in component resource from the plugin directory.

Rationale: the Anki server owns AnkiConnect workflows and must remain independently testable. A separate UI server avoids coupling presentation availability to Anki and gives later CthuCodex UI tools a coherent home. A stdlib-only runtime preserves the current cache-copy installation model: the installed plugin does not need a repository `node_modules` tree.

Alternative considered: extend `anki-mcp-server.mjs`. This would blur ownership and make a visual-only feature appear dependent on Anki. Alternative considered: import an MCP SDK at runtime. That is convenient during development but would require packaging runtime dependencies that the current plugin cache does not carry.

### Decision: Use a self-contained, standards-first component resource

Serve `ui://cthu-language-feedback/v1.html` with the MCP Apps UI media type. The tool definition will use `_meta.ui.resourceUri`; it may also include the OpenAI compatibility alias while the standard field remains canonical. The checked-in resource will contain its own HTML, CSS, and dependency-free JavaScript and will not load remote assets.

Rationale: a self-contained resource works after the plugin is copied and keeps the first implementation small. MCP Apps messaging is the portability baseline. ChatGPT-specific `window.openai` values may be feature-detected for closer theme integration, but core rendering cannot depend on them; CSS color-scheme support supplies the portable baseline.

Alternative considered: introduce React and a component bundler immediately. That would improve ergonomics for a larger UI but adds a build and generated-artifact lifecycle before the first compact card needs it. A later change can introduce a build pipeline if the number of variants justifies it without changing the version `1` payload.

### Decision: Keep model data separate from view state

The tool input and `structuredContent` will use this conceptual version `1` shape:

```json
{
  "version": 1,
  "variant": "compact",
  "original": "User prose",
  "bestVersion": "Natural rewrite",
  "notes": [
    {
      "category": "naturalness",
      "message": "Concise explanation"
    }
  ]
}
```

The server will normalize an omitted variant to `compact`, validate documented string and collection bounds, preserve note order, and return the normalized object unchanged to the component. The component will own only ephemeral view state such as copy-status text.

Rationale: a versioned payload allows the CSS and layout to evolve independently while making future schema changes explicit. Stable note categories support visual badges without requiring the component to parse prose.

Alternative considered: send a preformatted Markdown or HTML fragment. That would make the model responsible for layout, complicate escaping, and prevent reliable display variants.

### Decision: Return complete text content with every successful tool result

Alongside `structuredContent`, the tool will emit human-readable standard MCP text containing an English-polish heading, the best version, and all notes. The hook context will separately define the final-response Markdown fallback for the case where the tool is missing or fails.

Rationale: component support varies by host, while standard tool content remains model-readable. Keeping both representations derived from the same validated payload avoids losing coaching content outside UI-capable clients.

Alternative considered: return only structured content and rely entirely on the iframe. That would make the language coach unusable on clients without MCP Apps rendering.

### Decision: Make the initial card read-only and locally interactive

The compact card will render a labelled header, muted original prose, prominent best version, optional categorized notes, and a copy-best-version control. Copy feedback will use an accessible live status. The component will use semantic elements, visible keyboard focus, narrow-layout wrapping, and theme tokens based on standard color-scheme behavior.

Rationale: these interactions solve the immediate prominence problem without adding mutation or approval semantics. They also form reusable visual primitives for future variants.

Alternative considered: add Anki and follow-up actions in the first card. Those actions introduce cross-tool mutation, confirmation, and error states that deserve a separate capability proposal.

## Risks / Trade-offs

- [Some Codex or MCP clients expose the tool but do not render MCP Apps resources] → Always return complete standard text content and instruct the model to use prominent Markdown when the tool is missing or fails; verify both UI-capable and no-UI paths.
- [The active model may skip or malformedly call the presentation tool] → Give the tool a narrow schema and concise metadata, validate every call, keep the fallback instruction adjacent to the tool instruction, and test the injected context contract without claiming deterministic model prose.
- [Hand-written MCP Apps messaging may drift from the evolving standard] → Keep the bridge surface minimal, cover initialization and result delivery with protocol fixtures, and consider a bundled official client in a later build-pipeline change if the component grows.
- [Long corrections could dominate the conversation or overflow the iframe] → Enforce payload bounds, wrap long text, allow intrinsic height reporting only as a feature-detected enhancement, and keep version `1` limited to the compact view.
- [A versioned plugin cache can retain an old UI resource] → Treat the resource URI as a cache key and increment it for breaking HTML, JavaScript, CSS, or payload changes; bump the plugin version when shipping the implementation.
- [Copy may be denied by the host or browser] → Keep the best version selectable, report copy failure accessibly, and never make copying necessary to read or use the correction.

## Migration Plan

1. Add protocol and validation tests for the language-feedback server, tool metadata, text fallback, and UI resource before registering the server.
2. Add the dedicated server and self-contained `v1` resource, then register it alongside `anki` in `.mcp.json` without changing the Anki entry.
3. Update the language-coach injected context and its focused integration tests while keeping every detector fixture unchanged.
4. Update plugin and docs-site documentation, bump the CthuCodex plugin version, and verify cache synchronization includes the new server and resource.
5. Test a fresh installed plugin in a new Codex desktop task for inline rendering, light/dark behavior, keyboard copy, and actual-task continuation; separately verify standard fallback content with a no-UI MCP client or protocol fixture.

Rollback removes the language-feedback server registration and component assets and restores the previous fenced-text coaching instruction. Because the new path is read-only and independent from Anki, rollback requires no user-data migration and does not affect existing Anki tools or skills.
