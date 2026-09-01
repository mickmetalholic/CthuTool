## Context

`notion-add-channel` is an instruction-only, explicit-invocation skill that coordinates the Notion connector with public YouTube or Bilibili metadata. The current workflow accepts one channel and combines two different concerns in one mandatory inspection step: resolving the channel's display identity and examining its content to infer a category. Consequently, even a user-provided exact tag still causes content inspection.

The Notion connector can discover the live data source and templates, query stored rows, and create multiple pages under one data source while assigning a template per page. Template application remains asynchronous, and a multi-page create operation is not guaranteed to provide transaction semantics. The design must therefore optimize the read path while preserving duplicate protection, explicit authorization for inferred tags, and per-entry verification.

## Goals / Non-Goals

**Goals:**

- Preserve the existing single-channel invocation while accepting batches of mixed YouTube and Bilibili channels.
- Skip channel description and recent-content inspection whenever effective tags were supplied by the user and match current Notion options.
- Fetch live Notion schema, tag options, and templates once per invocation and reuse them across the batch.
- Detect duplicate identities within the input and against the database before content inference or creation.
- Resolve all user decisions in one preflight phase, then create and verify ready entries with per-channel results.

**Non-Goals:**

- Add new Notion tag options, templates, databases, or MCP tools.
- Make multi-page Notion creation transactional or automatically roll back successful entries after a partial runtime failure.
- Infer tags without explicit confirmation or change an existing duplicate entry.
- Add support for platforms other than YouTube and Bilibili.
- Change the skill's explicit-only invocation policy.

## Decisions

### Split identity lookup from content inspection

Every accepted URL still receives a minimal identity lookup for `Name`, normalized `Link`, `Source`, and a canonical YouTube channel identity or Bilibili UID when available. Description and representative recent content are fetched only when the effective tag list is missing and category inference is required.

This preserves reliable naming and duplicate detection without treating content analysis as mandatory. Completely skipping channel access for tagged entries was rejected because the database still needs a display name and platform identity.

### Use a shared-default and per-channel-override input model

The invocation may contain a batch-level `tags:` value that applies to every URL without item-specific tags. An item-specific tag list replaces, rather than merges with, the shared default for that channel. A URL with neither source receives the existing inference flow. One URL with an optional tag remains valid for backward compatibility.

Replacement semantics are preferred over implicit merging because the user can see the complete effective tag list for each channel and avoid accidentally inheriting an unwanted batch tag.

### Treat tag validation as authorization and perform it before content analysis

Fetch the live `Tags` options once and require every user-supplied value to match an existing option exactly. Collect invalid values and nearby valid options into one response; do not inspect content to reinterpret an invalid explicit value. Once the effective tag list is valid, it authorizes those tags without a second confirmation.

For new, non-duplicate channels still lacking tags, inspect content and present all inferred or ambiguous tag decisions together. Tagged channels may appear as ready context, but their tags are not included in the confirmation request.

### Use a two-phase batch workflow

The read-only preflight phase normalizes inputs, resolves minimal identities, removes repeated input identities, checks database duplicates, validates effective tags, resolves platform templates, and collects missing-tag decisions. Existing database duplicates and repeated input entries are terminal per-item outcomes rather than blocking errors.

No new page is created while any new entry has an invalid URL, invalid tag, unresolved tag, or ambiguous template. After all new entries are ready, create them through the connector's multi-page operation with the appropriate platform template on each page. This favors predictable user-visible behavior over best-effort writes during validation.

### Preserve per-item state across creation and verification

Maintain the input-to-result mapping throughout the workflow so mixed-platform batches can use different templates and report each channel as created, already present, repeated in input, or failed. Fetch each created page after template application to verify its properties and platform template signal. If a runtime create result is uncertain, query the database again before retrying so a retry cannot silently introduce duplicates.

Using only one aggregate success message was rejected because asynchronous templates and non-transactional failures require item-level evidence.

## Risks / Trade-offs

- [A single invalid new item delays otherwise ready entries] → Present all preflight issues together and require an explicit request before ever adopting partial-write behavior.
- [Large batches can encounter connector limits or rate limiting] → Use the connector's multi-page operation where supported, preserve stable item mapping, and split execution only when an exposed connector constraint requires it.
- [A multi-page operation can partially succeed] → Verify every returned or discoverable page, report per-item outcomes, and re-query before retrying uncertain items.
- [Minimal metadata cannot resolve a canonical identity] → Fall back to normalized-link comparison and treat same-name matches as candidates requiring clarification, preserving current safety behavior.
- [Input syntax could become ambiguous] → Document a canonical shared `tags:` form and a canonical per-channel override form while retaining natural-language parsing only when the association is unambiguous.

## Migration Plan

1. Update the skill instructions and prompt metadata while preserving the `$notion-add-channel` name and explicit-only policy.
2. Update the user documentation, main capability spec through this delta, and plugin cachebuster.
3. Validate the OpenSpec change, skill metadata, plugin manifest, relevant documentation, and repository diff.
4. Merge the worktree change, reinstall `cthu-codex@personal`, and test single-channel, fully tagged batch, mixed-tag batch, duplicate, and partial-runtime-failure scenarios in a fresh Codex task.

Rollback by reverting the skill, documentation, spec, and cachebuster changes, then reinstalling the previous plugin version. Already-created Notion pages remain unchanged.

## Open Questions

None. The default behavior is full preflight before writes, shared tags with per-item replacement overrides, and one consolidated confirmation for only the entries that require inferred tags.
