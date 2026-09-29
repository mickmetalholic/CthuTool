## Context

See proposal.md for motivation. Live discovery found IMDb, Episodes, Genre, three People Vault relations, and personal viewing fields. There is no Type, Season, TMDB, or Reference property. The blank default template uses a gray movie-clapboard-play icon, Want to watch status, and unchecked Has Document.

## Goals / Non-Goals

Goals: a concise skill that handles animation identity and existing person relations without assuming drama-specific fields.
Non-goals: taxonomy changes, related-person creation, media downloads, public-score import, or new runtime tooling.

## Decisions

- Use SKILL.md and explicit-only agents metadata, following neighboring library skills; a resolver script would add unneeded complexity.
- Resolve scope from user intent and verified title/source context instead of inventing missing Type/Season fields.
- Preserve original versus dubbed voice credits and require existing verified people, because names alone can mix roles or language versions.
- Keep Research & archive as a personal status distinct from removal; ambiguous archive requests require clarification.
- Only the user-requested business plugin and documentation change; generated adapters remain unchanged.

## Risks / Trade-offs

- A shared franchise title can hide multiple works → verify scope, year, and canonical identity.
- Ongoing episode totals and partial dates are uncertain → disclose uncertainty rather than manufacture complete values.
- Connector/template capabilities drift → inspect live state and report unsupported actions.
