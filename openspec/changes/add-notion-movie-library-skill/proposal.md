## Why

The personal Notion Movie Library can be queried and edited through the Notion
connector, but there is no reusable Codex workflow for finding stored movies or
turning a fuzzy title such as “星际穿越” into a reviewed, duplicate-safe entry.
Capturing that workflow as a plugin skill makes everyday movie-library use
consistent without adding another project service or API credential.

## What Changes

- Add an instruction-only `$notion-manage-movies` skill to the CthuCodex plugin
  for retrieving Movie Library entries and proposing new entries from natural
  language.
- Use the agent's built-in web search and page-reading capabilities to resolve
  fuzzy movie titles, collect candidate metadata, and surface ambiguous or
  conflicting results.
- Require the user to select among multiple candidates and to explicitly
  confirm the final Notion property preview before every create operation,
  including when only one candidate is found.
- Fetch the live Notion database schema, query existing entries, validate
  writable properties and current options, prevent duplicates, and verify every
  created page.
- Keep personal properties separate from public metadata so web results cannot
  invent viewing status, personal score, library ownership, or watch date.
- Document the skill and retain a plugin TODO for a future change that may use
  CthuTool backend movie metadata without weakening candidate selection or
  write confirmation.
- Do not add a CthuTool backend dependency, direct movie-database API
  integration, API key, helper script, or new MCP server in this change.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-movie-library-skill`: Defines natural-language
  Movie Library retrieval, agent-native fuzzy candidate discovery, metadata
  reconciliation, duplicate prevention, explicit write confirmation, creation,
  and verification.

### Modified Capabilities

None.

## Impact

- Affected plugin source:
  `codex/plugins/cthu-codex/skills/notion-manage-movies/`, CthuCodex plugin
  metadata, and the plugin README.
- Affected documentation:
  `apps/docs/src/content/docs/modules/codex-plugin.md`.
- New main specification:
  `openspec/specs/codex-plugins-cthu-codex-notion-movie-library-skill/spec.md`
  after the change is completed and archived.
- Runtime capabilities are limited to the agent's built-in web search and page
  reading plus the user's authorized Notion connector. No project service,
  local daemon, bundled MCP server, or external API credential is introduced.
