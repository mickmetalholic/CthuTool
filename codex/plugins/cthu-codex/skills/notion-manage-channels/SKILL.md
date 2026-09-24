---
name: notion-manage-channels
description: Create, find, update, and delete entries in the personal Notion Channel Library for YouTube, Bilibili, and Xiaohongshu. Use only when explicitly invoked as $notion-manage-channels.
---

# Notion · Manage Channels

Manage Notion channel records from natural-language requests, individually or in
batches. Clear requests authorize their operations without redundant confirmation.
Clarify ambiguous targets or changes; a bare invocation should ask what to manage.

## Database and fields

Database: `https://app.notion.com/p/2c52c070ae2f42dbad20a3b4ff7764f3`

Fetch the live schema and reuse it for the request. Discover data-source IDs,
current options, and relevant platform templates; follow current connector
contracts rather than assuming a particular query, parent, or icon API works.

- `Name`: channel display name; `Link`: normalized channel homepage.
- `Source`: `YouTube`, `Bilibili`, or `Xiaohongshu`, verified against live options.
- `Tags`: existing category options. Do not change schema or views during CRUD.

## Operations

- **Create:** Resolve a supported homepage, current name, and platform identity;
  check existing records and repeated inputs before creating. Return existing
  entries without silently updating them. Shared batch tags are optional;
  per-item overrides replace the shared default for that item.
- **Read:** Find entries by name, platform, tags, homepage, or Notion page link.
  A new homepage URL is not required for existing-record lookup. Return useful
  fields and Notion links; disclose incomplete query coverage.
- **Update:** Resolve the existing record, then change only requested fields or
  fill requested missing metadata. Preserve unrelated fields, tags, and notes.
  Verify link corrections refer to the same account; clarify apparent identity
  changes rather than silently retargeting an entry.
- **Delete:** Use supported reversible Notion trash/archive for resolved,
  explicitly requested entries. If unavailable, report the limitation; never
  empty a page as a substitute. Do not follow, unfollow, or alter platform accounts.

## Care points

- Identify channels by platform plus stable ID where available: YouTube channel
  ID (resolve handle/legacy aliases when needed), Bilibili UID, or Xiaohongshu
  profile user ID. Same names are not duplicate proof; renames are not new accounts.
  Remove tracking parameters and fragments without losing identity. Supported inputs include
  YouTube `/channel/`, `/@handle`, `/c/`, `/user/`, Bilibili
  `space.bilibili.com/<uid>`, and Xiaohongshu
  `www.xiaohongshu.com/user/profile/<userId>`. For videos, notes, playlists,
  boards, searches, unresolved short links, or unsupported sites, request the
  channel homepage for the affected item rather than creating from a content URL.
- “Add a tag” appends, “remove a tag” removes only that membership, and “replace
  tags” replaces the set. Use valid supplied tags without reconfirming or reading
  content to reconsider them. Invalid tags require a choice from current options.
  For creation or requested tag completion, propose missing tags for confirmation;
  do not classify as a side effect of unrelated updates. If the user
  explicitly delegates automatic classification, use supported unambiguous
  options and report the choice. Ask when classification remains ambiguous.
- Create with the template whose default `Source` matches the platform. Verify
  asynchronous application before dependent edits. On creates and updates,
  ensure the platform icon; if application fails, is unsupported, or omits it,
  explicitly set the verified template icon through an available operation.
  If no unique template exists, use only an observed, unambiguous same-platform
  icon convention. Never guess the icon or reapply content just to repair it;
  report unresolved presentation failures separately from successful field writes.
- Read browser state only for an explicitly requested or attached tab, preferring
  the exact attachment. Otherwise use public URL metadata and Notion tools.
  Do not guess the browser or tab. If the tool requires metadata enumeration to
  claim an attachment, use it only to match the exact reference and discard
  unrelated metadata. Read minimal identity data, plus a bounded already-loaded
  description/recent-content sample only when classification is needed.
  Do not navigate, refresh, scroll, click, type, close, focus, or otherwise mutate
  the tab; do not read unrelated tab content, history, cookies, storage,
  credentials, or profile files. Check its URL before and after extraction.
  On change, blocked access, or an unsupported page, discard the snapshot and
  request a ready homepage or canonical URL for that item; do not switch tabs.
- Keep batch outcomes independent. Process an identity once; clarify conflicting
  instructions for repeated identities. Ready authorized items can complete while
  others need clarification. Verify writes, inspect state before retrying uncertain
  results, and preserve successful entries. Report each item as created, updated,
  deleted, already present, repeated, needing clarification, or failed, with
  available Notion links and any unverified fields. Never treat limited retrieval
  as definitive absence or an exhaustive count.
