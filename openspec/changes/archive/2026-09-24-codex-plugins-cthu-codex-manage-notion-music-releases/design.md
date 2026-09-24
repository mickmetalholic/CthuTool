## Context

See proposal.md. Live Music Release points to the existing album skill data source. Its default template has a gray music-album icon and Want to listen status. The old skill owns a standalone read-only resolver and integration tests; none requires a new MCP server.

## Goals / Non-Goals

Keep everyday CRUD instructions short while preserving identity and metadata provenance. Do not migrate live schemas, introduce automation, edit other library skills, or perform live record mutations for validation.

## Decisions

- Rename the existing skill instead of adding a competing entry point for the same database. Keep the existing capability path to preserve ownership and history.
- Move the resolver unchanged and document it as optional metadata enrichment. Its metadata-only payload helper still intentionally excludes personal fields; ordinary personal-field CRUD uses the connector directly. Resolver suggestions for People Vault updates or missing options never authorize those mutations.
- Replace mandatory preview confirmation with clear-request authorization and targeted clarification. This keeps the user in control without repeating approval for routine edits.
- Keep schema identity and source semantics in the main skill; put resolver usage and thresholds in a short optional reference. Remove obsolete tests that assert exact old policy prose; retain behavioral resolver and relocated-install coverage.
- Use the live template and icon rather than generating a cover or permanently hardcoding template defaults. Cover images are returned for manual use.

## Risks / Trade-offs

- Renamed invocation breaks old shortcuts → document replacement and remove the old packaged directory.
- Connector search may be incomplete or deletion unavailable → disclose coverage and supported operations; never claim a successful removal without evidence.
- Optional resolver retains metadata-only legacy helper names → reference clearly limits their scope; run the existing behavioral suite unchanged apart from paths.

## Migration Plan

Rename skill and update metadata, references, docs, and test import paths. Validate the skill, resolver suite, and selected OpenSpec delta. Sync this capability and archive only this change; commit and push its isolated branch. No PR creation or merge. Roll back the commit to restore the prior skill.
