## Context

CthuCodex currently bundles three explicit-only Anki skills whose folder names, invocation names, and UI labels use the older `*-card-maker` convention. A fourth explicit-only skill is being added for a personal Notion Channel Library, creating the need for a naming convention that groups a growing flat skill list without relying on undocumented nested discovery or per-skill categories.

The plugin is installed through the personal marketplace, which points at the main repository copy. Changes developed in a Codex App worktree therefore become loadable only after they are merged, the plugin cachebuster is refreshed, and the plugin is reinstalled in a new task.

## Goals / Non-Goals

**Goals:**

- Use a predictable `<system>-<action>-<object>` invocation and directory naming convention.
- Group skills visually through system-prefixed display names while preserving the documented flat plugin layout.
- Keep every bundled skill explicit-only.
- Add a safe Notion channel workflow that discovers live database schema and templates, prevents duplicates, and requires confirmation for inferred categories.
- Keep current documentation and main specifications aligned with the installed skill names.

**Non-Goals:**

- Preserve aliases for the old Anki invocation names.
- Add nested category directories or custom, undocumented skill metadata.
- Change the Anki note-generation behavior or Anki MCP server.
- Add a new Notion MCP server or modify the personal marketplace entry.
- Rewrite historical archived OpenSpec changes that recorded the former names.

## Decisions

### Use system-prefixed action names in a flat directory

Name the Anki skills `anki-create-english-expression-card`, `anki-create-japanese-sentence-card`, and `anki-create-japanese-vocabulary-card`. Name the Notion skill `notion-add-channel`. Match each folder name to its `SKILL.md` frontmatter name and reference the same name from `agents/openai.yaml`.

Use `Anki · ...` and `Notion · ...` display-name prefixes for visual grouping. Keep all skill folders directly below `skills/` so the plugin follows the documented `skills/<skill-name>/SKILL.md` layout.

Alternative considered: add `skills/anki/` and `skills/notion/` category directories. This was rejected because nested grouping is not a documented plugin discovery contract and would add risk without producing a native category in the skill picker.

### Make manual invocation a per-skill invariant

Set `policy.allow_implicit_invocation: false` in every `agents/openai.yaml`. Include the exact `$skill-name` in every default prompt and, for clarity, state the explicit invocation boundary in each skill description.

Alternative considered: rely only on narrow descriptions to avoid accidental triggering. This was rejected because invocation policy provides deterministic enforcement.

### Discover Notion database state at execution time

Keep the Channel Library database URL as the stable entry point, then fetch the current data source, schema, tag options, and templates on every invocation. Identify templates by their default `Source` property and use the platform icon only as a secondary signal. Do not hard-code data-source or template IDs.

Normalize channel URLs and compare platform identity before creating a record. If a duplicate is found, return the existing entry instead of updating it. If the user omitted a category, infer only from existing options and require explicit confirmation before writing.

Alternative considered: store current data-source, category, and template IDs in the skill. This was rejected because Notion IDs and options can change independently of the plugin.

### Treat the invocation rename as a deliberate breaking migration

Do not keep duplicate alias skill folders for the old names. Duplicate folders would clutter the picker and create two sources of truth. Update current documentation and specifications, retain historical archives unchanged, and document that existing prompts must switch to the new names.

## Risks / Trade-offs

- [Existing prompts using old names stop resolving] → Update current docs and specs, clearly list the name mapping, and reinstall the plugin after merge.
- [The skill picker remains flat] → Use consistent system prefixes in both invocation and display names so alphabetical lists remain grouped.
- [Notion page metadata is unavailable or ambiguous] → Stop and ask for a channel homepage, category, or template choice instead of guessing.
- [Template application is asynchronous] → Fetch the created entry for verification and retry briefly without applying a second template.
- [Worktree source differs from the installed marketplace path] → Validate in the worktree, merge first, then reinstall from the personal marketplace and test in a new task.

## Migration Plan

1. Rename the four skill directories and update all skill metadata.
2. Update plugin metadata, user documentation, and current OpenSpec references.
3. Validate each skill, the plugin manifest, manual-only policy, and repository diff.
4. Sync and archive this OpenSpec change.
5. Merge the branch, reinstall `cthu-codex@personal`, and test the new invocation names in a new task.

Rollback by reverting the rename commit and reinstalling the previous plugin source. Existing Notion entries are unaffected because the workflow change only adds new entries during explicit invocation.

## Open Questions

None.
