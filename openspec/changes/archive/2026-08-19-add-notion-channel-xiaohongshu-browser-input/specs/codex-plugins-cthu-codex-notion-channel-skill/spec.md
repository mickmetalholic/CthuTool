## MODIFIED Requirements

### Requirement: Plugin-local Notion channel skill
CthuCodex SHALL provide a plugin-local explicit-only skill for adding YouTube, Bilibili, and Xiaohongshu channels to the configured personal Notion Channel Library from supported homepage URLs or an explicitly selected browser tab.

#### Scenario: Skill is packaged and grouped
- **WHEN** the Notion channel skill is installed
- **THEN** its instructions live under `codex/plugins/cthu-codex/skills/notion-add-channel/`
- **AND** its skill name is `notion-add-channel`
- **AND** its display name starts with `Notion ·`

#### Scenario: Skill is explicit-only
- **WHEN** the Notion channel skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex MUST NOT invoke it implicitly from an ordinary request about channels, YouTube, Bilibili, Xiaohongshu, browser tabs, or Notion
- **AND** it MUST NOT read browser state unless an explicit `$notion-add-channel` invocation requests or attaches a browser tab

### Requirement: Channel input and platform resolution
The skill SHALL require at least one supported channel input, SHALL accept one or more channels in one invocation, and SHALL derive a normalized channel identity for each channel before accessing or modifying the Channel Library. A channel input MAY be a supported homepage URL, and at most one input per invocation MAY come from an explicitly requested or attached browser tab.

#### Scenario: Channel URL is missing
- **WHEN** the user invokes the skill without any channel URL and without explicitly requesting or attaching a browser tab
- **THEN** the skill asks for one or more channel homepage URLs or one explicit browser-tab input
- **AND** it does not access browser state
- **AND** it does not read or write the Notion database

#### Scenario: Supported channel URL is provided
- **WHEN** the user provides one supported YouTube, Bilibili, or Xiaohongshu channel homepage URL
- **THEN** the skill normalizes the URL and resolves its platform identity before accessing or modifying the Channel Library
- **AND** it accepts an optional tag list for that channel

#### Scenario: One supported channel URL is provided
- **WHEN** the user provides one YouTube channel URL, one Bilibili `space.bilibili.com/<uid>` URL, or one Xiaohongshu `www.xiaohongshu.com/user/profile/<userId>` URL
- **THEN** the skill preserves the existing single-channel workflow
- **AND** it accepts an optional tag list for that channel

#### Scenario: Multiple supported channel URLs are provided
- **WHEN** the user provides multiple supported YouTube, Bilibili, or Xiaohongshu channel URLs
- **THEN** the skill treats them as one batch
- **AND** it accepts batch-level default tags and optional per-channel tag overrides
- **AND** a per-channel tag list replaces the batch-level default for that channel

#### Scenario: Multiple supported channel inputs are provided
- **WHEN** the user provides multiple supported channel URLs, or supported URLs plus one explicit browser-tab input
- **THEN** the skill treats them as one batch
- **AND** it accepts batch-level default tags and optional per-channel tag overrides
- **AND** a per-channel tag list replaces the batch-level default for that channel
- **AND** the browser-tab item participates in the same input-to-result mapping as URL items

#### Scenario: Supported channel URLs are resolved
- **WHEN** one or more supported homepage URLs are provided or obtained from a stable browser-tab snapshot
- **THEN** the skill normalizes each URL to HTTPS without query, fragment, or trailing slash
- **AND** it resolves each source as `YouTube`, `Bilibili`, or `Xiaohongshu`
- **AND** it reads the minimum current channel metadata needed to determine the display name and canonical identity when available

#### Scenario: Xiaohongshu creator homepage is resolved
- **WHEN** an input URL matches `www.xiaohongshu.com/user/profile/<userId>` with a non-empty user ID
- **THEN** the skill normalizes it to `https://www.xiaohongshu.com/user/profile/<userId>`
- **AND** it resolves the source as `Xiaohongshu`
- **AND** it uses the path user ID as the canonical platform identity
- **AND** it resolves the current creator nickname for the entry name before creation

#### Scenario: Unsupported content URL is provided
- **WHEN** any input identifies a video, note, playlist, board, search result, short-link landing page, or unsupported site and a supported channel homepage cannot be resolved without navigating or mutating the selected tab
- **THEN** the skill identifies the invalid batch item and asks for its channel homepage URL or a ready homepage tab
- **AND** it does not create any new entry from the batch while that item remains unresolved

### Requirement: Live database discovery and duplicate prevention
The skill SHALL fetch the configured Channel Library schema, category options, and templates once per invocation after all requested browser-tab inputs have resolved successfully, and SHALL NOT create a duplicate channel entry within the input batch or the database.

