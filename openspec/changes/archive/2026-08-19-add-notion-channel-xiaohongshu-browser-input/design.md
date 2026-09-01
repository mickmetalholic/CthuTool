## Context

See `proposal.md` for motivation and the capability delta for observable behavior. This is a follow-on to `improve-notion-channel-batch-add`: the implementation target must already contain that change's explicit-tag fast path, mixed-platform batch model, full preflight, and per-item verification behavior.

`notion-add-channel` remains an instruction-only, explicit-invocation skill. Its normal path receives channel homepage URLs, resolves platform identities and current metadata, loads the live Notion schema and templates, detects duplicates, resolves tags, and writes only after the batch is ready. The live Channel Library currently has a `Xiaohongshu` `Source` option and a template whose default source matches it, so the skill can discover both through its existing live-state workflow.

Connected browser control can expose the currently selected or explicitly attached tab, its final URL and title, and read-only page DOM/evaluation. That browser surface may preserve a user's authenticated Xiaohongshu session, but it is not guaranteed to be installed, connected, selected, authenticated, or stable during a read. The skill therefore cannot make browser access a prerequisite for ordinary URL inputs.

Xiaohongshu creator pages use the canonical path `/user/profile/<userId>`. Current pages can expose a nickname, profile description, and loaded recent-item metadata, but access and markup may change or be interrupted by login, verification, or anti-automation behavior. The workflow must treat these as fallible metadata signals rather than a new trusted API.

## Goals / Non-Goals

**Goals:**

- Convert one explicit browser-tab request into the same normalized channel-item model used by pasted URLs before any Notion access.
- Support canonical Xiaohongshu creator homepages with a stable path user ID, live display name, `Xiaohongshu` source, and live template matching.
- Preserve URL-only behavior, mixed-platform batches, explicit-tag optimization, duplicate safety, and per-item results.
- Bound browser reads to the selected tab and to the minimum metadata authorized by the tag state.
- Fail before Notion access when tab acquisition is unavailable, ambiguous, blocked, unsupported, or unstable.
- Keep browser control optional and keep the skill concise enough to remain instruction-only.

**Non-Goals:**

- Scan open-tab contents, use tab metadata to infer which unrelated tab the user meant, or accept more than one browser-tab item per invocation.
- Read browser history, cookies, storage, credentials, passwords, profiles, or unrelated page data.
- Navigate, refresh, click, scroll, open notes, solve verification challenges, sign in automatically, or otherwise mutate the selected tab.
- Resolve Xiaohongshu note, board, search, or unresolved share-link landing pages to their authors in the first version.
- Add an official Xiaohongshu API integration, skill-local scraper, runtime service, MCP server, hard browser-plugin dependency, Notion schema value, tag, or template.
- Change implicit invocation policy, inferred-tag confirmation, batch atomicity expectations, or partial-create recovery.

## Decisions

### Resolve browser input into the existing channel-item model before Notion access

Parse pasted URLs, shared tags, per-item overrides, and at most one browser-tab placeholder during the existing input phase. Resolve the browser placeholder first into an immutable item containing its original input position, effective tags, source, canonical link, display name, and canonical platform identity. Then pass it through the same input deduplication, database duplicate lookup, tag resolution, template mapping, creation, verification, and reporting states as URL items.

This keeps the browser as an input adapter rather than a second Notion workflow. A separate tab-specific create path was rejected because it would duplicate safeguards and could drift from batch semantics.

### Require explicit, exact tab authorization

Use an attached tab reference when the invocation provides one. Otherwise, honor an explicit current-tab request against the browser surface selected under the available browser-control policy and require that surface to return one selected tab. Do not enumerate open tabs to guess from title, URL, recency, or group, and do not silently switch browser families. When the browser API requires an open-tab metadata listing to claim an exact attached reference, perform at most one listing, match the complete attached ID/title/URL tuple, discard unrelated metadata, and never inspect unrelated tab content.

Limit each invocation to one tab-derived item. It may coexist with pasted URL items and uses the same batch-level default or an unambiguous item-specific tag override such as `current tab | tags: 06.Tech`.

Allowing arbitrary tab discovery or multiple tab imports was rejected because it expands private browser access, complicates tag association, and is not needed for the requested current-tab workflow.

### Capture a stable, non-mutating tab snapshot

Read the selected tab URL before extraction, then read only its title and the platform-specific page fields needed for the current tag state. Read the URL again after extraction. Accept the snapshot only when both URL observations identify the same page; otherwise discard it and ask the user to make the intended homepage ready or paste its canonical URL.

Do not perform any navigation or interaction to turn an unsupported page into a supported one. In particular, a note page that contains an author link remains unsupported in this version because following or expanding it would mutate or broaden the authorized page interaction.

The double-URL snapshot is preferred over trusting a tab handle alone because the user can navigate an already-claimed tab while extraction is in progress.

### Add a narrow Xiaohongshu platform adapter

