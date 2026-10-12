## Why

Knowledge Vault needs the same lightweight manual CRUD interface as the other libraries, with care for mixed resource types, existing notes, and type-specific templates.

## What Changes

- Add manual-only `notion-manage-knowledge` under the Notion display grouping.
- Support query, create, scoped property/body updates, and reversible removal.
- Distinguish Type(Manual) from formula Type and source URL from the Notion page URL; preserve resource/version identity and current classification options.
- Select templates by verified type defaults, repair matching icons, and return verified resource images or links for manual addition when available.
- Preserve personal learning status and notes; resolve only existing App, Magazine, and Podcast relations without incidental related-page changes.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-knowledge-skill`: Manual Knowledge Vault CRUD with type-aware templates, resource identity, and scoped content editing.

### Modified Capabilities

None.

## Impact

New instruction-only skill and metadata, README/docs additions, and one new capability. No live Notion writes, new scripts or dependencies, schema changes, or generated adapter edits.