#### Scenario: Database state is loaded
- **WHEN** at least one supported channel input has resolved to a stable normalized identity and no requested browser-tab input remains unresolved
- **THEN** the skill fetches the configured database URL through the Notion connector once for the invocation
- **AND** it discovers the current data-source ID, required properties, category options, and templates
- **AND** it does not rely on hard-coded data-source or template IDs

#### Scenario: Database state is loaded for a batch
- **WHEN** at least one supported channel input has resolved to a stable normalized identity and no requested browser-tab input remains unresolved
- **THEN** the skill fetches the configured database URL through the Notion connector once for the invocation
- **AND** it discovers and reuses the current data-source ID, required properties, category options, and templates for the batch
- **AND** it confirms that every resolved platform, including `Xiaohongshu` when present, exists in the live `Source` options
- **AND** it does not rely on hard-coded data-source or template IDs

#### Scenario: Channel is repeated within the input batch
- **WHEN** URL and browser-tab inputs resolve to the same normalized URL or canonical YouTube, Bilibili, or Xiaohongshu identity
- **THEN** the skill processes that identity at most once
- **AND** it reports the remaining occurrences as repeated input items

#### Scenario: Existing channel is found
- **WHEN** a stored entry matches an input item's normalized URL or canonical platform identity, including a Xiaohongshu user ID
- **THEN** the skill does not create or update that entry
- **AND** it returns the existing Notion page URL for that item
- **AND** the resolved duplicate does not block other valid new items from completing preflight

#### Scenario: Same display name has a different identity
- **WHEN** an entry has the same display name but a different or unverifiable platform identity
- **THEN** the skill does not treat the name alone as proof of a duplicate
- **AND** it verifies the link or asks for clarification before creating any affected new entry

## ADDED Requirements

### Requirement: Explicit browser-tab acquisition
The skill SHALL treat browser state as an optional, explicitly authorized, read-only input source and SHALL limit page-content access to the exact selected or attached tab needed for one channel item.

#### Scenario: User explicitly requests the current browser tab
- **WHEN** an explicit `$notion-add-channel` invocation requests the current tab of a named or selected browser surface
- **THEN** the skill acquires only that currently selected tab
- **AND** it reads the tab's final URL, title, and platform-specific channel metadata needed by the workflow
- **AND** it does not enumerate or inspect unrelated tabs

#### Scenario: User attaches or identifies a specific browser tab
- **WHEN** an explicit `$notion-add-channel` invocation includes an exact browser-tab reference
- **THEN** the skill uses that referenced tab instead of guessing another tab from title, URL, recency, or browser history
- **AND** if the browser surface requires an open-tab metadata listing to claim the reference, it uses one listing only to match the exact attached ID, title, and URL and discards unrelated metadata
- **AND** it does not switch to a different browser surface without user approval

#### Scenario: Browser access is not requested
- **WHEN** the invocation contains only pasted channel URLs
- **THEN** the skill completes the URL workflow without connecting to or reading any browser

#### Scenario: Selected tab is read without mutation
- **WHEN** the skill reads an explicitly authorized browser tab
- **THEN** it records the tab URL before and after metadata extraction
- **AND** it does not navigate, refresh, click, type, scroll, submit, close, or otherwise mutate the tab
- **AND** it does not read browser history, cookies, local storage, session storage, credentials, passwords, profile files, or unrelated page data

#### Scenario: Selected tab changes during extraction
- **WHEN** the selected tab's URL changes before metadata extraction completes
- **THEN** the skill discards the unstable tab snapshot
- **AND** it asks the user to make the intended channel homepage ready or provide its canonical URL
- **AND** it does not load or write the Notion database for that invocation while the tab item remains unresolved

#### Scenario: Valid explicit tags accompany a tab input
- **WHEN** a new browser-tab channel receives one or more exact current tag values
- **THEN** the skill reads only the minimum page metadata required for source, normalized link, display name, and canonical identity
- **AND** it does not inspect the profile description or recent content for category inference

#### Scenario: Tags are missing from a tab input
- **WHEN** a new, non-duplicate browser-tab channel has no effective user-supplied tags
- **THEN** the skill may read the profile description and a bounded sample of currently loaded recent-content metadata
- **AND** it does not scroll, open content, or navigate away to expand that sample
- **AND** it applies the existing inferred-tag confirmation requirement before any Notion write

#### Scenario: Browser or tab cannot provide a supported identity
- **WHEN** the requested browser surface is unavailable, no selected tab exists, authentication or verification blocks the page, or the tab is not a supported channel homepage
- **THEN** the skill reports the specific browser-tab problem and asks the user to make that browser tab ready or provide a canonical channel URL
- **AND** it does not silently select another tab or browser surface
- **AND** it does not load or write the Notion database while the tab item remains unresolved
