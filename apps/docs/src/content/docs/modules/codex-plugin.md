---
title: Codex Plugin
description: Repository-managed CthuCodex plugin assets.
---

CthuCodex is the repository-managed Codex plugin for CthuTool workflows and reusable assistant utilities.

## What It Includes

- language coach hook
- language-feedback MCP Apps server and compact correction card
- Anki MCP server
- Anki card-creation and mature-card conversion skills
- Notion channel-library skill
- Notion album-maintenance skill
- Notion movie-library skill
- Notion book-library maintenance skill
- unified Hermes-to-Codex absorption and local skill promotion skill

The language coach uses deterministic local filtering before injecting coaching instructions. It ignores code blocks, inline code, command lines, and identifier-only snippets, and it does not translate Chinese prompts by default.

## Runtime Location

User Codex environment, with local dependencies such as Anki and AnkiConnect when Anki tools are used.

## Install

```bash
chc codex install
```

On first interactive use, enter the CthuTool repository path. The CLI saves it
for future installs from any directory. Run `chc codex install --change-source`
to select another default, or add `--repo-root <path>` for a one-run override.
For scripts, `--change-source --repo-root <path>` sets a new default without a
prompt. Install output identifies the selected source, installed or updated
plugins, and synchronized cache versions.

Restart Codex after install so plugin-provided tools are loaded.

`$codex-skill-promoter` scans eligible local Hermes and Codex Skills read-only
without checking the caller's Git state. It shows a candidate table with names,
sources, provenance, files, compatibility, targets, collisions, and exact
original-removal paths; every row defaults to Skip. Hermes candidates require
a dedicated Evolution marker. One confirmed selection starts an isolated task
branch, proposes a scoped OpenSpec change, implements and validates the
agent-neutral Skill with Codex and Hermes adapters, installs and verifies both
agent entry points, retires unchanged originals, archives the change, and opens
a PR. If either agent cannot load the replacement, the original stays active
and the run stops. Bundled, Hub-managed, protected, external,
organization-managed, opted-out, and unprovenanced Hermes Skills are excluded.

## Language Feedback UI

When the local language-coach detector recognizes English prose, it asks the
active Codex model to generate structured feedback and call
`cthu_language_feedback_present`. On hosts that render MCP Apps resources, the
tool displays a prominent inline card: the original prose is muted, the best
natural rewrite is emphasized, coaching notes keep stable categories, and a
keyboard-accessible control copies only the best version.

The version `1` contract currently supports the `compact` variant:

```json
{
  "version": 1,
  "variant": "compact",
  "original": "User prose",
  "bestVersion": "Natural rewrite",
  "notes": [
    {
      "category": "naturalness",
      "message": "Concise explanation"
    }
  ]
}
```

The tool advertises `ui://cthu-language-feedback/v1.html`. Compatible clients
read that self-contained resource with the MCP Apps media type. Clients without
component rendering still receive a complete text result containing the best
version and every note. If the presentation tool is missing or fails, the
language-coach instruction falls back to a prominent Markdown section and then
continues the user's actual task.

This surface is local and read-only: it performs no external network requests,
persists no correction history or preferences, records no telemetry, and does
not mutate Anki or other user data. The only user-triggered side effect is a
local clipboard attempt from the card's copy control.

## Anki MCP Server

The Anki tools require Anki desktop with the AnkiConnect add-on running locally. By default, CthuCodex connects to:

```text
http://127.0.0.1:8765
```

Set `CTHU_ANKI_CONNECT_URL` or `ANKI_CONNECT_URL` to override the endpoint.

Available tools:

- `cthu_anki_status`
- `cthu_anki_collection_schema`
- `cthu_anki_find_notes`
- `cthu_anki_get_notes`
- `cthu_anki_validate_notes`
- `cthu_anki_add_notes`
- `cthu_anki_update_notes`
- `cthu_anki_store_media`
- `cthu_anki_open_notes`

`cthu_anki_add_notes` validates before writing and limits batch size. When `openAfterCreate` is true, it opens created notes in Anki's Browser. Browser opening failures are reported as warnings and do not undo successful note creation.

`cthu_anki_update_notes` updates existing note fields in batches of at most 20. It can compare expected field values before writing, rejects the entire batch when a preview is stale, reports per-note field outcomes, and can open successfully updated notes in Anki's Browser.

## Japanese Sentence Cards

Use `$anki-create-japanese-sentence-card` for Japanese grammar sentence cards. The skill defaults to deck `0.Japanese::Japanese Sentences` and model `Japanese Sentence`.

It accepts either a marked grammar point:

```text
うちの課は女性がよく飲みに行くの**に対して**、男性は皆まっすぐ家に帰る。
```

Or a separate grammar point line:

```text
うちの課は女性がよく飲みに行くのに対して、男性は皆まっすぐ家に帰る。
に対して
```

