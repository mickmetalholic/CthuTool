# CthuCodex

<p align="center">
  <img src="assets/logo.png" alt="CthuCodex logo" width="560" />
</p>

Repository-managed Codex plugin for CthuTool workflows and reusable assistant
utilities.

User-facing plugin, Anki MCP, and skill documentation lives in the docs site:

- `apps/docs/src/content/docs/modules/codex-plugin.md`

## Local Install

From the repository root:

```bash
chc codex install
```

After install, start a new Codex thread or restart Codex so the bundled MCP
server is loaded. In a fresh thread, use `/mcp` to verify the `anki` server and
its tools are available.

The plugin also includes guarded Notion workflows. `$notion-add-channel` adds
channels only when explicitly invoked. `notion-maintain-album` can recognize a
specific personal Album-library maintenance request, but every Album schema or
page mutation still requires a field-level preview and explicit confirmation.
Its MusicBrainz and Discogs resolver is a skill-local script; it does not add a
second MCP server.

## Source Boundary

Keep repository-owned plugin source, manifests, and implementation assets under
`codex/plugins/cthu-codex`. Keep generated command or skill adapters out of the
repository; regenerate them per tool or platform.
