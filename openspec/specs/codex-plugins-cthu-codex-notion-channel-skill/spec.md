# codex-plugins-cthu-codex-notion-channel-skill Specification

## Purpose
Define the explicit-only CthuCodex workflow for safely adding YouTube and Bilibili channels to the configured personal Notion Channel Library.

## Requirements
### Requirement: Plugin-local Notion channel skill
CthuCodex SHALL provide a plugin-local explicit-only skill for adding YouTube and Bilibili channels to the configured personal Notion Channel Library.

#### Scenario: Skill is packaged and grouped
- **WHEN** the Notion channel skill is installed
- **THEN** its instructions live under `codex/plugins/cthu-codex/skills/notion-add-channel/`
- **AND** its skill name is `notion-add-channel`
- **AND** its display name starts with `Notion ·`

#### Scenario: Skill is explicit-only
- **WHEN** the Notion channel skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex MUST NOT invoke it implicitly from an ordinary request about channels, YouTube, Bilibili, or Notion

### Requirement: Channel input and platform resolution
The skill SHALL require a supported channel homepage URL and derive a normalized channel identity before accessing or modifying the Channel Library.

#### Scenario: Channel URL is missing
- **WHEN** the user invokes the skill without a channel URL
- **THEN** the skill asks for the URL
- **AND** it does not read or write the Notion database

#### Scenario: Supported channel URL is provided
- **WHEN** the user provides a YouTube channel URL or a Bilibili `space.bilibili.com/<uid>` URL
- **THEN** the skill normalizes the URL to HTTPS without query, fragment, or trailing slash
- **AND** it resolves the source as `YouTube` or `Bilibili`
- **AND** it reads current channel metadata to determine the display name and canonical identity when available

#### Scenario: Unsupported content URL is provided
- **WHEN** the provided URL identifies a video, playlist, search result, or unsupported site and the channel homepage cannot be resolved reliably
- **THEN** the skill asks for the channel homepage URL
- **AND** it does not create a Notion entry

### Requirement: Live database discovery and duplicate prevention
The skill SHALL fetch the configured Channel Library schema, category options, and templates on every run and SHALL NOT create a duplicate channel entry.

#### Scenario: Database state is loaded
- **WHEN** a supported channel URL is available
- **THEN** the skill fetches the configured database URL through the Notion connector
- **AND** it discovers the current data-source ID, required properties, category options, and templates
- **AND** it does not rely on hard-coded data-source or template IDs

#### Scenario: Existing channel is found
- **WHEN** a stored entry matches the normalized URL or canonical platform identity
- **THEN** the skill does not create or update an entry
- **AND** it returns the existing Notion page URL

#### Scenario: Same display name has a different identity
- **WHEN** an entry has the same display name but a different or unverifiable platform identity
- **THEN** the skill does not treat the name alone as proof of a duplicate
- **AND** it verifies the link or asks for clarification before creating

### Requirement: Existing category resolution
The skill SHALL use only category values currently defined by the Channel Library and SHALL require explicit confirmation before writing an inferred category.

#### Scenario: Valid category is supplied
- **WHEN** the user supplies an exact existing category value
- **THEN** the skill uses that category without requesting a second confirmation

#### Scenario: Category is missing
- **WHEN** the user omits the category and channel content supports a strongest existing option
- **THEN** the skill presents the proposed category with a short reason
- **AND** it waits for explicit user confirmation before creating the entry

#### Scenario: Category cannot be inferred reliably
- **WHEN** no existing category is sufficiently supported
- **THEN** the skill presents plausible existing options or the full current option list
- **AND** it waits for the user to choose
- **AND** it does not invent or add a category

### Requirement: Platform-template creation and verification
The skill SHALL create a non-duplicate channel entry with the template whose default source matches the detected platform and SHALL return the verified Notion URL.

#### Scenario: One matching platform template exists
- **WHEN** exactly one fetched template has a default `Source` equal to the detected platform and the category is confirmed
- **THEN** the skill creates a page with that template and no explicit page content
- **AND** it sets `Name`, normalized `Link`, `Source`, and `Tags`

#### Scenario: Template selection is missing or ambiguous
- **WHEN** no template matches the detected platform or multiple templates remain ambiguous
- **THEN** the skill asks the user instead of creating a blank page or guessing

#### Scenario: Entry is created successfully
- **WHEN** Notion returns a created page
- **THEN** the skill fetches it to verify the name, link, source, tags, and platform template signal
- **AND** it returns a clickable Notion entry URL
- **AND** it reports any verification field that remains incomplete
