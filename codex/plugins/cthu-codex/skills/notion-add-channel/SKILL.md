---
name: notion-add-channel
description: Add one or more YouTube or Bilibili channels to the personal Notion Channel Library with live tag validation, duplicate prevention, platform templates, and per-channel results. Use only when the user explicitly invokes `$notion-add-channel`.
---

# Notion · Add Channel

Add one or more YouTube or Bilibili channels to the configured Notion database. Treat one invocation as one batch and the database as live state. Fetch its schema, tag options, and templates once per invocation instead of relying on cached IDs.

## Constants

- Database: `https://app.notion.com/p/2c52c070ae2f42dbad20a3b4ff7764f3?v=3aa4470214734650ab0388d5f5d4bdac&source=copy_link`
- Required properties: `Name`, `Link`, `Source`, `Tags`
- Supported `Source` values: `YouTube`, `Bilibili`

## Input Forms

Keep the single-channel form compatible:

```text
$notion-add-channel https://www.youtube.com/@example tags: Technology
```

For a batch, a standalone `tags:` line is the default for every channel without an item-specific override:

```text
$notion-add-channel
tags: Technology, AI

https://www.youtube.com/@channel-a
https://space.bilibili.com/123456
```

Associate an override with one channel by putting it on the same line. The override replaces the batch default; it does not merge with it:

```text
$notion-add-channel
tags: Technology

https://www.youtube.com/@channel-a | tags: AI
https://space.bilibili.com/123456 | tags: Japanese, Education
https://www.youtube.com/@channel-c
```

Treat tags as comma-separated values only when that interpretation is unambiguous. If a natural-language invocation leaves a URL-to-tag association ambiguous, ask the user to restate it in one of the canonical forms before reading or writing Notion.

## Workflow

### 1. Parse the batch

1. Parse every channel URL, the optional batch-level default tags, and any per-channel tag overrides.
2. Resolve each channel's effective tags: use its override when present; otherwise use the batch default. An override replaces the default completely.
3. If no channel URL is present, ask for one or more URLs and stop without reading or writing Notion.

### 2. Load live Notion state once

1. Fetch the configured database through the Notion connector once for this invocation. Stop with a clear connection error if the connector is unavailable.
2. Extract and reuse the current data-source ID, property schema, `Tags` options, and template IDs for the whole batch.
3. Confirm that `Name`, `Link`, `Source`, and `Tags` exist and that the supported platform values exist in `Source`.
4. Fetch every current database template page once. Map a template to a platform only when its default `Source` exactly matches that platform; use the platform icon only as a secondary check.

### 3. Validate URLs and explicit tags

For every input item:

- Accept YouTube channel URLs using `/channel/`, `/@handle`, `/c/`, or `/user/`.
- Accept Bilibili channel URLs using `space.bilibili.com/<uid>`.
- Reject video, playlist, search, and unsupported-site URLs when the channel homepage cannot be resolved reliably.
- Normalize accepted URLs to HTTPS, remove query strings, fragments, and trailing slashes, and preserve the channel identifier or handle.
- Require every effective user-supplied tag to exactly match a current `Tags` option.

Collect all invalid URLs and invalid tags into one response. For invalid tags, show the nearest current options but do not inspect channel content to reinterpret the user's choice. Do not create any new batch entry while an invalid value remains unresolved.

### 4. Resolve minimal channel identities

Read only the current metadata required to determine each valid channel's display name, source, and canonical identity when available:

- YouTube channel ID or handle.
- Numeric Bilibili UID.

When effective user-supplied tags are valid, do not read the channel description or representative recent content and do not request a second tag confirmation. The supplied tags authorize only those exact values. Minimal identity lookup remains required for `Name` and duplicate prevention.

### 5. Remove duplicates before content inspection

1. Compare normalized links and canonical platform identities across the input batch. Process the first occurrence at most once and mark later occurrences as `repeated in input`.
2. Query the fetched Notion data source for the remaining identities with parameterized, set-based SQL where supported.
3. Compare normalized `Link` values first, then canonical YouTube identities or numeric Bilibili UIDs when available.
4. Treat a same-name entry as a candidate only; verify its link or platform identity before declaring it a duplicate.
5. Mark a database match as `already present`, do not create or edit it, and retain its Notion page URL. Resolved duplicates do not block other new entries.

### 6. Resolve only missing tags

For each new, non-duplicate channel without effective tags:

1. Read its description and representative recent content.
2. Infer the strongest current `Tags` option and record a short reason.
3. If no option is sufficiently supported, record the most plausible two or three current options, or the full option list when necessary.

Present all inferred and ambiguous tag decisions in one consolidated response and wait for explicit confirmation or selection. Do not ask the user to reconfirm tags they supplied. Do not invent a tag or add a new `Tags` option.

### 7. Complete a read-only preflight

Before creating anything, require every new entry to have:

- a supported normalized URL and resolved platform;
- a display name and sufficient identity for the existing duplicate safeguards;
- exact user-supplied tags or explicitly confirmed inferred tags; and
- exactly one template whose default `Source` matches its platform.

If any new item remains invalid, unconfirmed, or has a missing or ambiguous template, consolidate the issues and stop without creating any new batch entry. Do not fall back to a blank page or guess a template.

### 8. Create the ready entries

Create all ready entries through one Notion multi-page creation operation when supported, using the discovered data-source ID as the common parent. For every page:

- Set `template_id` to that item's platform template and provide no explicit page content.
- Set `Name` to the channel display name.
- Set `Link` to the normalized channel URL.
- Set `Source` to the detected platform.
- Set `Tags` to a JSON array containing its authorized tag values.

If an exposed connector limit requires splitting a large batch, preserve the original item-to-result mapping and apply the same completed preflight to every chunk.

### 9. Verify and report per channel

1. Fetch every created page after template application. Verify its name, link, source, tags, and platform template icon.
2. Retry the fetch briefly if template application is pending; never apply a second template to compensate for normal asynchronous delay.
3. If creation is uncertain or partially fails, verify every returned or discoverable page and query the Channel Library again before retrying any uncertain item.
4. Never roll back successful pages or blindly retry the whole batch.
5. Report every input item as `created`, `already present`, `repeated in input`, or `failed`. Include a clickable Notion URL for every created or existing entry and identify any field or template signal that could not be verified.

## Safety Rules

- Never create an entry without a supported channel URL.
- Never create an entry from a video URL when the channel homepage cannot be resolved reliably.
- Never create a duplicate, silently edit an existing entry, or blindly retry an uncertain batch.
- Never invent a tag or add a new `Tags` option.
- Never inspect channel content to infer or reconfirm tags when valid effective tags were supplied by the user.
- Never infer missing tags and write them without explicit user confirmation.
- Never write part of a batch while a new item still has an unresolved preflight issue.
- Never hard-code the data-source ID or template IDs; discover them from the database each run.
- Never fall back to a blank page when the platform template cannot be identified.
