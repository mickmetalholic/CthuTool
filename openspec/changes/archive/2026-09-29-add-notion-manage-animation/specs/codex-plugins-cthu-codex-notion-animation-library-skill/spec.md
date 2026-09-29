## Purpose

Provide lightweight, explicitly invoked management of the personal Animation Library while preserving work identity, voice credits, viewing data, and template conventions.

## ADDED Requirements

### Requirement: Manual schema-guided CRUD
The skill SHALL support query, creation, scoped update, and reversible removal only when explicitly invoked, using live schema and existing options without incidental schema or view changes.

#### Scenario: Read-only query
- **WHEN** the user searches the Animation Library
- **THEN** the skill returns relevant fields and page links, discloses incomplete coverage, and does not mutate records

#### Scenario: Authorized removal
- **WHEN** the user requests removal of an identified record
- **THEN** the skill uses supported reversible removal or reports the limitation with a manual link, never permanent deletion

### Requirement: Animation identity and credits
The skill MUST distinguish series, seasons, parts, films, specials, remakes, and adaptations, check exact-scope duplicates before creation, and verify metadata at the selected scope. People relations SHALL resolve to verified existing pages with role and voice-language distinctions preserved.

#### Scenario: Shared series identifier
- **WHEN** two seasons share a series-level IMDb URL
- **THEN** the skill checks season context rather than treating the URL alone as duplicate proof

#### Scenario: Voice credits
- **WHEN** Cast metadata contains multiple language versions
- **THEN** the skill resolves the intended version or clarifies ambiguity, without substituting characters for people or incidentally creating related records

### Requirement: Personal and derived field protection
The skill MUST preserve Status, Watched Date, Score, and Has Document unless requested, retain template defaults on creation, and never write Rating. Episodes SHALL represent the selected unit's count rather than watched progress. Research & archive SHALL remain distinct from page removal.

#### Scenario: Missing metadata completion
- **WHEN** the user requests metadata completion
- **THEN** verified empty metadata is filled without inventing personal scores, viewing dates, document flags, or unverified episode totals

#### Scenario: Ambiguous archive request
- **WHEN** archive could mean Research & archive status or removing the page
- **THEN** the skill clarifies the intended operation before mutation

### Requirement: Template icon and poster output
The skill SHALL use the live template for creation, verify template conventions on updates without resetting content, repair a missing icon from the verified template when supported, and output a verified poster/image or direct image link for manual addition on creation.

#### Scenario: Failed template application
- **WHEN** the template fails or its icon is missing
- **THEN** the skill repairs the icon using the verified convention or reports the limitation while preserving unrelated content

#### Scenario: Unavailable image
- **WHEN** no image can be verified for the selected work
- **THEN** the skill reports the gap without inventing a URL or replacing the cover automatically
