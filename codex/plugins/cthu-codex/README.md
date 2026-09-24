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
servers are loaded. In a fresh thread, use `/mcp` to verify the `anki` and
`language-feedback` servers are available.

## Language Feedback UI

The language coach still uses deterministic local filtering to decide whether
the latest prompt contains English prose. When coaching is active, the current
Codex model writes the correction and calls the read-only
`cthu_language_feedback_present` tool. MCP Apps-compatible hosts can render the
result as a prominent inline card with the original prose, an emphasized best
version, categorized notes, and a local copy control.

Version `1` uses the `compact` variant and the resource URI
`ui://cthu-language-feedback/v1.html`. The versioned payload leaves room for
future presentation variants without moving correction generation into the
hook or MCP server. Clients that do not render MCP Apps still receive complete
standard text content. If the tool is unavailable or fails, the model is
instructed to put the same feedback in a prominent Markdown section before
continuing the user's requested task.

The presentation server and component are local and read-only. They do not
call a model, load remote assets, send feedback over the network, persist
history or preferences, record telemetry, or mutate Anki. Copying uses only the
host's local clipboard capability when the user activates the control.

## Mature Japanese Sentence Conversion

Invoke `$anki-convert-mature-japanese-sentence-cards` explicitly to preview
`Japanese Sentence` notes whose FSRS stability is at least 45 days and review
count is at least 3. The skill proposes replacing each supported local grammar
cloze with one whole-sentence `c1` cloze whose hint is the existing English
translation.

The first pass is always read-only: it shows note IDs and exact before/after
`文` values. Only a later confirmation updates the displayed notes, in batches
of at most 20, through stale-value-protected Anki MCP calls. The conversion
does not add or remove tags.

The plugin also includes guarded Notion workflows. `$notion-add-channel` adds
channels only when explicitly invoked. `notion-maintain-album` can recognize a
specific personal Album-library maintenance request, but every Album schema or
page mutation still requires a field-level preview and explicit confirmation.
Its MusicBrainz and Discogs resolver is a skill-local script; it does not add a
second MCP server.

`$notion-manage-books` is the explicit-only entrypoint for creating, reading,
updating, and reversibly deleting personal Book Library entries. It preserves
personal notes and shared relations, uses the book template with verified icon
repair, and returns a cover image or direct link for each new book. Clear
requests do not require a second confirmation; ambiguous targets are clarified.
Deletion depends on the connected Notion tools supporting trash/archive.

## Source Boundary

Keep repository-owned plugin source, manifests, and implementation assets under
`codex/plugins/cthu-codex`. Keep generated command or skill adapters out of the
repository; regenerate them per tool or platform.

`$codex-skill-promoter` scans eligible local Codex Skills and marked Hermes
Evolution Skills read-only, regardless of the caller's Git state. It presents
names, sources, provenance, files, compatibility, targets, collisions, and
exact original-removal paths in one candidate table. Every row defaults to
Skip. A confirmed selection runs in an isolated task branch through a scoped
OpenSpec proposal, implementation, Codex installation, verified Hermes
availability, guarded original retirement, archive, and PR without routine
intermediate prompts. Promoted content retains an agent-neutral core with
explicit Codex and Hermes adapters. If either replacement cannot be loaded,
the original remains active and the run stops before archive or PR. Bundled,
managed, protected, opted-out, and unprovenanced Skills remain excluded.

## TODO

- Integrate the future Notion Movie Library workflow with CthuTool's backend
  movie-metadata capability. Keep candidate disambiguation and explicit
  confirmation before every Notion write; use the backend only as the metadata
  source.
