---
name: notion-add-channel
description: Add one or more YouTube, Bilibili, or Xiaohongshu channels from homepage URLs or one explicitly requested browser tab to the personal Notion Channel Library with live tag validation, duplicate prevention, platform templates, and per-channel results. Use only when the user explicitly invokes `$notion-add-channel`.
---

# Notion · Add Channel

Add one or more YouTube, Bilibili, or Xiaohongshu channels to the configured Notion database. Treat one invocation as one batch and the database as live state. Browser input is optional and limited to one explicitly attached or requested tab; ordinary URL input must remain browser-free.

## Constants

- Database: `https://app.notion.com/p/2c52c070ae2f42dbad20a3b4ff7764f3?v=3aa4470214734650ab0388d5f5d4bdac&source=copy_link`
- Required properties: `Name`, `Link`, `Source`, `Tags`
- Supported `Source` values: `YouTube`, `Bilibili`, `Xiaohongshu`

## Input Forms

Keep the single-channel URL form compatible:

```text
$notion-add-channel https://www.youtube.com/@example tags: Technology
```

Accept one explicitly selected browser tab in a single-item invocation:

```text
$notion-add-channel Chrome current tab | tags: Technology
```

For a batch, a standalone `tags:` line is the default for every item without an item-specific override. The batch may contain URLs plus at most one tab item:

```text
$notion-add-channel
tags: Technology, AI

https://www.youtube.com/@channel-a
https://www.xiaohongshu.com/user/profile/creator-id
Chrome current tab
```

Associate an override with one item by putting it on the same line. The override replaces the batch default; it does not merge with it:

```text
$notion-add-channel
tags: Technology

https://www.youtube.com/@channel-a | tags: AI
https://space.bilibili.com/123456 | tags: Japanese, Education
Chrome current tab | tags: Lifestyle
```

An exact attached browser-tab reference is equivalent to `current tab`; prefer that attachment over a generic current-tab request. Treat tags as comma-separated values only when that interpretation is unambiguous. If the item-to-tag association, browser surface, selected tab, or attached reference is ambiguous, ask the user to restate it before accessing browser or Notion state.

## Workflow

### 1. Parse the batch

1. Parse every channel homepage URL, the optional batch-level default tags, per-item tag overrides, and at most one explicit attached/current-tab item.
2. Resolve each item's effective tags: use its override when present; otherwise use the batch default. An override replaces the default completely.
3. If more than one tab item is requested, ask the user to keep one tab item and express the rest as canonical homepage URLs. Do not access browser or Notion state.
4. If neither a URL nor an explicit tab item is present, ask for one or more channel homepage URLs or one browser-tab item. Do not access browser or Notion state.
5. If the batch contains URLs only, do not connect to, initialize, list, or read any browser.
6. Normalize and resolve all pasted URL items before acquiring an explicit tab. Stop before browser or Notion access if a URL item is invalid. The presence of effective user-supplied tags selects the identity-only read path; validate those tag values against live Notion options later.

### 2. Normalize pasted URLs and resolve minimal identities

Complete this section for every pasted URL before any optional browser acquisition. Use ordinary public metadata access only; do not use a connected browser for URL items.

- Accept YouTube channel URLs using `/channel/`, `/@handle`, `/c/`, or `/user/`. Use the channel ID or handle as the canonical identity when available.
- Accept Bilibili channel URLs using `space.bilibili.com/<uid>`. Use the numeric UID as the canonical identity.
- Accept Xiaohongshu only when the final URL host is `www.xiaohongshu.com` and its path is exactly `/user/profile/<userId>` with one non-empty ID segment and an optional trailing slash. Normalize it to `https://www.xiaohongshu.com/user/profile/<userId>`, preserve the path user ID as the canonical identity, require the current creator nickname as `Name`, and resolve `Source` as exactly `Xiaohongshu`.
- Normalize every accepted URL to HTTPS without query, fragment, or trailing slash while preserving its canonical identifier.
- Reject videos, notes, playlists, boards, search results, unresolved share-link landing pages, and unsupported sites. Do not follow an author link to transform unsupported content into a homepage.

Resolve each valid URL item's display name, source, and canonical identity before proceeding. With effective user-supplied tags, read only this minimal identity metadata. Without effective tags, defer description and recent-content inspection until after duplicate removal.

Compare normalized links and canonical identities among URL items immediately. Preserve original positions, tentatively keep the earliest occurrence, and mark later identical occurrences as `repeated in input`. Never merge different tag sets from repeated items: if duplicate occurrences have different effective tags, ask which single tag set applies and stop before browser or Notion access.

