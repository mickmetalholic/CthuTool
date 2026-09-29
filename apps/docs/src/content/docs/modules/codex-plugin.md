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

## Notion Book Library

Invoke `$notion-manage-books` explicitly to create, find, update, or reversibly
delete entries in the personal Book Library. The skill accepts natural-language
requests without a fixed format or a mandatory second confirmation. Ambiguous
books or editions are clarified before changing the affected record.

The skill checks the live schema, prevents duplicates, and reuses authors,
series, and access channels. Public metadata never supplies personal scores,
completion dates, or ownership. The page body remains for personal notes; the
skill does not automatically insert catalog blurbs or duplicate book details.

New entries use the default book template. Updates preserve existing content,
and failed template application falls back to repairing the shared book icon.
Every new book's result includes a verified cover image or direct image link
for manual addition, or states that no verified cover was found. Query limits,
unresolved writes, and unsupported deletion are reported explicitly.

This replaces the former `$notion-maintain-books` entrypoint. Use
`$notion-manage-books` after updating the plugin; it does not activate implicitly.

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

Creation also returns a verified channel avatar/cover image or direct image link
for manual addition, or states that none was available. The platform icon and
existing covers are preserved. Explicit Videos relation edits resolve existing
records and change only requested memberships; no video import or related-page
creation is performed.

## Notion Comic Book Library

Invoke `$notion-manage-comics` explicitly to create, find, update, or reversibly
remove comic entries. Natural-language requests need no fixed format or redundant
confirmation when the target and operation are clear.

The skill uses the live schema and preserves multiple authors, access relations,
notes, and personal scores. Whole works, parts, volumes, and editions are distinct:
a volume reference alone does not authorize splitting or renaming a work-level
entry. Publication completion and finishing one volume do not imply that you have
read the entire work. No absent classification, series, finish-date, or progress
fields are added automatically.

Creation uses the comic template and verifies its shared icon, repairing it when
application fails. Each new entry returns a verified cover image or direct link
for manual addition, or states that no cover was found. Representative volume art
is labeled for work-level entries. Deletion uses supported reversible Notion
trash/archive only; incomplete queries and unverified writes are reported.

Skill source: `codex/plugins/cthu-codex/skills/notion-manage-comics/SKILL.md`.

## Notion Music Release Library

Use `$notion-manage-music-releases` for lightweight query, creation, updates, and
reversible removal in Music Release, including albums, singles, and EPs. It replaces
`notion-maintain-album` and runs only when manually invoked. Natural-language
requests are sufficient; clear instructions do not require a second confirmation.

MusicBrainz Release Group identifies the work and supplies core metadata; Discogs
Master provides cross-validation and Genre/Style. Concrete editions and reissue
dates never replace the original release identity/date, and partial dates are not
padded. Artist relations use verified existing People Vault pages. Ambiguous
identities are clarified, and existing options are reused without schema changes.

Creation uses the live template, repairs its consistent icon when necessary, and
returns a verified cover image or direct link for manual addition. Updates preserve
unrequested fields, notes, and covers. Explicit requests can change Status,
Listened Date, and Score; Rating remains a read-only formula. Removal uses
reversible trash/archive when supported, otherwise the skill provides manual links.
Query coverage and incomplete write verification are disclosed.

The existing skill-local MusicBrainz/Discogs resolver remains an optional enrichment
helper. It is not required for routine queries or listening-field edits. Discogs
search through that helper requires `DISCOGS_TOKEN`; unavailable sources are
reported rather than invented.

## Notion Movie Library

Use `$notion-manage-movies` explicitly to query, add, update, or reversibly remove
movies. Natural-language requests are sufficient; clear instructions authorize
scoped changes without a mandatory second confirmation.

The skill discovers live data sources, fields, options, and templates. Metadata
uses `Name`, `Genres`, `Release Date`, and canonical `IMDb`/`TMDB` URLs. Movie
identity is checked against remakes, sequels, and TV entries before writing;
existing identities are deduplicated and incomplete query coverage is disclosed.
Public metadata comes from agent-native web tools, with no backend or direct API
requirement. Ordinary library queries stay within Notion unless enrichment is requested.

Director and Cast can link verified existing People Vault records; missing or
ambiguous people require clarification. Personal Status, Watched Date, Score, and
Is in Library change only as requested; Rating and In Library remain formulas.
Public ratings never become personal scores, and release dates are distinct from
viewing dates. Unrequested values, notes, and uploaded covers are preserved.

