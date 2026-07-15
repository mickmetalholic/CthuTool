## Why

CthuCodex skills are growing beyond the original Anki workflows, but their invocation names and UI labels do not follow one consistent grouping convention. The plugin also needs a reusable, explicit-only workflow for adding YouTube and Bilibili channels to the personal Notion Channel Library without duplicates or incorrect templates.

## What Changes

- **BREAKING** Rename the three Anki skill invocation names and directories to the consistent `anki-create-<object>` convention.
- **BREAKING** Name the new Notion workflow `$notion-add-channel`, replacing the provisional `$add-channel-to-notion` name.
- Group skill display names visually with `Anki · ...` and `Notion · ...` prefixes while keeping the plugin's `skills/` directory flat.
- Keep all four skills explicit-only through `policy.allow_implicit_invocation: false`.
- Add an explicit-only Notion workflow that validates input, checks duplicates, resolves an existing category, chooses the correct platform template, verifies creation, and returns the Notion entry URL.
- Declare the plugin's bundled skills in its manifest and update user documentation and current specifications to the new names.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-channel-skill`: Defines the explicit-only Notion Channel Library workflow for YouTube and Bilibili channels.

### Modified Capabilities

- `codex-plugins-cthu-codex-english-expression-skill`: Renames the skill directory and invocation to the `anki-create-*` convention while preserving its explicit-only behavior.
- `codex-plugins-cthu-codex-japanese-sentence-skill`: Renames the skill directory and invocation to the `anki-create-*` convention while preserving its explicit-only behavior.
- `codex-plugins-cthu-codex-japanese-vocabulary-skill`: Renames the skill directory and invocation to the `anki-create-*` convention while preserving its explicit-only behavior.

## Impact

- Affected plugin source: `codex/plugins/cthu-codex/`
- Affected documentation: `apps/docs/src/content/docs/modules/codex-plugin.md`
- Affected specifications: the three existing CthuCodex Anki skill specs plus one new Notion channel skill spec
- Existing prompts using the old `$anki-*-card-maker` invocation names must switch to the new `$anki-create-*` names.
- The personal marketplace entry remains unchanged; reinstalling the plugin after merge exposes the renamed skills.