When `tags:` is provided, or when a standalone line looks like a tag hierarchy, spaced hyphen hierarchy shorthand such as `新完全マスター - N３・文法 - 第１部・１１課` is normalized to `新完全マスター::N３・文法::第１部・１１課`.

## Mature Japanese Sentence Conversion

Use `$anki-convert-mature-japanese-sentence-cards` to preview familiar `Japanese Sentence` notes for promotion from a local grammar cloze to whole-sentence Japanese production.

The default FSRS search requires stability of at least 45 days and at least 3 reviews:

```text
deck:"0.Japanese::Japanese Sentences" note:"Japanese Sentence" is:review -is:learn -is:suspended -is:buried prop:s>=45 prop:reps>=3
```

For a supported note, the skill proposes this transformation:

```text
Before:
冷蔵庫が壊れたので、新しいのを{{c1::買うことにした::decided to buy}}。

After:
{{c1::冷蔵庫が壊れたので、新しいのを買うことにした。::The refrigerator broke, so I decided to buy a new one.}}
```

Every run starts with a read-only preview containing note IDs and exact before/after `文` values. Updating requires a later explicit confirmation, is limited to 20 notes per batch, and uses the previewed `文` and `訳` values to prevent stale overwrites. It does not modify tags, and repeated runs skip notes whose proposed `文` already equals the current value. The skill does not silently replace FSRS stability with an interval query.

## Japanese Vocabulary Cards

Use `$anki-create-japanese-vocabulary-card` for Japanese vocabulary cards. The skill defaults to deck `0.Japanese::Japanese Vocabulary` and model `Japanese Vocabulary`.

It accepts a vocabulary target marked with double brackets:

```text
子供が生まれて（うまれて）うれしかった**一方で**、[[重い]]責任（せきにん）も感じた。
```

Or a single bold target when no double-bracket target exists:

```text
子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。
```

The skill removes markup, preserves kana annotations, stores dictionary-form vocabulary in `単語`, and generates `穴埋め例文` by replacing the sentence surface form with a short English cue.

## English Expression Cards

Use `$anki-create-english-expression-card` for English expression cards. The skill defaults to deck `0.English` and model `English Expression`.

It accepts a marked expression:

```text
Nutrition labels can offer some helpful clues if you can **get past the maze of** information and jargon.
```

Or a separate expression line:

```text
Nutrition labels can offer some helpful clues if you can get past the maze of information and jargon.
get past the maze of
```

The `Sentence` field uses Anki cloze syntax with a short synonym or paraphrase hint. The `Explanation` field uses the existing English style with `Definition`, `Synonyms`, and `Other Examples` sections.

## Notion Channel Library

Invoke `$notion-manage-channels` explicitly to add, find, update, or reversibly
remove YouTube, Bilibili, and Xiaohongshu entries in the personal Channel Library.
This replaces `$notion-add-channel`; the old entrypoint is removed. Requests use
natural language, without a required format or a second confirmation for clear
operations. Examples:

```text
$notion-manage-channels 找出我收藏的 YouTube 科技频道
$notion-manage-channels 给这个频道加上 AI 标签，保留原来的标签
$notion-manage-channels 把这个主页加入频道库，自动选择合适的现有标签
$notion-manage-channels 把 Chrome 当前标签页的频道加入频道库
```

Creation needs a supported channel homepage or an explicitly selected homepage
tab. Existing entries can be found by name, platform, tags, or Notion link.
Duplicate checks use platform identity; names and renamed handles alone do not
prove that two accounts are the same. Videos, notes, search pages, and unresolved
short links require a channel homepage instead.

Tag additions and removals preserve other tags; explicit replacement uses the
requested set. Shared batch tags and per-item overrides are supported. Valid
supplied tags need no further confirmation or content-based reconsideration.
Explicitly delegated automatic classification uses existing options when clear;
otherwise missing, invalid, or ambiguous tags are clarified for the affected item.

Creation uses the matching platform template. Updates preserve existing notes,
and failed or unsupported template application falls back to a verified platform
icon where possible. Batches report each item's outcome and allow independent
ready items to complete. Uncertain writes are checked before retries.

Browser access is optional and limited to an explicitly selected or attached tab.
It is read-only, without navigation, unrelated tab content, or private browser
state. A blocked, unsupported, or changing tab requires a ready homepage or URL
for that item. Pasted URLs and Notion-only queries do not access browser state.
Deletion affects only Notion records through available reversible trash/archive;
it never follows, unfollows, or changes platform accounts. Unsupported operations
and incomplete query coverage are reported explicitly.

## Notion Album Library

Use `$notion-maintain-album`, or make an unambiguous personal Album-library
maintenance request, to add one album, complete missing metadata, or audit whether
MusicBrainz and Discogs identify the same album. Ordinary album discussion does
not invoke the workflow. Examples include:

```text
添加 Paranoid by Black Sabbath 到我的 Notion Album
补全 The Black Parade 的专辑库元信息
检查这张专辑的 MusicBrainz 和 Discogs 是否匹配
把这个 MusicBrainz Release 链接加入专辑库
```

