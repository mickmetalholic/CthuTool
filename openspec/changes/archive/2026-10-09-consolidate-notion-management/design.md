## Context

Eleven entry points duplicate common CRUD instructions while their schemas and domain safeguards differ. The music entry also carries a portable resolver and Classical Work matching notes.

## Goals / Non-Goals

Goals: one explicit-only entry point, selective library references, preserved domain behavior.
Non-goals: schema/data changes, automatic invocation, broadening related-record permissions, or installing the plugin.

## Decisions

- Move shared CRUD into SKILL.md and keep each library's schema and care points in references. Avoid loading all references or creating a second routing layer.
- Split Classical Work matching from optional music resolver notes; neither is required for ordinary music queries.
- Retain library-specific relation exceptions, including book/comic related-record behavior, rather than imposing a new global restriction.
- Remove old entry directories and update active specifications and documentation. Keep historical archives intact.
- Move the resolver unchanged and update its existing portability test. Generated adapters remain unchanged; this explicitly requested business-plugin edit is authorized.

## Risks / Trade-offs

- Dropping details while deduplicating → retain domain safeguards and review operation-specific exceptions.
- Broken relative paths → validate local links and run the installed-plugin resolver test.
- Ambiguous library selection → clarify destination instead of writing into multiple libraries.
