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

## Source Boundary

Keep repository-owned plugin source, manifests, and implementation assets under
`codex/plugins/cthu-codex`. Keep generated command or skill adapters out of the
repository; regenerate them per tool or platform.

`$codex-skill-promoter` is the single Codex-side development workflow. It can
adapt an explicitly selected Hermes skill only when a dedicated Evolution
provenance marker is present, or start from an explicitly selected local Codex
skill. It scans local skill trees read-only and then lets the user choose the
promotion set and exact post-verification cleanup targets; every row defaults
to Skip and every local copy defaults to Keep. It keeps an agent-neutral core
with explicit Codex or Hermes adapters. For a Hermes candidate, the original
eligible Evolution source and adapted Codex staging path are independent
cleanup targets. The workflow validates and writes the clean feature checkout
prepared by the user, installs and verifies that checkout, then deletes only
confirmed unchanged targets after path, provenance, and fingerprint rechecks.
It never edits or updates Hermes and never creates or switches a Git
branch/worktree; final deletion of an explicitly selected eligible Hermes
source is its only permitted Hermes mutation. Hermes-side skill absorption
remains owned by the Hermes skill repository and local skill directory.

## TODO

- Integrate the future Notion Movie Library workflow with CthuTool's backend
  movie-metadata capability. Keep candidate disambiguation and explicit
  confirmation before every Notion write; use the backend only as the metadata
  source.
