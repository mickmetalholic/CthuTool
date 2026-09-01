## 1. Skill Structure and Invocation

- [x] 1.1 Initialize the instruction-only
  `codex/plugins/cthu-codex/skills/notion-manage-movies/` skill with
  `SKILL.md` and generated `agents/openai.yaml`, without scripts, assets,
  references, or a bundled MCP server.
- [x] 1.2 Define concise skill metadata for explicit and implicit Movie Library
  retrieval and add requests, including natural-language triggers such as
  “新增 星际穿越”.
- [x] 1.3 Add intent routing and capability preflight so ambiguous requests are
  clarified, Notion failures stop both modes, and missing web search blocks
  only fuzzy add.

## 2. Live Notion Retrieval

- [x] 2.1 Add the Movie Library database URL constant and live discovery of the
  current data source, schema, option values, templates, and views without
  caching Notion object IDs.
- [x] 2.2 Define structured retrieval with parameterized data-source queries and
  fuzzy title retrieval with data-source-scoped Notion search and page fetches.
- [x] 2.3 Define concise result reporting with relevant properties, clickable
  Notion URLs, pagination or truncation disclosure, and no implicit public-web
  enrichment.

## 3. Agent-Native Candidate and Metadata Workflow

- [x] 3.1 Define fuzzy add candidate discovery with built-in web search,
  untrusted-page handling, exact URL or ID input, and zero-, one-, and
  multiple-candidate outcomes.
- [x] 3.2 Define candidate selection as a separate decision from final write
  authorization and include title, original title, year, director, and stable
  IDs as available disambiguation evidence.
- [x] 3.3 Define metadata reconciliation for display title, release date,
  genres, IMDb ID, and TMDB ID, including evidence links, conflict handling,
  and a prohibition on guessed external IDs.
- [x] 3.4 Define live property mapping, deterministic genre normalization,
  unmapped-genre decisions, formula exclusions, and deferred `Director` and
  `Cast` relation writes.
- [x] 3.5 Define user-owned personal properties and visible defaults without
  copying public ratings into `Score`.

## 4. Duplicate, Confirmation, and Creation Safety

- [x] 4.1 Define duplicate queries by normalized TMDB and IMDb IDs with cautious
  title-plus-release-date fallback and a second identity check immediately
  before creation.
- [x] 4.2 Define the final preview contract with target database, evidence,
  exact property payload, defaults, omissions, mappings, template, amendment,
  cancellation, and renewed confirmation after a material change.
- [x] 4.3 Define single-page creation through the discovered data source,
  optional discovered default-template use, post-create fetch verification,
  pending-template reads, and identity lookup before any uncertain retry.

## 5. Plugin Metadata and Documentation

- [x] 5.1 Update the CthuCodex plugin manifest description and cachebuster
  version to include the Movie Library skill without adding a service or MCP
  dependency.
- [x] 5.2 Document natural-language retrieval, fuzzy add, candidate selection,
  final confirmation, personal-property defaults, and current limitations in
  `apps/docs/src/content/docs/modules/codex-plugin.md`.
- [x] 5.3 Keep the plugin README TODO for future CthuTool backend movie metadata
  aligned with the implemented source boundary and preserved safety gates.

## 6. Verification

- [x] 6.1 Validate the new skill folder with the skill validator and verify the
  directory name, frontmatter name, UI metadata, default prompt, and implicit
  invocation policy agree.
- [x] 6.2 Validate the plugin manifest and documentation, confirm no project
  backend, API-key, helper-script, local-daemon, or new MCP configuration was
  introduced, and confirm generated `.claude/`, `.codex/`, and `.cursor/`
  adapters remain unchanged.
- [x] 6.3 Validate the OpenSpec change and confirm scenarios cover retrieval,
  zero/one/multiple candidates, exact identity, metadata conflicts, genre
  mapping, duplicates, preview edits, cancellation, schema drift, creation,
  and uncertain results.
- [x] 6.4 Run `git diff --check` and review the scoped repository diff without
  building or starting project services.
- [x] 6.5 Forward-test representative retrieval and add prompts in a fresh
  context without authorizing a live Notion write, then refine instructions if
  candidate selection or confirmation behavior is ambiguous.
- [x] 6.6 After merge, reinstall `cthu-codex@personal` and exercise read-only
  retrieval plus one explicitly approved live create in a fresh Codex task;
  record the created Notion page for user review.
