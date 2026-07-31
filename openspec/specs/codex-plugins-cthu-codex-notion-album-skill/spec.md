# codex-plugins-cthu-codex-notion-album-skill Specification

## Purpose
Define the CthuCodex plugin-local workflow for safely resolving album metadata from MusicBrainz and Discogs and maintaining the configured Notion Album and People Vault databases through preview-confirmed, idempotent writes.

## Requirements
### Requirement: Plugin-local Notion album skill
CthuCodex SHALL provide a plugin-local skill for maintaining the configured personal Notion Album database from natural-language album requests and supported source URLs.

#### Scenario: Skill is packaged and grouped
- **WHEN** the Notion album skill is installed
- **THEN** its instructions live under `codex/plugins/cthu-codex/skills/notion-maintain-album/`
- **AND** its skill name is `notion-maintain-album`
- **AND** its display name starts with `Notion ·`

#### Scenario: Album maintenance request invokes the skill
- **WHEN** the user asks to add, complete, audit, or reconcile an album in the personal Notion Album database or supplies a MusicBrainz or Discogs album URL for that purpose
- **THEN** the skill may run its read-only preflight without requiring a `$skill-name` invocation
- **AND** it MUST NOT write to Notion before presenting a preview and receiving explicit confirmation

#### Scenario: Ordinary music discussion does not invoke album maintenance
- **WHEN** the user discusses an album without asking to maintain the personal Notion Album database
- **THEN** CthuCodex does not read or modify the Album database through this skill

### Requirement: Album and People Vault schema contract
The Album workflow SHALL require the agreed Album and People Vault property names, types, and meanings and SHALL preserve existing personal data while aligning the live schema.

#### Scenario: Album schema is aligned
- **WHEN** the schema migration is applied to the verified Album data source
- **THEN** `Date` is renamed to `Listened Date` without changing its stored values
- **AND** `Release Type` exists as a select property supporting MusicBrainz primary release-group types
- **AND** `Name`, `Artist`, `Release Date`, `Genre`, `MusicBrainz Release Group`, and `Discogs Master` retain their existing property types

#### Scenario: People Vault schema is aligned
- **WHEN** the schema migration is applied to the data source targeted by the Album `Artist` relation
- **THEN** that data source has a `MusicBrainz Artist` URL property
- **AND** no existing People Vault property or relation is removed

#### Scenario: Core property meanings are documented
- **WHEN** the schema migration is complete
- **THEN** the live schema or an explicitly required verified schema step documents `MusicBrainz Release Group` as an abstract Release Group URL only
- **AND** it documents `Discogs Master` as a Master URL only
- **AND** it documents `Release Date` as the earliest MusicBrainz Release Group date
- **AND** it documents `Genre` as the controlled Discogs-derived genre/style vocabulary
- **AND** it documents `Artist` as a People Vault relation

#### Scenario: Runtime schema is incompatible
- **WHEN** a required property is missing, renamed, related to another data source, or has an incompatible type
- **THEN** the skill reports the exact mismatch
- **AND** it does not silently recreate, rename, or replace the property during normal album maintenance
- **AND** it performs no album write

### Requirement: Album input and operation resolution
The skill SHALL resolve one requested album and distinguish add, missing-field completion, and check-only operations before accessing external metadata.

#### Scenario: Title and artist are supplied
- **WHEN** the user supplies an album title and artist name
- **THEN** the skill normalizes them for candidate search while preserving the original input for display
- **AND** it searches MusicBrainz Release Groups rather than concrete Releases

#### Scenario: MusicBrainz Release Group URL is supplied
- **WHEN** the user supplies a valid MusicBrainz Release Group URL
- **THEN** the skill looks up that Release Group directly
- **AND** it still validates title, artist, type, date, and conflicts before proposing a write

#### Scenario: Concrete MusicBrainz Release URL is supplied
- **WHEN** the user supplies a valid MusicBrainz Release URL
- **THEN** the skill resolves its owning Release Group
- **AND** it proposes only the canonical Release Group URL
- **AND** it does not use the concrete Release's regional, reissue, or remaster date as `Release Date`

