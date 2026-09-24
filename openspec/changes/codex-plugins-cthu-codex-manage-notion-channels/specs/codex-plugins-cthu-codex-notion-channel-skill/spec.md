## REMOVED Requirements

### Requirement: Plugin-local Notion channel skill
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

### Requirement: Channel input and platform resolution
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

### Requirement: Live database discovery and duplicate prevention
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

### Requirement: Existing category resolution
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

### Requirement: Platform-template creation and verification
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

### Requirement: Explicit browser-tab acquisition
**Reason**: The add-only workflow is replaced by the scoped management contracts below, including explicit CRUD, delegated classification, independent batch outcomes, and preserved browser boundaries.
**Migration**: Use `$notion-manage-channels` and the new channel management requirements.

## ADDED Requirements

### Requirement: Explicit channel management entrypoint
The plugin SHALL provide `notion-manage-channels` with a `Notion ·` display name and implicit invocation disabled, replacing the old add-channel entrypoint and its documentation. It SHALL accept natural-language CRUD requests without mandatory fixed syntax or redundant confirmation of clear authorized operations.

#### Scenario: Manual management
- **WHEN** the user explicitly invokes `$notion-manage-channels` to maintain channel records
- **THEN** the requested CRUD operation is handled and ordinary channel discussion does not implicitly activate this skill
- **AND** the old skill is no longer installed from the plugin source

#### Scenario: No operation supplied
- **WHEN** a bare invocation provides no operation or target
- **THEN** the skill asks what to manage without accessing browser state

### Requirement: Scoped discovery and stable channel identity
The skill SHALL discover live Channel Library schema from `2c52c070ae2f42dbad20a3b4ff7764f3` and support YouTube, Bilibili, and Xiaohongshu entries. Creation SHALL verify a supported homepage and match platform identity before writing; retrieval and existing-record mutations SHALL accept names, Notion links, platform identities, and filters without requiring a new homepage URL.

#### Scenario: Supported creation
- **WHEN** a supported channel homepage is supplied
- **THEN** the skill resolves its current name, platform, and normalized homepage using stable YouTube channel identity when available, Bilibili UID, or Xiaohongshu profile user ID
- **AND** tracking parameters are removed without losing identity

#### Scenario: Existing or repeated channel
- **WHEN** an input matches a stored channel identity or an earlier batch item
- **THEN** creation does not duplicate or silently update it and returns its existing page or repeated-item status

#### Scenario: Name or link ambiguity
- **WHEN** same-name candidates differ in identity or a link correction points to another account
- **THEN** the affected mutation is clarified rather than merging records or silently retargeting one

#### Scenario: Find existing entries
- **WHEN** the user asks for records by name, platform, or tags
- **THEN** the skill searches the live library and returns Notion links without requiring browser access or a homepage URL
- **AND** incomplete query coverage is disclosed rather than reported as exhaustive

#### Scenario: Unsupported creation input
- **WHEN** a supplied input is a video, note, playlist, board, search result, unresolved short link, or unsupported site
- **THEN** the affected item requests a supported homepage and does not create an entry from that content URL

### Requirement: Targeted channel updates and reversible removal
The skill SHALL preserve unrelated fields and page content, use existing schema/options, and scope every mutation to the requested Notion records. Deletion SHALL use supported reversible trash/archive and MUST NOT follow, unfollow, or otherwise mutate platform accounts.

#### Scenario: Update a channel
- **WHEN** the user identifies a unique record and requests a name, link, or tag change
- **THEN** only the requested fields and necessary platform-icon repair are changed, with unrelated notes preserved

#### Scenario: Delete or report unsupported deletion
- **WHEN** the user clearly requests removal of a resolved Notion entry
- **THEN** the skill uses an available reversible delete operation and reports its result
- **AND** absent that capability it reports the limitation rather than emptying the page or claiming deletion

### Requirement: Tag edit intent and delegated classification
The skill SHALL use current tag options, preserve user-supplied valid choices, and distinguish tag addition, removal, and replacement. Automatic classification SHALL require explicit delegation; uncertain classifications SHALL be clarified before the affected tag write.

#### Scenario: Add or remove a tag
- **WHEN** the user asks to add or remove specific tags
- **THEN** only those memberships change and other tags are retained

#### Scenario: Replace tags or apply batch defaults
- **WHEN** the user explicitly replaces tags or supplies shared tags with a per-item override
- **THEN** replacement uses the requested set and a per-item override takes precedence over the batch default

#### Scenario: Supplied tags
- **WHEN** valid tags are supplied
- **THEN** the skill uses them without redundant confirmation or inspecting content merely to reconsider them

#### Scenario: Delegated classification
- **WHEN** the user explicitly asks for automatic classification and current channel evidence supports an unambiguous existing option
- **THEN** the skill assigns it and reports the choice without another confirmation

#### Scenario: Missing, invalid, or ambiguous tags
- **WHEN** tags are missing without classification delegation, invalid, or ambiguous
- **THEN** the skill asks for or proposes existing options and waits for the affected decision without inventing schema options
- **AND** ready independent batch items can still complete

### Requirement: Platform presentation and icon fallback
The skill SHALL create entries with the template matching their platform and ensure the platform icon on create/update without duplicating content. Unsupported or failed template application SHALL use explicit icon repair when the correct icon is verified.

#### Scenario: Matching template applies
- **WHEN** a unique matching template is available and supported
- **THEN** creation uses it and checks asynchronous completion before dependent edits

#### Scenario: Template or icon failure
- **WHEN** application fails or is unsupported, or the expected icon is missing
- **THEN** the skill attempts the verified platform icon through supported operations without reapplying content
- **AND** missing or ambiguous icon/template identity is not guessed and unresolved presentation failures are reported

### Requirement: Explicit read-only browser input
The skill SHALL read browser content only when the user explicitly requests or attaches the relevant tab. It MUST NOT navigate or mutate that tab, read unrelated tab content, or access browser history, cookies, storage, credentials, or profile files.

#### Scenario: Exact selected or attached tab
- **WHEN** the user requests a current tab of an identified browser or attaches an exact reference
- **THEN** only that tab is read, preferring the exact attachment, with minimal identity metadata and a bounded already-loaded content sample only when classification is needed
- **AND** any tool-required metadata listing is limited to exact attachment matching and unrelated metadata is discarded

#### Scenario: Browser access not requested
- **WHEN** inputs are pasted URLs or existing-record queries without a browser request
- **THEN** no browser state is accessed

#### Scenario: Unstable or unavailable tab
- **WHEN** the URL changes during extraction, the selected surface is unclear/unavailable, authentication blocks required metadata, or the tab is unsupported
- **THEN** the snapshot is discarded and the dependent item requests a ready homepage or canonical URL without switching to another tab or browser
- **AND** independent ready items remain eligible to complete

### Requirement: Per-item verification and reliable retries
The skill SHALL verify mutations and report every batch item as created, updated, deleted, already present, repeated, needing clarification, or failed, with available Notion links and unresolved fields. It SHALL inspect state before retrying uncertain writes and preserve independent successful results.

#### Scenario: Partial batch outcome
- **WHEN** ready items coexist with ambiguous or failed items
- **THEN** ready authorized items complete and results distinguish their outcomes without rolling back successful records

#### Scenario: Uncertain write
- **WHEN** a create/update/delete result is uncertain
- **THEN** existing state is checked before retrying and success is reported only when verified