Creation uses the live template, repairs the consistent icon when necessary, and
returns a verified poster image or direct image link for manual addition. Removal
uses reversible trash/archive if supported, otherwise the skill returns manual
page links. Writes are verified and uncertain results are reconciled before retry.

## Notion Drama Library

Use `$notion-manage-dramas` explicitly for lightweight query, creation, updates,
and reversible removal. Clear natural-language requests authorize scoped changes
without a mandatory second confirmation. The skill discovers the live schema,
options, and template and discloses incomplete query coverage.

Series, seasons, parts, and specials remain distinct. Shared series-level IMDb or
TMDB TV URLs do not alone prove duplicates; title, year, and season scope are
reconciled. Reference supports a verified fallback such as Douban. Episodes and
Release Date match the selected unit; aired counts are not silently treated as
final totals, and partial dates are not padded.

Category and Genres reuse current options. Director, Cast, and Writer link verified
existing People Vault records without incidental people creation. Status, Watched
Date, Score, and Is in Library stay under user control; Rating and In Library are
read-only formulas. Research & Archive is a status, not a removal operation.

Creation uses the live template and checks its consistent icon, returning a verified
poster image or direct link for manual addition. Updates preserve unrequested
values, notes, and covers. Removal uses reversible trash/archive if supported,
otherwise returns manual page links. Mutations are verified before reporting success.

## Notion Video Game Library

Use `$notion-manage-games` explicitly for query, create, update, and reversible
removal. Clear natural-language instructions authorize scoped changes without a
mandatory second confirmation. The skill discovers the live schema and template,
checks duplicates, and discloses incomplete query coverage.

Game identity distinguishes base games, DLC, remakes, remasters, ports, and editions.
IGDB links and release dates must match the selected scope. Developer and Series
link verified existing records. Owned On reflects only user-specified ownership;
adding another owned platform does not automatically create a duplicate game.

My Score, Playtime (h), Purchase Price, Last Played At, Finished At, and Status stay
under user control. Public scores, store prices, and completion estimates are not
personal values. Hours and currency must be clear. Rating, Playable On, and
Emulators are read-only, and related databases are not modified incidentally.

Creation uses the live template and checks its consistent icon, returning a verified
cover image or direct link for manual addition. Updates preserve unrequested values,
notes, and covers. Removal uses supported reversible trash/archive or returns manual
links; removing ownership is distinct from deleting the game. Writes are verified
and uncertain outcomes are reconciled before retrying.

## Notion Knowledge Vault

Use `$notion-manage-knowledge` explicitly for lightweight query, create, scoped
property/body updates, and reversible removal. Clear natural-language requests
authorize scoped changes without mandatory repeated confirmation.

The skill discovers live fields and templates. The source URL property is distinct
from the Notion page URL; Type(Manual) is writable and Type is a formula. Category,
Source, and status use existing options. Resource identity preserves lesson,
version, release, and edition distinctions; personal notes can have no source URL.

Templates are selected by their type defaults, not their identical names. Creation
uses the matching template and checks its icon; missing templates or repair support
are reported without guessing. A verified cover/thumbnail image or link is returned
for manual addition, or its unavailability is disclosed.

Ordinary metadata collection preserves body content. Explicit note edits or summaries
stay within the requested scope and cite sources without inventing personal insights.
App, Magazine, and Podcast link existing records without incidental related-page
changes. Status Archived is distinct from deletion; ambiguous archive requests are
clarified. Queries disclose incomplete coverage and writes are verified before success
is reported.

## Notion Documentary Library

Use `$notion-manage-documentaries` explicitly for lightweight query, creation,
scoped updates, and reversible removal in the Documentary Library.

The skill distinguishes films, series, seasons, and episodes, verifies IMDb and
contextual title matches, and does not treat a shared parent-series URL as a duplicate.
It discovers live Type, Series, and Topics options. Status, Watched Date, and Is in
Library are personal fields; In Library is a read-only formula.

Creation uses the live template, verifies the uniform gray document icon, and
returns a verified poster/image link for manual addition. Updates preserve unrelated
content and covers; unsupported icon repair or removal is reported with page links.

## Authoritative Sources

- Plugin README: `codex/plugins/cthu-codex/README.md`
- Book Library skill: `codex/plugins/cthu-codex/skills/notion-manage-books/SKILL.md`
- Requirements: `openspec/specs/codex-plugins-cthu-codex-anki-mcp/spec.md`, `openspec/specs/codex-plugins-cthu-codex-language-coach/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-sentence-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-vocabulary-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-english-expression-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-album-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-movie-library-skill/spec.md`
