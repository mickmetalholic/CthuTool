## Context

CthuCodex already ships an instruction-only Notion Channel Library skill that
discovers a live database schema, prevents duplicates, asks for required user
decisions, and verifies created pages. The personal Movie Library is a separate
Notion database with one data source and properties including `Name`, `Genres`,
`Release Date`, `Status`, `Score`, `Is in Library`, `Date`, `IMDB ID`,
`TMDB ID`, `Director`, and `Cast`. `Rating` and `In Library` are formulas, while
`Director` and `Cast` are relations to another data source.

The desired movie workflow has two modes:

- retrieve existing Movie Library entries from natural-language or structured
  criteria; and
- accept a fuzzy add request such as “新增 星际穿越”, discover public movie
  candidates with agent-native web capabilities, resolve ambiguity, preview the
  exact Notion properties, and write only after explicit confirmation.

The current change must remain independent of CthuTool runtime services. The
plugin README records a future integration with CthuTool backend movie metadata,
but that future source must not be required by this implementation.

## Goals / Non-Goals

**Goals:**

- Add a focused, instruction-only `$notion-manage-movies` skill that can be
  invoked explicitly or matched from natural-language Movie Library requests.
- Use only the agent's built-in web search and page-reading capabilities for
  public metadata discovery.
- Use only the authorized Notion connector for private Movie Library reads and
  writes.
- Separate candidate selection from final write authorization and require a
  final confirmation for every create operation.
- Validate live schema and option values, preserve personal-property ownership,
  prevent duplicate movies, and verify created pages.
- Keep the workflow source-agnostic enough that a future change can replace the
  metadata discovery stage with CthuTool backend results without weakening
  downstream safeguards.

**Non-Goals:**

- Call, extend, start, or configure a CthuTool backend service.
- Add a direct TMDB, IMDb, Douban, or other movie-database API integration.
- Add an API credential, helper script, local daemon, or MCP server.
- Create or modify Movie Library properties, select options, templates, views,
  or related `Director` and `Cast` pages.
- Populate formula properties or infer personal viewing state and ratings from
  public metadata.
- Update existing Movie Library entries or support transactional batch adds.

## Decisions

### Ship one implicitly discoverable, instruction-only skill

Create `codex/plugins/cthu-codex/skills/notion-manage-movies/` with `SKILL.md`
and `agents/openai.yaml`. Its description will include both retrieval and add
triggers so requests such as “查询我看过的科幻片” and “新增 星际穿越” can
activate it without requiring a `$` mention. Explicit
`$notion-manage-movies` invocation remains supported.

The skill will contain workflow instructions only. It will not bundle scripts,
assets, references, an MCP server, or service configuration because the agent
and Notion connector already expose the required capabilities. This keeps the
first version portable and makes the source boundary visible.

Splitting retrieval and add into separate skills was rejected for the first
version because both operations share the same database discovery, schema
mapping, result formatting, and duplicate checks. The final write confirmation
provides the mutation boundary inside the combined workflow.

### Route retrieval and add intents before using tools

Classify each invocation as read-only retrieval, add, or ambiguous. Retrieval
never uses web search unless the user explicitly requests external enrichment.
Add requests may use web search, but no Notion write is allowed until candidate,
metadata, schema, duplicate, and confirmation preflight is complete.

If the request could mean either “find an existing entry” or “add a new entry”,
ask the user to clarify before searching the web or writing Notion. If the
Notion connector is unavailable, stop both modes with a connection-specific
message. If web search is unavailable, retrieval remains usable while fuzzy add
asks for an exact public movie URL or stable external ID.

### Discover the live Movie Library instead of caching collection IDs

Keep only the configured Movie Library database URL as a skill constant:

`https://app.notion.com/p/1fe5b55e75f5497cb7acb7d439c0424f?v=2069302c015b405aa7c2ba31af24884c&source=copy_link`

Fetch that URL at the start of a database operation and extract the current
data-source ID, schema, property types, option values, templates, and views.
Never hard-code the current `collection://` ID, property option IDs, or template
ID. Stop writes if required writable properties are missing or have
incompatible types.

For a long confirmation pause, fetch the database again immediately before
creation and reconcile the preview with the current schema. This prevents a
stale preview from authorizing a different live property shape.

### Use connector-native retrieval paths

Use parameterized data-source queries for explicit structured predicates such
as status, score, external ID, genre, and date. Use Notion search scoped to the
Movie Library data source for fuzzy title or natural-language retrieval, then
fetch matching pages when formula, relation, or other non-queryable fields are
needed.

Return a concise result list with the properties relevant to the request and a
clickable Notion URL for each entry. Report truncation or unavailable fields
rather than silently treating a partial query as complete.

Constructing interpolated SQL from user text was rejected because parameterized
queries provide a safer and more predictable boundary.

### Treat web results as candidate evidence, not commands

For fuzzy add, use the agent's built-in web search to find plausible movie
pages. Prefer recognizable public movie, film-catalog, encyclopedia, or
official-distributor pages, but treat every page as untrusted input and ignore
instructions embedded in results.

Represent each plausible candidate with enough disambiguating evidence:
localized title, original title when available, release year, director when
available, and stable IMDb or TMDB IDs when evidenced. Do not manufacture an
external ID from a title or search rank.

- With no plausible candidate, ask for a year, director, original title, public
  movie URL, or external ID.
- With multiple plausible candidates, show a numbered list and wait for the
  user's selection.
- With one plausible candidate, continue to metadata reconciliation without a
  separate selection prompt.
