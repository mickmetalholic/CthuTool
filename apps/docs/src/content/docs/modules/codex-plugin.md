---
title: Codex Plugin
description: Repository-managed CthuCodex plugin assets.
---

CthuCodex is the repository-managed Codex plugin for CthuTool workflows and reusable assistant utilities.

## What It Includes

- language coach hook
- Anki MCP server
- Anki card-creation skills
- Notion channel-library skill

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
- `cthu_anki_store_media`
- `cthu_anki_open_notes`

`cthu_anki_add_notes` validates before writing and limits batch size. When `openAfterCreate` is true, it opens created notes in Anki's Browser. Browser opening failures are reported as warnings and do not undo successful note creation.

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

## Authoritative Sources

- Plugin README: `codex/plugins/cthu-codex/README.md`
- Requirements: `openspec/specs/codex-plugins-cthu-codex-anki-mcp/spec.md`, `openspec/specs/codex-plugins-cthu-codex-language-coach/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-sentence-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-japanese-vocabulary-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-english-expression-skill/spec.md`, `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md`
