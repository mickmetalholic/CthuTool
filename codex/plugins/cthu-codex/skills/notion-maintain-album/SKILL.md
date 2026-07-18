---
name: notion-maintain-album
description: Maintain one album in the personal Notion Album database: add an album, complete missing album metadata, resolve a MusicBrainz Release Group or Release URL, reconcile a Discogs Master, or check whether MusicBrainz and Discogs identify the same album. Use for explicit personal album-library maintenance requests, not ordinary music discussion. Always show a read-only candidate and field-change preview and obtain explicit confirmation before any Notion write.
---

# Notion · Maintain Album

Maintain exactly one album per invocation. Read
`references/schema-and-matching.md` before accessing Notion. Use the bundled
`scripts/resolve-album.mjs` for URL classification, external metadata lookup,
normalization, scoring, and conflict evidence; resolve its path relative to this
installed `SKILL.md`, never the repository root.

## Scope

Accept natural-language title/artist input, a MusicBrainz Release Group URL, a
concrete MusicBrainz Release URL, a Discogs Master URL, or a Notion Album page URL.
Classify the operation before lookup:

- `add`: create an album only when no canonical duplicate exists.
- `complete`: fill missing metadata on one reconciled existing page.
- `check`: compare sources and report evidence without offering or performing a
  write unless the user later requests mutation.

If the request contains multiple albums, ask the user to choose one. Personal
listening mutations (`Status`, `Listened Date`, `Score`, `Rating`) are outside this
skill and must not be performed.

## Read-only preflight

1. Fetch the live Album database and the People Vault data source targeted by its
   `Artist` relation. Validate every required name, type, relation target, current
   select/multi-select option, and default template against the reference. Report
   exact drift and stop on incompatibility.
2. Run the resolver with the normalized single-album input. Search MusicBrainz
   Release Groups, not Releases. A concrete Release URL must be looked up only to
   obtain its owning Release Group; ignore the edition's date for `Release Date`.
3. Require one MusicBrainz candidate above the documented score and margin, or a
   direct identifier that passes conflicts. For a partial `first-release-date`,
   display its precision and leave `Release Date` missing.
4. Prefer exactly one Discogs Master relation on the Release Group. Otherwise use
   Master-only Discogs search. Validate title, artist, and year; do not let Discogs
   replace MusicBrainz name, date, or type.
5. Locate the Album target by canonical Release Group URL, then Discogs Master URL.
   Treat title plus Artist only as a clarification candidate, never a unique key.
   Use a data-source query when available; otherwise follow the fetched-view/search
   fallback in the reference.
6. Resolve every artist credit to People Vault by canonical `MusicBrainz Artist`
   URL. If no URL matches, accept only one exact normalized-name page whose URL is
   empty and preview filling it. A missing page, multiple exact names, or a
   different non-empty URL blocks the album write. Never create an Artist page.
7. Normalize confirmed Discogs `genres` and `styles` against current Genre options.
   Preserve the existing option spelling and list every genuinely missing option.

## Preview and confirmation

For `add` or `complete`, show one immutable plan containing:

- candidate IDs, scores, score margins, evidence, and all conflicts;
- each Album field's current value, proposed value, action (`create`, `fill`,
  `keep`, `replace-blocked`, or `omit`), and authority URL;
- the Release Group/Release distinction and date precision;
- all new Genre and Release Type options;
- every People Vault page and proposed MusicBrainz Artist URL update; and
- the target or duplicate Notion page URL.

Do not write while a blocking conflict exists. Do not replace a non-empty value
after generic confirmation; require explicit approval naming each replacement and
generate a new plan. Ask for explicit confirmation of the exact mutation plan.
Check-only requests end after the report and never request write confirmation.

## Confirmed write

After confirmation, refetch the Album schema, target/duplicate page, and affected
People Vault pages. Compare all planned values, identifiers, relation targets, and
option sets. If anything changed, discard the stale plan and present a refreshed
preview.

Apply the unchanged plan in order:

1. Add every still-missing, confirmed Discogs Genre/Style option and any confirmed
   new MusicBrainz primary-type option. Reuse normalized existing options.
2. Fill only approved missing People Vault `MusicBrainz Artist` URLs. Never replace
   a conflicting URL.
3. Query again by canonical Release Group URL. Create one Album page with the live
   default template, or minimally update the reconciled target. Write only the
   approved metadata: `Name`, `Artist`, full `Release Date`, `Release Type`,
   `Genre`, `MusicBrainz Release Group`, and `Discogs Master`. Omit personal fields
   from the payload.

Fetch every affected schema and page after each phase and verify exact values. On
partial or uncertain results, discover current state before any retry, retain
successful approved mutations, and never repeat the whole plan blindly. Return the
Album page URL plus any field whose verification remains incomplete.

## Safety rules

- No Notion write of any kind before an explicit preview confirmation.
- No silent candidate choice, value overwrite, date precision fabrication, Artist
  creation, duplicate creation, or use of a Release date as original release date.
- No full external API payloads in Notion or logs; retain only canonical source URLs
  and concise evidence.
- Use a meaningful MusicBrainz/Discogs User-Agent and bounded, serialized requests.
- Never write streaming links as authority for core metadata.