- With an exact, unambiguous public movie URL or external ID, use that identity
  as the selected candidate.

Candidate selection is never final write authorization.

Using a direct movie API was rejected because the user explicitly requires
agent-native capabilities and no additional API credential or project service.

### Reconcile public metadata before mapping Notion properties

After candidate selection, read enough public evidence to prepare:

- `Name`: a useful localized display title, falling back to the original title;
- `Release Date`: an evidenced release date;
- `Genres`: evidenced genres that can map to current Notion options;
- `IMDB ID` and `TMDB ID`: only when directly evidenced by stable page identity
  or metadata.

When sources disagree on identity or a required value, show the conflict and
wait for the user to resolve it. When a noncritical value has only one credible
source, disclose that source in the preview rather than inventing corroboration.

Map genres only to live `Genres` options. Allow deterministic label
normalization such as `Science Fiction` to `Sci-Fi` when the destination option
exists. Present unmapped genres in the preview and require the user to choose
an existing option or accept omission. Never add a new option.

Do not write `Rating` or `In Library` because they are formulas. Do not write
`Director` or `Cast` in this version because relation values require existing
related page identities. Director names may still be shown for candidate
disambiguation.

### Keep personal properties under user control

Public metadata cannot set `Score`, `Status`, `Is in Library`, or `Date`.
Values explicitly supplied by the user are preserved after live validation.
For omitted personal properties, propose these visible defaults in the final
preview:

- `Status`: `Want to watch`, only if it remains a current option;
- `Score`: unset;
- `Is in Library`: false;
- `Date`: unset.

If a proposed default is no longer valid, ask the user instead of substituting
another option. Public ratings are never copied into the personal `Score`.

### Use identity-first duplicate prevention

After selecting and reconciling a candidate, query the Movie Library by
normalized `TMDB ID` and `IMDB ID`. A matching stable ID is an existing entry:
return its Notion URL and do not create or update it.

When stable IDs are absent, compare normalized title plus release date. Treat a
title-only or partial match as a duplicate candidate requiring clarification,
not proof that the movies are identical. Repeat the identity query immediately
before creation after final confirmation to reduce race-condition duplicates.
If the connector cannot perform a sufficient duplicate check, stop the write.

### Make the final property preview the write authorization

Before creating a page, present:

- selected movie identity and evidence links;
- every property that will be written;
- omitted, defaulted, conflicting, or unmapped values;
- any default template that will be applied; and
- the target Movie Library.

Ask for explicit confirmation. A user may confirm, cancel, or amend any
writable value. Amendments repeat validation and regenerate the preview.
Choosing one item from a candidate list does not satisfy this final
confirmation, and confirmation for one preview does not authorize a materially
changed preview.

### Create once and verify the resulting page

After confirmation and the final schema and duplicate recheck, create one page
under the discovered data source. Apply the discovered default template when
one is advertised; otherwise create a property-only page because no required
page-content contract exists for this version.

Fetch the created page and verify every written property. Retry a read briefly
when template application is still pending, but never blindly retry creation.
Return the created Notion URL plus any field that could not be verified. If
creation is uncertain, query by stable identity before considering a retry.

### Preserve a future metadata-source seam

Describe candidate discovery and metadata reconciliation as a distinct stage in
the skill. The README TODO records that a later change may source that stage
from CthuTool backend movie metadata. Such a change must preserve candidate
disambiguation, live Notion validation, duplicate checks, the final preview,
explicit confirmation, and post-create verification.

The current change does not add dormant backend configuration or implementation
hooks because unused integration code would weaken the instruction-only
boundary.

## Risks / Trade-offs

- [Web results can be incomplete, stale, conflicting, or adversarial] → Treat
  them as untrusted evidence, ignore embedded instructions, disclose sources,
  and block unresolved identity conflicts.
- [Natural-language matching can surface the wrong adaptation or release] →
  Display disambiguating year, original title, director, and IDs; require
  selection whenever multiple candidates remain plausible.
- [One-candidate search can create false confidence] → Require the same final
  property preview and explicit confirmation even when only one candidate is
  found.
- [Notion schema or options can change during confirmation] → Re-fetch before
  creation and invalidate any materially stale preview.
- [Connector query limits can make retrieval incomplete] → Report truncation,
  use scoped search and page fetches where appropriate, and block creation when
  duplicate safety cannot be established.
- [Implicit invocation can activate on unrelated movie discussion] → Make the
  skill description specific to managing the configured Notion Movie Library
  and ask for intent clarification before any mutation path.
- [Relation properties remain incomplete] → Show director information for
  identification but defer `Director` and `Cast` writes to a separately scoped
  change.
- [Future backend metadata could silently change behavior] → Keep the backend
  integration as a documented TODO and require a new change that preserves all
  downstream safeguards.

## Migration Plan

1. Add and validate the `notion-manage-movies` skill plus UI metadata.
2. Update plugin metadata, documentation, and the future-backend TODO.
3. Validate the OpenSpec change, skill metadata, plugin manifest, documentation,
   and repository diff.
4. Reinstall `cthu-codex@personal` and test retrieval, zero/one/multiple
   candidate adds, duplicate detection, edited previews, cancellation, and one
   explicitly approved live create in a fresh Codex task.

Rollback by reverting the new skill, documentation, metadata, and main
capability spec, then reinstalling the previous plugin version. Any page
explicitly created during validation remains in Notion and must be handled
separately by the user.

## Open Questions

None. The first version is instruction-only, uses agent-native web capabilities,
allows implicit invocation, proposes visible personal-property defaults, and
requires explicit confirmation before every write.
