---
title: Codex Plugin
description: Repository-managed CthuCodex plugin assets.
---

CthuCodex is the repository-managed Codex plugin for CthuTool workflows and reusable assistant utilities.

## What It Includes

- language coach hook
- Anki MCP server
- Anki card-creation and mature-card conversion skills
- Notion channel-library skill
- Notion album-maintenance skill
- Notion movie-library skill

The language coach uses deterministic local filtering before injecting coaching instructions. It ignores code blocks, inline code, command lines, and identifier-only snippets, and it does not translate Chinese prompts by default.

## Runtime Location

User Codex environment, with local dependencies such as Anki and AnkiConnect when Anki tools are used.

## Install

```bash
chc codex install
```

Restart Codex after install so plugin-provided tools are loaded.

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

Use `$notion-add-channel` to add one or more YouTube or Bilibili channels to the personal Notion Channel Library. The explicit-only skill validates current tags, checks for input and database duplicates, selects each platform-specific template, verifies created entries, and returns per-channel Notion URLs.

An exact tag supplied by the user is used without inspecting the channel description or recent content and without a second confirmation. The skill still reads the minimum channel metadata required for its name and duplicate identity.

Apply the same tags to a batch with a standalone `tags:` line:

```text
$notion-add-channel
tags: Technology, AI

https://www.youtube.com/@channel-a
https://space.bilibili.com/123456
```

Put `tags:` on a channel line to replace the batch default for that item:

```text
$notion-add-channel
tags: Technology

https://www.youtube.com/@channel-a | tags: AI
https://space.bilibili.com/123456 | tags: Japanese, Education
https://www.youtube.com/@channel-c
```

Only channels without effective user-supplied tags require content inspection and inferred-tag confirmation. In a mixed batch, the skill consolidates those decisions before it creates any new entries.

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

## Authoritative Sources

- Plugin README: `codex/plugins/cthu-codex/README.md`
- Requirements: `openspec/specs/codex-plugins-cthu-codex-anki-mcp/spec.md`, `openspec/specs/codex-plugins-cthu-codex-language-coach/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-sentence-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-vocabulary-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-english-expression-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-album-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-movie-library-skill/spec.md`
