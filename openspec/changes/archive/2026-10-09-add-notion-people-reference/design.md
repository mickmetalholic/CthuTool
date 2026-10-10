## Context

People & Organizations uses the same data source previously called People Vault. Live fields include Name, Entity Type, Manual Tag, MusicBrainz Artist, and role-specific reciprocal relations. Two New page templates have blank bodies and no Entity Type defaults, with user and electric-guitar icons.

## Goals / Non-Goals

Goals: one shared reference, correct creation templates, and preservation of shared identities/links.
Non-goals: broadening implicit related-record creation, modifying live schema, migrating legacy records, or introducing a standalone skill.

## Decisions

- Link the reference from the main routing guidance and every existing reference using People Vault, loading it only for relevant relation operations.
- Record verified template IDs and icons. User-confirmed mapping is bands to electric-guitar and individuals to user; ambiguous other organizations need live evidence or clarification rather than an invented universal mapping.
- Require actual template application on authorized creation, retaining icon repair as a disclosed recovery step rather than a replacement for the template.
- Keep originating library permissions intact and protect reciprocal relations, including legacy links.

## Risks / Trade-offs

- Template names are identical → resolve by live ID/icon and inspect defaults.
- Person and organization aliases overlap → reconcile Entity Type and stable identifiers.
- Asynchronous template failure can cause duplicate retries → inspect the created page and repair/report without recreating it.