Consolidate unsupported URLs, missing names, unresolved identities, and duplicate tag conflicts. Stop before browser or Notion access while any URL item remains unresolved.

### 3. Acquire the exact tab when explicitly requested

Skip this section entirely for URL-only input.

1. Prefer the exact tab attached to the invocation. Otherwise use only the selected tab of the browser surface the user explicitly named, such as `Chrome current tab`, or the one browser surface the product explicitly associated with the request. If there is no unambiguous surface and selected tab, stop instead of guessing.
2. Do not enumerate tabs to choose by title, URL, recency, group, or apparent relevance. If the browser API requires an open-tab metadata listing to claim an attached reference, perform at most one metadata-only listing, require an exact match of the attachment's complete ID/title/URL tuple, and discard all metadata about unrelated tabs without reading their content.
3. Never silently switch browser families or fall back to a different browser surface. Claiming a tab must not select, focus, activate, or change the foreground browser window; stop if the available browser surface cannot provide a read-only handle without doing so.
4. If a metadata listing was required, claim only its exact matched reference and, before reading page DOM, re-read the claimed tab's ID, title, and URL metadata. Require the complete tuple to still equal the attachment tuple; discard it and stop on any mismatch. After a successful match, discard the attachment title and raw URL plus every listing result, retaining only the opaque claimed-tab handle until acquisition ends.
5. Read the claimed tab's observed URL and record that exact string as the first snapshot URL. Before reading the title or DOM, require that this URL already matches one of the supported homepage shapes in section 2. Reject a note, video, board, search, unresolved share-link, or unsupported page immediately; never navigate or follow an author link to convert it.
6. Without navigating or interacting, read only the tab title and the minimal platform fields required for source, normalized homepage link, display name, and canonical identity.
7. Recompute input-batch duplicates across the tab and all URL items using original input order. If identical occurrences have different effective tags, discard captured tab fields, ask which single tag set applies, and stop before Notion. If the tab is a later repeated occurrence, mark it `repeated in input` and do not read its description or recent titles. If it is the first occurrence and has no effective tags, additionally read only the profile description and at most eight titles from recent items already loaded in the current DOM; use fewer when fewer are loaded.
8. Read the observed URL again immediately after extraction. Accept the snapshot only when the second string exactly equals the first. On any change, discard every value from the snapshot. After the equality check, discard both raw URL strings and the local claimed-tab handle without closing the tab; retain only the normalized homepage link without query or fragment.
9. Stop before loading Notion if the browser capability is unavailable, no selected tab exists, the exact attachment cannot be claimed, login or verification blocks required fields, the page is unsupported, identity or display name is missing, or the URL changes. Discard all acquired tab metadata, state the specific problem, and ask for a ready supported homepage tab on the same browser surface or a canonical homepage URL.

Tab acquisition is read-only. Never navigate, refresh, click, type, submit, scroll, open content, close the tab, select or focus it, or otherwise mutate it. Never read browser history, cookies, local storage, session storage, credentials, passwords, browser profiles, unrelated DOM, or unrelated tab content. Do not retain or report raw page content beyond the allowlisted fields used by this workflow.

On every early exit after any browser access, discard all tab-listing metadata, attachment tuples, claimed handles, snapshot values, raw URLs, titles, DOM fields, and derived evidence before responding. Never carry them into a retry or fallback invocation.

### 4. Load live Notion state once

1. Fetch the configured database through the Notion connector once for this invocation. Stop with a clear connection error if the connector is unavailable.
2. Extract and reuse the current data-source ID, property schema, `Source` options, `Tags` options, and templates for the whole batch.
3. Confirm that `Name`, `Link`, `Source`, and `Tags` exist and that every resolved platform is a current `Source` option.
4. Fetch every current database template page once. Map a template to a platform only when its default `Source` exactly matches that platform; use the platform icon only as a secondary check. Do not hard-code an observed source option or template ID.
5. Require every effective user-supplied tag to exactly match a current `Tags` option. Collect all invalid tags into one response, show the nearest current options, and stop without inspecting content to reinterpret the user's choice or creating any new entry.

### 5. Remove database duplicates before content inspection