Accept only a creator homepage whose final normalized path matches `/user/profile/<userId>` with a non-empty ID. Strip query parameters, fragments, and trailing slash and store `https://www.xiaohongshu.com/user/profile/<userId>` as `Link`. Use `<userId>` as the canonical identity, the current creator nickname as `Name`, and the exact live source value `Xiaohongshu` as `Source`.

For valid explicit tags, extract only the final URL, user ID, nickname, and source signal. For a new entry without effective tags, read the profile description plus at most eight currently loaded recent-item titles or equivalent concise metadata. Do not scroll or open content to reach the limit. Feed that bounded evidence into the existing inference-and-confirmation phase.

Using display name as the primary identity was rejected because names can collide or change. Supporting note and board URLs was rejected for the first version because their author resolution and access tokens are more volatile than the canonical profile path.

### Keep browser capability optional and fail closed

Do not initialize or inspect a browser for URL-only invocations. When tab input is explicit, use the connected browser-control surface if available. If it is unavailable, has no selected tab, shows a login or verification barrier, produces no stable supported identity, or changes URL during the read, report the specific issue and request a ready homepage tab or canonical URL.

Resolve all tab-input failures before loading the Notion database. This avoids private database reads for an invocation that cannot produce a valid channel item and keeps the existing missing-input behavior predictable.

Making browser control a hard CthuCodex plugin dependency was rejected because URL input already works without it and browser installation or connection is environment-specific.

### Discover the Xiaohongshu template from live defaults

Continue fetching every current database template once and match a template only when its default `Source` equals the resolved platform. A Xiaohongshu entry therefore requires exactly one template whose default source is `Xiaohongshu`; its current ID and icon remain discovery results rather than skill constants.

Hard-coding the observed template ID was rejected because the existing skill intentionally treats Notion as mutable live state.

### Keep the core instructions self-contained for the first version

Extend `SKILL.md` with one concise tab-input form, the Xiaohongshu URL and identity rule, the snapshot boundary, and browser-specific safety rules. Update `agents/openai.yaml` so its description and default prompt mention supported URL or current-tab input while retaining `allow_implicit_invocation: false`.

The skill remains well below the recommended size threshold, so a new reference file or script would add indirection without enough reusable detail. If additional browser platforms, multiple-tab workflows, or volatile site extraction procedures are added later, move those variants into a directly linked reference or deterministic helper.

## Risks / Trade-offs

- [Xiaohongshu markup or access behavior changes] → Require canonical URL and user ID, use only currently exposed page metadata, never guess missing fields, and fail with a URL-or-ready-tab fallback.
- [A selected tab changes during extraction] → Compare the URL before and after the read and discard the entire tab item on mismatch.
- [A generic “current tab” request is ambiguous across browser surfaces] → Prefer an attached tab or explicitly named browser; otherwise require one selected tab from the policy-selected surface and never enumerate or switch silently.
- [Browser capability is unavailable in some installations] → Keep it optional, avoid browser access in URL mode, and ask for the canonical URL when tab mode cannot start.
- [A bounded recent-content sample misrepresents the creator] → Use the profile description plus no more than eight loaded items, explain the inference briefly, and preserve explicit user confirmation.
- [Reading a logged-in tab exposes more data than a public fetch] → Extract only allowlisted channel fields, prohibit browser state and unrelated DOM access, and do not persist raw tab content.
- [The follow-on is applied before the batch workflow it assumes] → Make `improve-notion-channel-batch-add` a documented implementation prerequisite and verify the target branch before editing.
- [The live `Xiaohongshu` source or template is renamed or removed] → Preserve live discovery and stop preflight rather than adding a value, guessing a template, or creating a blank page.

## Migration Plan

1. Confirm the target branch contains the completed `improve-notion-channel-batch-add` implementation; do not edit, archive, or sync that neighboring change as part of this work.
2. Update the existing skill instructions and UI metadata for Xiaohongshu and optional single-tab input while preserving the explicit-only policy.
3. Update user documentation, the main capability through this delta, and the CthuCodex plugin cachebuster.
4. Validate the skill folder, UI metadata, plugin manifest, OpenSpec change, documentation, and repository diff without touching generated `.claude/`, `.codex/`, or `.cursor/` adapters.
5. Forward-test in a fresh task with a canonical Xiaohongshu URL, an explicitly selected authenticated homepage tab, a tab plus URL batch, explicit-tag and inferred-tag paths, duplicate inputs, an unsupported page, a missing browser, a blocked page, and a simulated or observed unstable tab.
6. After merge, reinstall `cthu-codex@personal` and perform any explicitly authorized live Notion write test, recording the created page for review.

Rollback by reverting the skill, UI metadata, documentation, specification, and cachebuster changes and reinstalling the previous plugin version. Browser state and existing Notion pages require no migration or rollback; any page explicitly created during live validation remains in Notion for manual review.

## Open Questions

None. The first version supports canonical creator homepages, at most one explicit browser-tab item, no tab mutation or discovery, and URL fallback when browser acquisition fails.
