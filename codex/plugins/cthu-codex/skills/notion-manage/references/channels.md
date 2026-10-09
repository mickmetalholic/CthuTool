# Channels

## Database and fields

Database: `https://app.notion.com/p/2c52c070ae2f42dbad20a3b4ff7764f3`

- `Name`: channel display name; `Link`: normalized channel homepage.
- `Source`: `YouTube`, `Bilibili`, or `Xiaohongshu`, verified against live options.
- `Videos`: relation to Knowledge Vault,
  `collection://94d3d31a-68e8-4966-bd0c-4bddf8e19ee0` (checked 2026-10-09).
  Keep the property name `Videos`; it links only video records in Knowledge Vault,
  not arbitrary knowledge entries. Do not infer a separate video database from it.
- `Tags`: existing category options. Do not change schema or views during CRUD.

Template hints verified on 2026-10-09 (refetch before use):

| Source default | Template ID |
| --- | --- |
| Bilibili | `420918ec-569e-4423-b401-e930586a519f` |
| YouTube | `822bc8e8-f235-4567-a8e0-b6a518d994a1` |
| Xiaohongshu | `3baafcec-eb90-8060-8f24-fc469a7d2cff` |

All are named New page and carry uploaded platform icons. Select by verified Source,
not list order; apply the template explicitly and refresh expiring icon URLs if repair
is needed. A missing/ambiguous platform template requires clarification before creation.

## Care points

Process each identity once per batch; clarify conflicting instructions for repeats.
Ready items can complete independently of those needing clarification.

- For explicitly requested Videos edits, verify the live relation target and existing
  Knowledge Vault record identities. Read [Knowledge](knowledge.md) when resolving
  those records. Change only requested memberships and clarify missing/ambiguous
  targets; never import, create, or modify related knowledge pages as a side effect.

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
- Read browser state only for an explicitly requested or attached tab, preferring
  the exact attachment. Otherwise use public URL metadata and Notion tools.
  Image retrieval does not authorize browser access. Do not guess the browser or tab. If the tool requires metadata enumeration to
  claim an attachment, use it only to match the exact reference and discard
  unrelated metadata. Read minimal identity data, plus a bounded already-loaded
  description/recent-content sample only when classification is needed.
  Do not navigate, refresh, scroll, click, type, close, focus, or otherwise mutate
  the tab; do not read unrelated tab content, history, cookies, storage,
  credentials, or profile files. Check its URL before and after extraction.
  On change, blocked access, or an unsupported page, discard the snapshot and
  request a ready homepage or canonical URL for that item; do not switch tabs.

For batch creation, shared tags are optional; per-item overrides replace that default for the item. Return already-present records without silently updating them. Do not follow, unfollow, or alter platform accounts.
