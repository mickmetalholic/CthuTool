## Context

See proposal.md for motivation. Live inspection found Name, Author, Access, Reference, Status, Score, and formula Rating. Author shares People Vault and Access shares Book Access. The default template has blank content, Want to Read status, and a gray book icon. Samples include work-level titles and a two-author entry; the inspection was not a whole-library audit.

## Goals / Non-Goals

**Goals:** A small, self-contained skill with explicit-only metadata and comic-specific identity and preservation rules.

**Non-Goals:** Adding absent fields, imposing a universal work-versus-volume model, automatic content generation, platform downloads, new scripts/services, generated adapters, or changes to book/channel branches.

## Decisions

1. Use `notion-manage-comics` in the authored CthuCodex skill directory with `allow_implicit_invocation: false`. The manifest already discovers that directory, so no registration change is needed.
2. Fetch current schema and template on invocation; hard-code only the database URL. Do not copy book-only fields or cached relation/template IDs.
3. Resolve the intended work, part, volume, and edition using name, authors, and source evidence. A catalog URL can describe a single volume even when the library title describes a whole work. Clarify material ambiguity instead of automatically splitting or merging records.
4. Preserve all existing author relations and other personal data. Verified missing creators can be linked or created when needed for the requested operation, but no unsupported author-role fields are introduced.
5. Reuse the comic template on create, preserve content on update, and repair the verified icon without duplicating template content. The observed fallback is gray `book`, not the ordinary book library's `book-closed` icon.
6. Return a verified cover image or direct image URL for each new comic. Label a representative volume cover when the entry represents the whole work. If identity or image evidence is insufficient, report that instead of fabricating a cover.
7. Keep business rules in the authored skill and acceptance criteria in OpenSpec. No generated adapter regeneration is part of implementation.

## Risks / Trade-offs

- Catalog links and covers can describe different scopes → reconcile scope and label representative volume art; clarify ambiguous record identity.
- Shared author relations can be overwritten accidentally → preserve the full existing set and change only the requested membership.
- Query, icon, or reversible-delete capability may be unavailable → disclose limitations and verify uncertain writes before retrying.
- Lightweight instructions are not executable guarantees → validate metadata and review observable scenarios without mutating the live library merely to test guidance.

## Migration Plan

Add the skill and short docs; no Notion migration is needed. Sync only the new comic capability and archive this completed change before committing and pushing the independent branch. Installation remains a separate operation. Rollback removes the new skill and docs without touching Notion records.
