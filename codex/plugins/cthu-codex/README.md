# CthuCodex

<p align="center">
  <img src="assets/logo.png" alt="CthuCodex logo" width="560" />
</p>

CthuCodex is the repository-managed Codex plugin for CthuTool workflows and reusable assistant utilities.

## Utilities

- **Language coach hook** - checks English prose before continuing with the user's request.
- **Anki MCP server** - connects to local AnkiConnect to read collection context, validate candidate notes, create cards, store media, and open notes in Anki's Browser for review.
- **Anki Japanese sentence card maker skill** - turns Japanese example sentences and grammar points into `Japanese Sentence` Anki notes with cloze deletion, English translation, English grammar notes, and optional tags.
- **Anki Japanese vocabulary card maker skill** - turns marked Japanese example sentences into `Japanese Vocabulary` Anki notes with dictionary-form vocabulary, readings, bracket-cue blank examples, English meanings, and optional tags.

The language coach uses deterministic local filtering before injecting coaching instructions. It ignores code blocks, inline code, command lines, and identifier-only snippets, and it does not translate Chinese prompts by default.

## Anki MCP Server

The Anki tools require Anki desktop with the AnkiConnect add-on running locally. By default, CthuCodex connects to:

```text
http://127.0.0.1:8765
```

Set `CTHU_ANKI_CONNECT_URL` or `ANKI_CONNECT_URL` to override the endpoint.

Available tools:

- `cthu_anki_status` - check whether AnkiConnect is reachable.
- `cthu_anki_collection_schema` - read decks, note types, fields, templates, and tags.
- `cthu_anki_find_notes` - search notes with Anki browser query syntax.
- `cthu_anki_get_notes` - read note details by note ID.
- `cthu_anki_validate_notes` - validate candidate notes before writing.
- `cthu_anki_add_notes` - validate and create notes, optionally with `openAfterCreate`.
- `cthu_anki_store_media` - store media files before note fields reference them.
- `cthu_anki_open_notes` - open existing note IDs in Anki's Browser.

`cthu_anki_add_notes` uses validation before writing and limits batch size. When `openAfterCreate` is true, it opens created notes with an Anki Browser search like `nid:123 OR nid:456`. Browser opening failures are reported as warnings and do not undo successful note creation.

## Anki Japanese Sentence Card Maker Skill

Use `$anki-japanese-sentence-card-maker` when you want Codex to create a Japanese grammar sentence card. The skill defaults to deck `0.Japanese::Japanese Sentences` and model `Japanese Sentence`.

The skill is explicit-only: `agents/openai.yaml` sets `policy.allow_implicit_invocation: false`, so Codex should not implicitly invoke it from ordinary prompts.

It accepts either a marked grammar point:

```text
うちの課は女性がよく飲みに行くの**に対して**、男性は皆まっすぐ家に帰る。
```

Or a separate grammar point line:

```text
うちの課は女性がよく飲みに行くのに対して、男性は皆まっすぐ家に帰る。
に対して
```

If `tags:` is omitted, the skill creates the note with no tags.

When `tags:` is provided, or when a standalone line looks like a tag hierarchy, the skill normalizes spaced hyphen hierarchy shorthand such as `新完全マスター - N３・文法 - 第１部・１１課` to `新完全マスター::N３・文法::第１部・１１課` before validation.

For example, in this input, the second line is treated as the tag, while `って` is taken from the marked grammar span:

```text
佐藤さんの奥さんは料理の先生だ**って**。
新完全マスター - N３・文法 - 第１部・７課
```

The `ヒント` field uses the canonical grammar pattern rather than the raw clozed phrase; for example, a cloze over `買うことにした` uses `～ことにする` as `ヒント`.

## Anki Japanese Vocabulary Card Maker Skill

Use `$anki-japanese-vocabulary-card-maker` when you want Codex to create a Japanese vocabulary card. The skill defaults to deck `0.Japanese::Japanese Vocabulary` and model `Japanese Vocabulary`.

The skill is explicit-only: `agents/openai.yaml` sets `policy.allow_implicit_invocation: false`, so Codex should not implicitly invoke it from ordinary prompts.

It accepts a vocabulary target marked with double brackets:

```text
子供が生まれて（うまれて）うれしかった**一方で**、[[重い]]責任（せきにん）も感じた。
```

Or a single bold target when no double-bracket target exists:

```text
子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。
```

The skill removes `[[ ]]` and `** **` markers, preserves kana annotations, stores dictionary-form vocabulary in `単語`, and generates `穴埋め例文` in the existing style by replacing the sentence surface form with a short English cue such as `[serious]`.

If `tags:` is omitted and no standalone tag-like line is present, the skill creates the note with no tags.

## Install

From the repository root:

```bash
chc codex install
```

After install, start a new Codex thread or restart Codex so the bundled MCP
server is loaded. In a fresh thread, use `/mcp` to verify the `anki` server and
its tools are available.
