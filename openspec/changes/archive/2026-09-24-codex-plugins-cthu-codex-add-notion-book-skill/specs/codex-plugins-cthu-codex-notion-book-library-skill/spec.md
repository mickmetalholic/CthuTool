## Purpose

Provide lightweight, manually invoked maintenance of the personal Notion Book Library while preserving personal data, shared relations, and consistent book presentation.

## ADDED Requirements

### Requirement: Explicit lightweight book management
The plugin SHALL provide `notion-manage-books` in the existing `notion-` naming family with a `Notion ·` display name and implicit invocation disabled. It SHALL accept natural-language CRUD requests without a fixed input format or redundant confirmation of an unambiguous authorized operation.

#### Scenario: Manual invocation
- **WHEN** the user invokes `$notion-manage-books` with a clear book-maintenance request
- **THEN** the skill handles the requested operation against Book Library
- **AND** ordinary book discussion does not implicitly activate this skill

### Requirement: Scoped record operations
The skill SHALL use the live schema of database `3c457831780b46ebbe5a33fffb8f945b` for create, read, update, and reversible delete operations. It MUST NOT manage views or change the schema as a side effect of record maintenance.

#### Scenario: Create or locate a book
- **WHEN** the user requests a new book
- **THEN** the skill checks identity using source links, title, author, and relevant edition details before creating
- **AND** it reuses an existing matching book rather than duplicating it and defaults new books to `Want to Read` unless otherwise specified

#### Scenario: Ambiguous edition
- **WHEN** candidate records differ by edition or translation and the intended target is unclear
- **THEN** the skill clarifies the target before changing an affected record instead of merging by title

#### Scenario: Limited retrieval
- **WHEN** available connector capabilities cannot enumerate all matching records
- **THEN** results disclose their limited coverage without claiming an exhaustive count or definitive absence

#### Scenario: Update existing personal records
- **WHEN** the user requests an update or metadata completion
- **THEN** the skill changes the requested values or fills missing factual metadata while preserving unrelated notes, existing values, and relations
- **AND** it does not infer personal scores, completion dates, or ownership from public metadata, write the `Rating` formula, or equate `Research & Archive` with `Read`

#### Scenario: Delete an entry
- **WHEN** the user clearly requests deletion of a resolved book
- **THEN** the skill uses an available reversible trash/archive operation without deleting related authors, series, or access channels
- **AND** if that operation is unavailable it reports the limitation without claiming success

### Requirement: Shared relation preservation
The skill SHALL reuse verified authors, series, and access channels and preserve unrelated data in their shared databases.

#### Scenario: Link an existing author
- **WHEN** the requested book's author already exists in People Vault
- **THEN** the skill links the existing author without replacing their other library relations

### Requirement: Template and shared icon consistency
Creates and updates SHALL follow the current default book template's conventions and ensure the shared book icon. If template application is unavailable, fails, or omits the icon, the skill SHALL explicitly repair the icon using a supported operation and verify the result.

#### Scenario: Create with template
- **WHEN** a new book is created and the default template can be applied
- **THEN** the template is used and its asynchronous application is checked before dependent edits

#### Scenario: Repair icon without duplicate content
- **WHEN** an existing entry is updated or template application fails
- **THEN** the shared icon is checked and repaired as needed without resetting personal fields or duplicating template content
- **AND** an unresolved icon failure is reported explicitly

### Requirement: Cover handoff for new books
Every newly created book SHALL have a verified cover image or direct image link included in the result for manual addition, even if an automatic cover update succeeds. If no verified cover is available, the result SHALL state that limitation.

#### Scenario: Cover available
- **WHEN** a verified cover for the identified book and edition is available
- **THEN** the creation result displays the image or links directly to it, labeled with the book in a batch

#### Scenario: Cover unavailable
- **WHEN** no verified cover image is found
- **THEN** the result reports that fact rather than inventing a URL or presenting a book-detail page as an image

### Requirement: Verified mutation reporting
The skill SHALL verify writes, return affected Notion links, and inspect state before retrying uncertain writes.

#### Scenario: Create result is uncertain
- **WHEN** creation times out or returns an ambiguous outcome
- **THEN** the skill checks for an existing created entry before retrying and reports the verified outcome

### Requirement: Single book maintenance entrypoint
The plugin SHALL replace `notion-maintain-books` with `notion-manage-books` and update user documentation to the new explicit-only entrypoint.

#### Scenario: Updated plugin exposes one book skill
- **WHEN** the plugin is updated with this change
- **THEN** the old book skill is absent and documentation directs users to `$notion-manage-books`
- **AND** no legacy alias restores implicit book maintenance

### Requirement: Personal notes remain user-authored
The skill SHALL reserve page bodies for personal notes and preserve unrelated blocks during targeted note edits.

#### Scenario: Add metadata without generating notes
- **WHEN** the user creates a book or requests bibliographic enrichment without requesting page prose
- **THEN** the skill does not insert catalog blurbs or duplicate bibliographic sections into the page body