The workflow uses MusicBrainz Release Group as the canonical album identity and
authority for standard title, artist credit, primary release type, and earliest
release date. A concrete MusicBrainz Release URL is converted to its owning Release
Group; a regional issue, reissue, or remaster date is never written as the original
`Release Date`. Partial MusicBrainz dates remain visibly partial and are not padded
with invented month or day values.

Discogs Master is used to cross-check title, artist, and year and to supply Genre
and Style values. A direct MusicBrainz-to-Discogs Master relationship is preferred
over Discogs search. Confirmed new Genre/Style values are shown in the preview and
added as live `Genre` options only after confirmation. The same rule applies if
MusicBrainz introduces a new primary `Release Type` beyond the initial Album,
Single, EP, Broadcast, and Other options.

MusicBrainz lookup is anonymous and uses the required identifying User-Agent.
Direct Discogs Master lookup can run without stored credentials; deterministic
Discogs search fallback requires `DISCOGS_TOKEN`. If it is absent, the workflow
reports the blocked fallback instead of substituting an untraceable web result.

Album `Artist` relations must resolve to existing People Vault pages. The workflow
matches `MusicBrainz Artist` URL first, then permits exactly one normalized exact
name whose identifier is empty. It can preview filling that missing URL, but it
never creates a People Vault page or replaces a conflicting artist identifier.

Every mutation starts with a read-only candidate and field-change preview. Tied
candidates, mismatched artists, edition qualifiers, conflicting dates, ambiguous
People Vault pages, and differing non-empty Notion values block the write. A
generic confirmation never authorizes replacing a non-empty value; approval must
name that field and produces a new plan. Before execution, the workflow refetches
the live schema and pages to reject stale plans, then verifies each approved write.

Normal album metadata maintenance never writes personal listening fields:
`Status`, `Listened Date`, `Score`, or the `Rating` formula. Streaming services may
be retained as listening links, but are not authority for core metadata.
## Notion Movie Library

Use `$notion-manage-movies` to retrieve entries from the personal Notion Movie Library or to prepare one reviewed movie addition. The skill also allows implicit invocation for requests that clearly target this database, such as:

```text
查询我看过的科幻片
```

Retrieval stays inside the authorized Notion connector. Structured filters use parameterized data-source queries, fuzzy title retrieval uses data-source-scoped Notion search, and every result includes its Notion page URL. The skill reports pagination, connector limits, and non-queryable properties instead of presenting partial data as complete.

For a fuzzy add request:

```text
新增 星际穿越
```

the skill uses the agent's built-in web search and page-reading capabilities to find public movie candidates. It does not call a CthuTool backend, direct movie API, helper script, local service, or additional MCP server. Public pages are treated as untrusted evidence, and external IDs are included only when directly evidenced.

When multiple movies remain plausible, the skill shows a numbered list with available title, original title, year, director, and stable IDs, then waits for a selection. Selecting a candidate is not write authorization. After metadata reconciliation, live genre mapping, and duplicate checks, the skill shows a separate final Notion property preview and requires explicit confirmation even when only one candidate was found.

Public metadata can populate `Name`, `Genres`, `Release Date`, `IMDB ID`, and `TMDB ID`. Personal properties remain user-owned. When omitted, the preview proposes `Status` as `Want to watch` when that option still exists, leaves `Score` and `Date` unset, and proposes `Is in Library` as false. Public ratings never populate `Score`.

The current version does not write the `Rating` or `In Library` formulas, does not write the `Director` or `Cast` relations, does not update existing entries, and does not perform batch additions. The plugin README tracks future use of CthuTool backend movie metadata while preserving candidate disambiguation and explicit confirmation before every Notion write.

## Notion Book Library

Use `$notion-maintain-books`, or ask unambiguously about the personal Book
Library, to search, filter, or audit its entries. Additions and updates operate
on one book at a time. They first show the specific edition or Notion page,
source evidence, and exact field changes; writing requires a separate explicit
confirmation and a fresh duplicate/schema check.

The skill treats a catalog `Reference` as the strongest available matching key,
not a universal cross-site edition identifier. Same-title books remain separate
until the user identifies the right page. Public catalogs never set personal
reading status, score, finished date, access, or notes. New entries do not add a
duplicated bibliographic body block or an external cover; cover uploads remain
manual. Requests to remove a book receive an exact, read-only target preview,
but this version does not trash, archive, or permanently delete pages.

## Authoritative Sources

- Plugin README: `codex/plugins/cthu-codex/README.md`
- Book Library skill: `codex/plugins/cthu-codex/skills/notion-maintain-books/SKILL.md`
- Requirements: `openspec/specs/codex-plugins-cthu-codex-anki-mcp/spec.md`, `openspec/specs/codex-plugins-cthu-codex-language-coach/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-sentence-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-vocabulary-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-english-expression-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-album-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-movie-library-skill/spec.md`
