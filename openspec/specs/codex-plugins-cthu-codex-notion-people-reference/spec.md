# Shared People Reference Specification

## Purpose

Share People & Organizations schema, identity, relation, and template conventions across relevant Notion library workflows without broadening mutation authority.

## Requirements

### Requirement: Conditional shared entity guidance
The unified skill SHALL load the shared entity reference when resolving or creating related People & Organizations entries, preserve Person/Ensemble/Organization identity, and retain each originating library's permission boundaries.

#### Scenario: Existing-only music relation
- **WHEN** a music request requires a missing related performer
- **THEN** loading the shared reference does not independently authorize creating that performer

### Requirement: Required type-appropriate template
Authorized entity creation MUST use a verified live template, with bands using the electric-guitar template and individuals using the user template, including individual musicians. Templates MUST be distinguished by verified ID/icon rather than their shared name or list order. Other organizations MUST NOT automatically be treated as bands.

#### Scenario: Individual musician
- **WHEN** an authorized operation creates an individual musician
- **THEN** it uses the user template and appropriate Entity Type rather than selecting electric-guitar from a Musician tag

#### Scenario: Band
- **WHEN** an authorized operation creates a band
- **THEN** it uses the electric-guitar template and verifies template application and icon before reporting full success

#### Scenario: Template unavailable or failed
- **WHEN** the required template is unavailable or application fails
- **THEN** the skill reports the limitation, avoids silently substituting blank creation, and reconciles any created page before retrying; manual icon repair alone is not reported as successful template application

### Requirement: Shared relation preservation
The skill SHALL reuse verified identities, preserve unrelated tags and cross-library memberships, and distinguish role-specific reciprocal relations. It MUST NOT clean up legacy links or rewrite shared records as an incidental relation operation.

#### Scenario: Linking a book author
- **WHEN** an existing person is linked to a book
- **THEN** their film, music, and other library relations remain intact