#### Scenario: Check-only operation is requested
- **WHEN** the user asks only whether MusicBrainz and Discogs match
- **THEN** the skill reports candidates, scores, source values, and conflicts
- **AND** it does not offer or perform a Notion write unless the user subsequently requests a mutation

### Requirement: MusicBrainz Release Group resolution
The skill SHALL use deterministic, rate-limited MusicBrainz resolution and SHALL treat the Release Group as the canonical album identity and metadata authority for name, artist credit, earliest release date, and primary release type.

#### Scenario: One high-confidence Release Group is found
- **WHEN** normalized title, artist identity, primary type, known year, and MusicBrainz search score produce one eligible candidate with the required score and margin
- **THEN** the skill recommends that Release Group
- **AND** it displays the candidate score and evidence
- **AND** the score does not authorize a write

#### Scenario: Release Group candidates are ambiguous
- **WHEN** multiple eligible Release Groups are tied or within the configured score margin, the artist is missing, or an edition qualifier conflicts
- **THEN** the skill presents the relevant candidates
- **AND** it waits for the user to choose or clarify
- **AND** it does not write to Notion

#### Scenario: MusicBrainz metadata supplies complete core values
- **WHEN** the confirmed Release Group has a title, artist credit, full earliest release date, and primary type
- **THEN** the skill proposes those values for `Name`, `Artist`, `Release Date`, and `Release Type`
- **AND** it records the canonical Release Group URL as their authority

#### Scenario: Earliest release date has partial precision
- **WHEN** MusicBrainz exposes only a year or year-month earliest date
- **THEN** the skill reports the available precision
- **AND** it does not fabricate a month or day
- **AND** it leaves `Release Date` unmodified unless the user supplies a separately confirmed full date

### Requirement: Discogs Master matching and Genre option expansion
The skill SHALL use a confirmed Discogs Master to cross-check the MusicBrainz identity and SHALL add missing Discogs genre/style values to the Album `Genre` options only within an approved album mutation.

#### Scenario: MusicBrainz links one Discogs Master
- **WHEN** the confirmed Release Group has exactly one Discogs Master URL relationship
- **THEN** the skill fetches that Master before performing a Discogs search
- **AND** it validates the Master's title, artist, and year against MusicBrainz

#### Scenario: Discogs relationship is unavailable
- **WHEN** the Release Group has no usable Discogs Master relationship
- **THEN** the skill searches Discogs Masters using the confirmed title, artist, and year
- **AND** it scores only Master candidates
- **AND** it requires clarification when candidates remain ambiguous

#### Scenario: MusicBrainz and Discogs conflict
- **WHEN** the proposed Master has a different artist, an unresolved title identity, or a conflicting year
- **THEN** the skill displays the conflict
- **AND** it does not silently replace MusicBrainz name, date, or type with Discogs values
- **AND** it performs no write until the conflict is explicitly resolved

#### Scenario: Confirmed Master contains new genre or style values
- **WHEN** the approved preview contains normalized Discogs Master genre/style values not present in the current `Genre` options
- **THEN** the skill includes every new option in the preview
- **AND** after confirmation it refetches the schema and adds the still-missing options
- **AND** it writes the resulting values to the album
- **AND** it retains the Discogs Master URL as provenance

#### Scenario: Genre option already exists
- **WHEN** a Discogs genre/style matches an existing option after case and whitespace normalization
- **THEN** the skill reuses the existing option
- **AND** it does not create a duplicate spelling variant

### Requirement: People Vault Artist relation resolution
The skill SHALL resolve every MusicBrainz artist credit to an existing People Vault page and SHALL use `MusicBrainz Artist` as the stable identity whenever available.

#### Scenario: Artist URL matches one person
- **WHEN** one People Vault page has the same canonical MusicBrainz Artist URL as a Release Group artist credit
- **THEN** the skill proposes that page in the Album `Artist` relation

#### Scenario: Exact name fallback finds one person
- **WHEN** no MusicBrainz Artist URL match exists and exactly one fetched People Vault page has the exact normalized artist name
- **THEN** the skill proposes that page as the relation
- **AND** it previews filling the page's missing `MusicBrainz Artist` URL