1. Reuse the input-batch deduplication completed before Notion access. Process the earliest occurrence of each identity at most once, preserve every original item-to-result position, and retain later occurrences as `repeated in input`.
2. Query the fetched Notion data source for the remaining unique identities with parameterized, set-based SQL where supported.
3. Compare normalized `Link` values first, then canonical YouTube identities, numeric Bilibili UIDs, or Xiaohongshu path user IDs.
4. Treat a same-name entry as a candidate only; verify its link or platform identity before declaring it a duplicate. Ask for clarification before creating an affected entry whose identity cannot be verified.
5. Mark a database match as `already present`, do not create or edit it, and retain its Notion page URL. Resolved duplicates do not block other valid new entries.

### 6. Resolve only missing tags

For each new, non-duplicate item without effective tags:

1. For a URL item, read its description and representative recent content. For a tab item, use only the profile description and up to eight already-loaded recent-item titles captured in the stable snapshot; do not reacquire, scroll, open, or navigate the tab.
2. Infer the strongest current `Tags` option and record a short reason.
3. If no option is sufficiently supported, record the most plausible two or three current options, or the full option list when necessary.

Present all inferred and ambiguous tag decisions in one consolidated response and wait for explicit confirmation or selection. Do not ask the user to reconfirm tags they supplied. Do not invent a tag or add a new `Tags` option.

### 7. Complete a read-only preflight

Before creating anything, require every new entry to have:

- a supported normalized URL and resolved platform;
- a display name and sufficient identity for the duplicate safeguards;
- exact user-supplied tags or explicitly confirmed inferred tags; and
- exactly one live template whose default `Source` matches its platform, including `Xiaohongshu` when present.

If any new item remains invalid, unconfirmed, or has a missing or ambiguous template, consolidate the issues and stop without creating any new batch entry. Do not fall back to a blank page, guess a template, or add a missing source value.

### 8. Create the ready entries

Create all ready entries through one Notion multi-page creation operation when supported, using the discovered data-source ID as the common parent. For every page:

- Set `template_id` to that item's platform template and provide no explicit page content, when the connector accepts it. Some connector builds reject or silently drop a `template_id` argument on page creation; in that case create the page from properties alone and record that the platform template icon was not applied (see Connector notes).
- Set `Name` to the current channel display name.
- Set `Link` to the normalized channel URL.
- Set `Source` to the detected platform.
- Set `Tags` to a JSON array containing its authorized tag values.

If an exposed connector limit requires splitting a large batch, preserve the original item-to-result mapping and apply the same completed preflight to every chunk.

### 9. Verify and report per channel

1. Fetch every created page after template application. Verify its name, link, source, tags, and platform template icon when the connector could apply the template; otherwise verify the fields and mark the icon signal as unverifiable.
2. Retry the fetch briefly if template application is pending; never apply a second template to compensate for normal asynchronous delay.
3. If creation is uncertain or partially fails, verify every returned or discoverable page and query the Channel Library again before retrying any uncertain item.
4. Never roll back successful pages or blindly retry the whole batch.
5. Report every input item as `created`, `already present`, `repeated in input`, or `failed`. Include a clickable Notion URL for every created or existing entry and identify any field or template signal that could not be verified.

## Connector notes

Live observations for the Notion connector; behavior is client-independent, so Codex and Hermes see the same API semantics.

- **Parent identifier**: page creation under this database must use the database ID from the Channel Library URL as the parent `database_id` (the `2c52c070-…` segment). Passing the data-source ID returned by the connector (`77a6077c-…` here) instead yields `404 Could not find database`.
- **`template_id` on create**: current connector builds only accept `parent`, `properties`, `icon`, `cover`, and `children` on page creation. A `template_id` argument can fail client-side before any request is sent. Do not fight this: create the page from properties alone and flag the missing template signal in the report.
- **Icon via API**: updating a page icon with a `file` object is rejected, and an `external` icon is silently ignored when the integration token lacks content capability. Do not retry icon patches in a loop; report the icon as not verified and suggest setting it manually.

## Safety Rules

- Never access browser state unless the explicit invocation requests or attaches one tab item.
- Never inspect or mutate any tab beyond the exact read-only acquisition contract above.
- Never load or write Notion while an explicit tab item is unavailable, ambiguous, blocked, unsupported, incomplete, or unstable.
- Never create an entry without a supported normalized channel homepage and canonical identity.
- Never create a duplicate, silently edit an existing entry, or blindly retry an uncertain batch.
- Never invent a tag or add a new `Tags` or `Source` option.
- Never inspect channel content to infer or reconfirm tags when effective tags were supplied by the user.
- Never infer missing tags and write them without explicit user confirmation.
- Never write part of a batch while a new item still has an unresolved preflight issue.
- Never hard-code the data-source ID or template IDs; discover them from the database each run.
- Never fall back to a blank page when the platform template cannot be identified.
