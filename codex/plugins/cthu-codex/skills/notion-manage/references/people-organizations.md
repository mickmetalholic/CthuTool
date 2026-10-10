# People & Organizations

Shared entity reference for relevant library relations, formerly named People Vault.
Read it when matching, linking, or creating an entity, not for unrelated queries.
It does not broaden the originating reference's creation/edit permissions: reuse
existing entries where that library requires it. Apply these conventions to any
separately requested entity operation as well.

## Schema and identity

- Database: `https://app.notion.com/p/4ad6d45d6ad44151910eb88e498fe780`.
- Data source: `collection://0beb941d-d073-4079-a207-c8126201d1eb`.
- `Name`: title; `Entity Type`: select, currently Person / Ensemble / Organization.
- `Manual Tag`: multi-select; current options include Musician, Actor/Actress,
  Director, Philosopher, Statesman. Preserve unrelated tags and reuse live options.
- `MusicBrainz Artist`: canonical Artist URL, not Release, Release Group, or Work URL.

Fetch current schema and candidates. Prefer verified stable identity where available,
then reconcile names/aliases, entity type, and credits. Same names are not duplicate
proof; a band, its members, and its label are distinct entities. Ensemble describes
performing groups, while Organization is not automatically a musical group. Missing
MusicBrainz identity is acceptable for non-music entities; do not invent identifiers
or overwrite an existing conflicting URL. Do not add nonexistent IMDb or other fields.

## Creation must apply a template

Both observed templates are named `New page`, have blank bodies, and have no observed
Entity Type defaults. Identify them by live ID/icon, not name or list position:

| Intended entity | Template hint | Expected icon |
| --- | --- | --- |
| Individual person, including a musician | `49c5eb54-f5af-4662-856e-eedfce5299a3` | gray `user` |
| Band | `900d4f01-abe0-4cf6-b524-c8d89f89e0a3` | gray `electric-guitar` |

Choose by actual entity type, not merely a Musician tag. For other ensembles or
organizations, verify an applicable live convention or clarify a materially ambiguous
choice; do not assume every organization is a band or select the database's friends
icon in place of a template. Set the verified Entity Type explicitly when needed.

Apply the selected template using the [shared workflow](templates.md).

## Shared role relations

Observed reciprocal fields include:

- `Book (Author)` and `Comic Book (Author)`.
- `Movie (Director)`, `Movie (Cast)`; `Drama (Director)`, `Drama (Cast)`, `Drama (Writer)`.
- `Bangumi (Director)`, `Bangumi (Cast)`, `Bangumi (Writer)` target Animation Library.
- `Music Release (Artist)`, `Music Release (Conductor)`, `Music Release (Performer)`.
- `Classical Work (Composer)`, `Song (Artist)`.
- `Legacy Classical Album (Conductor)` and `Legacy Classical Album (Ensemble)`.

Verify live targets rather than matching only property names. Prefer the requested
source library's relation field and let Notion maintain the reciprocal link. Do not
replace all memberships, infer every role from one credit, or edit the other end
independently. Preserve unrelated cross-library links, notes, and legacy relations;
this reference does not authorize migration, deduplication/merging of shared entities,
or deletion of related works. Unlinking a person from a work is not deleting the person.

## New people while adding movies or dramas

For movie/drama creation, resolve and deduplicate credited people first. Link verified
existing matches directly, preserving their records. Present only missing people in
one selection request, showing each name, Director/Cast/Writer role as applicable,
and enough work/season context to distinguish identities. Deduplicate a person with
multiple roles or seasons into one candidate. Do not preselect everyone or treat
silence as selection. Clarify ambiguous existing matches rather than creating duplicates.

Use a true multi-select tool when available. If the available question tool only
supports single choice, do not simulate multi-select with single-choice options;
provide a numbered list and let the user reply with multiple numbers, all, or none.
Create and link only the selected missing people, using the live Person template
and verifying its icon and Entity Type. Apply only verified roles supported by live
fields/options; never invent a Writer tag. Unselected people remain uncreated and
unlinked. Finish independent work metadata, template, cover, and existing-person
links while awaiting the selection; do not recreate the movie or drama afterward.

This creation workflow does not authorize automatic backfill of existing drama
credits, nor unrelated person edits or creation in other library workflows.
