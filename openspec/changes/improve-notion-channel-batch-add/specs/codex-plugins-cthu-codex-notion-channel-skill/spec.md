## MODIFIED Requirements

### Requirement: Channel input and platform resolution
The skill SHALL require at least one supported channel homepage URL, SHALL accept one or more channels in one invocation, and SHALL derive a normalized channel identity for each channel before modifying the Channel Library.

#### Scenario: Channel URL is missing
- **WHEN** the user invokes the skill without any channel URL
- **THEN** the skill asks for one or more channel URLs
- **AND** it does not read or write the Notion database

#### Scenario: One supported channel URL is provided
- **WHEN** the user provides one YouTube channel URL or one Bilibili `space.bilibili.com/<uid>` URL
- **THEN** the skill preserves the existing single-channel workflow
- **AND** it accepts an optional tag list for that channel

#### Scenario: Multiple supported channel URLs are provided
- **WHEN** the user provides multiple supported YouTube or Bilibili channel URLs
- **THEN** the skill treats them as one batch
- **AND** it accepts batch-level default tags and optional per-channel tag overrides
- **AND** a per-channel tag list replaces the batch-level default for that channel

#### Scenario: Supported channel URLs are resolved
- **WHEN** one or more supported channel URLs are provided
- **THEN** the skill normalizes each URL to HTTPS without query, fragment, or trailing slash
- **AND** it resolves each source as `YouTube` or `Bilibili`
- **AND** it reads the minimum current channel metadata needed to determine the display name and canonical identity when available

#### Scenario: Unsupported content URL is provided
- **WHEN** any provided URL identifies a video, playlist, search result, or unsupported site and the channel homepage cannot be resolved reliably
- **THEN** the skill identifies the invalid batch item and asks for its channel homepage URL
- **AND** it does not create any new entry from the batch while that item remains unresolved

### Requirement: Live database discovery and duplicate prevention
The skill SHALL fetch the configured Channel Library schema, category options, and templates once per invocation and SHALL NOT create a duplicate channel entry within the input batch or the database.

#### Scenario: Database state is loaded for a batch
- **WHEN** at least one supported channel URL is available
- **THEN** the skill fetches the configured database URL through the Notion connector once for the invocation
- **AND** it discovers and reuses the current data-source ID, required properties, category options, and templates for the batch
- **AND** it does not rely on hard-coded data-source or template IDs

#### Scenario: Channel is repeated within the input batch
- **WHEN** multiple input items resolve to the same normalized URL or canonical platform identity
- **THEN** the skill processes that identity at most once
- **AND** it reports the remaining occurrences as repeated input items

#### Scenario: Existing channel is found
- **WHEN** a stored entry matches an input item's normalized URL or canonical platform identity
- **THEN** the skill does not create or update that entry
- **AND** it returns the existing Notion page URL for that item
- **AND** the resolved duplicate does not block other valid new items from completing preflight

#### Scenario: Same display name has a different identity
- **WHEN** an entry has the same display name but a different or unverifiable platform identity
- **THEN** the skill does not treat the name alone as proof of a duplicate
- **AND** it verifies the link or asks for clarification before creating any affected new entry

### Requirement: Existing category resolution
The skill SHALL use only tag values currently defined by the Channel Library, SHALL skip content-based category inference for channels with valid user-supplied tags, and SHALL require explicit confirmation before writing inferred tags.

#### Scenario: Valid tags are supplied
- **WHEN** a new channel receives one or more exact existing tag values from its per-channel override or the batch-level default
- **THEN** the skill uses those tags without requesting a second confirmation
- **AND** it does not read the channel description or representative recent content for category inference
- **AND** it still reads the minimum channel identity metadata required for naming and duplicate detection

#### Scenario: Invalid tags are supplied
- **WHEN** any user-supplied tag is not an exact current `Tags` option
- **THEN** the skill collects the invalid values and nearest existing options into one response
- **AND** it waits for the user to choose valid values
- **AND** it does not inspect channel content to reinterpret the invalid values
- **AND** it does not create new batch entries while the values remain unresolved

#### Scenario: Tags are missing for part of a batch
- **WHEN** one or more new, non-duplicate channels have no effective user-supplied tags
- **THEN** the skill reads descriptions and representative recent content only for those channels
- **AND** it proposes the strongest existing option for each sufficiently supported channel with a short reason
- **AND** it presents the inferred tag decisions in one consolidated confirmation
- **AND** it waits for explicit user confirmation before creating the new entries

#### Scenario: Tags cannot be inferred reliably
- **WHEN** no existing tag is sufficiently supported for one or more untagged channels
- **THEN** the skill presents plausible existing options or the full current option list for each affected channel
- **AND** it waits for the user to choose
- **AND** it does not invent or add a tag

### Requirement: Platform-template creation and verification
The skill SHALL preflight all new batch entries, create each ready non-duplicate channel with the template whose default source matches its platform, and return a per-channel result.

#### Scenario: Batch preflight succeeds
- **WHEN** every new batch item has a supported normalized identity, valid or confirmed tags, and exactly one matching platform template
- **THEN** the skill creates the ready pages through a multi-page connector operation when supported
- **AND** it sets each page's `Name`, normalized `Link`, `Source`, `Tags`, and platform-specific `template_id`
- **AND** it provides no explicit page content when applying a template

#### Scenario: Batch preflight has an unresolved item
- **WHEN** any new batch item has an invalid URL, invalid or unconfirmed tags, or a missing or ambiguous platform template
- **THEN** the skill consolidates the unresolved items for the user
- **AND** it does not create any new batch entry until the preflight issues are resolved

#### Scenario: Batch entries are created
- **WHEN** Notion returns one or more created pages
- **THEN** the skill fetches each created page to verify its name, link, source, tags, and platform template signal
- **AND** it retries verification briefly when template application is pending without applying a second template
- **AND** it reports each input item as created, already present, repeated in the input, or failed
- **AND** it returns a clickable Notion URL for every created or existing entry
- **AND** it identifies every verification field or template signal that remains incomplete

#### Scenario: Batch creation result is uncertain or partially fails
- **WHEN** a multi-page creation operation has an uncertain or partial result
- **THEN** the skill verifies all returned or discoverable entries individually
- **AND** it queries the Channel Library again before retrying any uncertain item
- **AND** it does not roll back or silently duplicate entries that were created successfully
