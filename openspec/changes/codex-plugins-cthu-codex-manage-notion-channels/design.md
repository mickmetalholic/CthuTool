## Context

See proposal.md for motivation. The current authored channel skill spans a rigid add-only sequence, and its main spec encodes that sequence, all-or-nothing preflight, and confirmation of every inferred tag. The plugin discovers its skills directory without a per-skill manifest entry. Channel Library currently uses Name, Link, Source, and Tags with platform-specific templates.

## Goals / Non-Goals

**Goals:** One concise SKILL.md plus explicit-only UI metadata, one active channel entrypoint, live schema-aware CRUD, and precise tag and identity semantics.

**Non-Goals:** Platform account actions, database schema/view management, automatic cover output, browser navigation, new scripts/services, plugin installation, or changes to the book PR.

## Decisions

1. Replace the old entrypoint rather than retain overlapping aliases. Preserve the existing capability path, but explicitly retire its add-only workflow requirements in favor of concise management contracts. This makes the intentional behavioral changes visible rather than silently dropping old scenarios.
2. Use the existing database URL as the only fixed database identifier; resolve schema, available connector operations, and templates live. Historical connector anecdotes conflict with the old creation instructions and must not become universal rules. Use current tool contracts and report capability failures.
3. Allow name, Notion URL, platform identity, and filters to locate existing records. Creation still needs a verified supported homepage. Do not retarget an existing record to another platform account when a requested link correction has a different identity.
4. Append, remove, and replace tags according to the user's words. Explicit automatic classification delegates a choice among current options; otherwise propose missing tags for confirmation. Ambiguity pauses only affected items. Preserve optional shared tags/per-item overrides without requiring a mini-language.
5. Keep browser input confined to an explicitly attached or selected tab, read-only, without unrelated page content or private browser state. If an API requires metadata enumeration to claim an attachment, use it only for exact matching. Changed or blocked tabs invalidate only the dependent item.
6. Apply a verified matching platform template on create, and preserve body content on update. Repair the icon from the matching template or an observed same-platform convention when application fails; do not guess an ambiguous platform icon. Report unresolved icon failures separately from successful property writes.
7. Reversible deletion applies only to requested Notion entries. Partial batches report each outcome; retry uncertain mutations only after checking state. No automatic rollback of independent successful entries.
8. Keep this business guidance in the authored skill and change spec, never generated adapters. No OpenSpec regeneration is needed.

## Risks / Trade-offs

- Legacy command users need migration → update README/docs to the new explicit-only name with a short migration note.
- Metadata or aliases can hide duplicate identities → compare stable platform IDs where available and treat same names as candidates only.
- Connector retrieval/deletion/icon limits → disclose coverage and unsupported operations; do not claim success without verification.
- Shorter guidance leaves implementation choices to the agent → retain observable identity, browser, tag, and write-verification constraints and review them against scenarios.

## Migration Plan

Replace the old skill directory and update channel documentation only. Users invoke `$notion-manage-channels` after a separately requested plugin update. No Notion records are migrated. Rollback restores the old skill and docs; it does not alter library data. Keep this change active for review and open a separate PR without merging.
