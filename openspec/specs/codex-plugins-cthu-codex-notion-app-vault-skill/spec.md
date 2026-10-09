# App Vault Skill Specification

## Purpose

Provide lightweight manual management of App Vault records while preserving application identity, existing classifications, knowledge relations, and page content.

## Requirements

### Requirement: Explicit schema-guided CRUD
The skill SHALL support query, creation, scoped updates, and reversible removal only when explicitly invoked, using live fields and options. It MUST distinguish the app URL property from the Notion page URL and MUST NOT install or uninstall software as part of record management.

#### Scenario: App search
- **WHEN** the user queries App Vault
- **THEN** the skill returns records and links, discloses incomplete coverage, and does not mutate records

#### Scenario: Record removal
- **WHEN** the user removes an identified app record
- **THEN** the skill uses supported reversible removal or reports a manual fallback, without deleting software or permanently deleting the record

### Requirement: App identity and scoped membership edits
The skill SHALL verify product identity using official product/store links and publisher context, check duplicates before creation, reuse current Platform and Tag options, and preserve unrelated memberships and content. Knowledges SHALL link verified existing Knowledge Vault pages without incidental related-page creation or editing.

#### Scenario: Similar product names
- **WHEN** matching names refer to different publishers or editions
- **THEN** the skill resolves the intended product before writing rather than merging by name alone

#### Scenario: Add a platform or knowledge link
- **WHEN** the user requests adding one membership
- **THEN** other memberships remain intact and missing or ambiguous knowledge targets are clarified

### Requirement: Template icon and image handling
The skill SHALL use a live template when available, disclose its absence or application failure, and verify page icons after creation or update without resetting content. Existing app-specific icons MUST be preserved; new or missing icons SHALL use the corresponding official website's verified favicon/apple-touch-icon, with no generic fallback. Creation SHALL return a verified app image or link for manual addition, or disclose its unavailability.

#### Scenario: No template and missing icon
- **WHEN** live discovery finds no template and the record has no icon
- **THEN** the skill reports the template gap and applies the verified website icon where supported, or reports retrieval/application limitations

#### Scenario: Existing branded icon
- **WHEN** an existing app record has a custom icon
- **THEN** the skill preserves it unless replacement is requested and does not automatically apply returned artwork
