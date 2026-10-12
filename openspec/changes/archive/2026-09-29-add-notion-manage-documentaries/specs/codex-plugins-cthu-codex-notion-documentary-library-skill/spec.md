## Purpose

Provide explicit, lightweight management of the personal Notion Documentary Library while preserving documentary identity, viewing data, and template conventions.

## ADDED Requirements

### Requirement: Explicit lightweight CRUD
The skill SHALL support natural-language query, creation, scoped updates, and reversible removal only when explicitly invoked, using the live Documentary Library schema and existing options. It MUST NOT change schema or views as a side effect.

#### Scenario: Manual query
- **WHEN** the user invokes the skill to find documentaries
- **THEN** it returns relevant fields and page links, discloses incomplete coverage, and does not mutate records

#### Scenario: Scoped update or removal
- **WHEN** the user clearly requests an update or removal of identified records
- **THEN** it changes only the requested fields or uses supported reversible removal, verifies the outcome, and reports unsupported operations without substituting permanent deletion

### Requirement: Scope-aware documentary identity
The skill SHALL distinguish films, series, seasons, and episodes, verify IMDb identity and contextual title matches, and check duplicates before creating records. It MUST NOT treat a shared series IMDb URL as proof that distinct seasons or episodes are duplicates.

#### Scenario: Episode versus parent series
- **WHEN** an episode request has a matching parent-series record
- **THEN** it verifies episode context and does not update the parent as if it were the episode

### Requirement: Preserve personal and derived fields
The skill MUST preserve Status, Watched Date, and Is in Library unless requested, retain creation template defaults, and never write the In Library formula. Release dates MUST refer to the selected scope and MUST NOT be fabricated from partial dates.

#### Scenario: Metadata completion
- **WHEN** the user requests missing documentary metadata
- **THEN** it fills verified empty metadata without inventing viewing history, collection ownership, personal notes, or formula values

### Requirement: Template icon and image output
The skill SHALL use the live template on creation, verify conventions on updates without resetting content, repair missing icons from the verified template when supported, and return a verified poster or image link for manual addition on creation.

#### Scenario: Template failure
- **WHEN** template application fails or leaves an icon missing
- **THEN** it applies the verified uniform icon using supported tools or discloses the limitation, preserving existing content

#### Scenario: Image unavailable
- **WHEN** no image can be verified for the selected documentary
- **THEN** it reports the gap without inventing a URL or automatically replacing the cover
