## Purpose

Enable lightweight, manually invoked Comic Book Library maintenance while preserving comic identity, multiple creators, personal records, and consistent presentation.

## ADDED Requirements

### Requirement: Explicit-only comic management
The plugin SHALL provide `notion-manage-comics` with a `Notion ·` display name and implicit invocation disabled. It SHALL accept natural-language create, read, update, and reversible-delete requests without a fixed syntax or redundant confirmation of clear authorized operations.

#### Scenario: Manual invocation
- **WHEN** the user invokes `$notion-manage-comics` with a clear operation
- **THEN** the skill handles that operation against Comic Book Library
- **AND** ordinary comic discussion does not implicitly invoke it

### Requirement: Live schema and scoped CRUD
The skill SHALL use the live schema of database `b8c2404f2d9f4d34ac6208bcb737acdb`, preserve unrelated data, and avoid schema or view changes during record maintenance.

#### Scenario: Create or find a comic
- **WHEN** a new comic is requested
- **THEN** the skill checks existing entries using identity evidence before creating and returns an existing match without duplication
- **AND** new entries default to Want to Read unless otherwise requested

#### Scenario: Missing fields and partial queries
- **WHEN** a request depends on an absent field or unavailable exhaustive query
- **THEN** the skill reports the limitation without inventing fields or presenting partial retrieval as complete
- **AND** it does not assume Genres, Series, Finished, or progress fields exist

#### Scenario: Targeted update
- **WHEN** the user requests a field update or missing metadata completion
- **THEN** only requested fields or missing factual metadata change, preserving unrelated values and notes

#### Scenario: Reversible deletion
- **WHEN** removal of a resolved comic entry is requested
- **THEN** the skill uses supported reversible trash/archive without deleting related people or access channels
- **AND** unsupported deletion is reported without emptying the page or claiming success

### Requirement: Comic scope and creator preservation
The skill SHALL distinguish works, parts, volumes, and editions without automatically splitting or merging entries. It SHALL preserve multiple creator relations and reuse verified shared records.

#### Scenario: Work title with a volume reference
- **WHEN** an existing work-level entry references a catalog volume
- **THEN** the skill does not automatically rename it to the volume, split it, or treat another volume as the same record solely by title
- **AND** material ambiguity is clarified before mutation

#### Scenario: Multiple authors
- **WHEN** a comic already links multiple creators and metadata is completed
- **THEN** existing creators are preserved and verified additional creators are linked only as needed for the request
- **AND** unsupported author-role fields are not introduced

### Requirement: Personal reading data and notes
The skill SHALL use user-provided personal scores, status, and access information, leave Rating as a read-only formula, and preserve page bodies for personal notes.

#### Scenario: Publication completion differs from reading completion
- **WHEN** public metadata says a series ended or the user finished one volume
- **THEN** the whole work is not marked Read without corresponding user intent
- **AND** Research & Archive remains distinct from Read

#### Scenario: Metadata enrichment
- **WHEN** factual metadata is completed
- **THEN** public scores or availability do not populate personal Score or Access
- **AND** catalog blurbs and duplicate bibliographic sections are not inserted into notes

### Requirement: Comic template and shared icon
The skill SHALL use the current comic template for creation and ensure its shared icon on creates and updates. Failed or unsupported template application SHALL fall back to explicit verified icon repair without duplicating content.

#### Scenario: Template application or repair
- **WHEN** a comic is created or updated
- **THEN** asynchronous template effects are verified before dependent edits, personal fields and notes are preserved, and the comic icon is verified
- **AND** unresolved template or icon failures are reported honestly

### Requirement: Cover handoff and mutation verification
The skill SHALL return a verified cover image or direct image link for every newly created comic, or explicitly report its absence. Writes SHALL be verified and uncertain outcomes checked before retries.

#### Scenario: Cover corresponds to the entry
- **WHEN** a cover is available for a new entry
- **THEN** the result includes the image or direct image link matched to the work and identified edition
- **AND** representative volume artwork for a work-level entry is labeled as such, with per-comic labels in batches

#### Scenario: Missing cover or uncertain write
- **WHEN** no verified cover is found or a write has an uncertain outcome
- **THEN** the limitation is reported without fabricating an image or claiming an unverified write succeeded
- **AND** state is checked before retrying a mutation, with available Notion links included in results