#### Scenario: Artist identity conflicts
- **WHEN** a name candidate has a different non-empty MusicBrainz Artist URL, multiple exact-name pages exist, or no page exists
- **THEN** the skill reports the affected artist credit
- **AND** it asks the user to select or create an Artist record separately
- **AND** it does not create a duplicate People Vault page
- **AND** it performs no album write

#### Scenario: Multiple artist credits resolve
- **WHEN** a Release Group has multiple artist credits and every credit resolves without conflict
- **THEN** the skill proposes all resolved People Vault pages in the Album `Artist` relation

### Requirement: Read-only preview and conflict authorization
The skill SHALL complete a live read-only preflight and receive explicit confirmation for the exact plan before changing schema options, People Vault pages, or Album pages.

#### Scenario: Preview is ready
- **WHEN** one Release Group, Discogs Master, and all Artist relations resolve without blocking conflicts
- **THEN** the skill displays every current value, proposed value, action, and authority URL
- **AND** it separately lists new Genre options and People Vault identifier updates
- **AND** it leaves non-empty Album values unchanged by default

#### Scenario: Existing value differs
- **WHEN** a proposed core value conflicts with a non-empty Notion value
- **THEN** the skill reports both values and their sources
- **AND** a generic confirmation does not authorize replacement
- **AND** the user must explicitly approve that field replacement before it can be included in a later write plan

#### Scenario: User has not confirmed the plan
- **WHEN** the preview is displayed but the user has not explicitly confirmed it
- **THEN** the skill does not add Genre options
- **AND** it does not update People Vault or Album pages

#### Scenario: State changes after preview
- **WHEN** a target property, relation, identifier, or option set changes before execution
- **THEN** the skill aborts the stale plan
- **AND** it regenerates the preview from current state before requesting confirmation again

### Requirement: Idempotent Album write and verification
The skill SHALL create or minimally update one Album page without duplicating canonical identities and SHALL verify every approved mutation.

#### Scenario: Existing Release Group entry is found
- **WHEN** an Album page already has the confirmed canonical MusicBrainz Release Group URL
- **THEN** the skill treats that page as the target
- **AND** it fills only approved missing fields
- **AND** it does not create another page

#### Scenario: Title match lacks stable identity
- **WHEN** an existing page has the same normalized title but no matching Release Group or Discogs Master identity
- **THEN** the skill treats it as a duplicate candidate rather than proof of identity
- **AND** it requires Artist and source reconciliation before creating or updating

#### Scenario: New Album entry is approved
- **WHEN** no canonical Release Group duplicate exists and the complete preview is confirmed
- **THEN** the skill refetches the Album data source immediately before creation
- **AND** it creates one page with the confirmed missing metadata and discovered default template
- **AND** it does not set `Status`, `Listened Date`, `Score`, or `Rating`

#### Scenario: Approved mutations complete
- **WHEN** Genre options, People Vault identifiers, or Album properties are written
- **THEN** the skill fetches every affected schema and page
- **AND** it verifies the exact approved values
- **AND** it returns the Album page URL and any incomplete verification detail

#### Scenario: Write result is partial or uncertain
- **WHEN** a schema or page mutation partially fails or returns an uncertain result
- **THEN** the skill discovers the current affected state before retrying
- **AND** it does not roll back successful approved mutations
- **AND** it does not blindly repeat the complete plan

### Requirement: Personal listening data protection
The skill SHALL treat `Status`, `Listened Date`, `Score`, and `Rating` as outside normal album metadata maintenance.

#### Scenario: Album metadata is added or completed
- **WHEN** the skill creates or updates album metadata
- **THEN** it omits `Status`, `Listened Date`, and `Score` from explicit property writes
- **AND** it does not attempt to write the formula `Rating`

#### Scenario: User asks to change listening data
- **WHEN** a user combines album maintenance with a request to change a personal listening field
- **THEN** the skill reports that the personal-field mutation is outside this capability
- **AND** it completes no such mutation under this change
