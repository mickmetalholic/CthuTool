# Book Library schema and edition matching

This is a September 2026 baseline, not a cached schema or a list of fixed
Notion IDs. Fetch the database before every operation and use only current
data-source IDs, relation targets, options, and templates. If a required field
has drifted, reconcile read-only or stop the proposed write.

| Property | Current type | Maintenance boundary |
| --- | --- | --- |
| `Name` | title | Plain-text display title; preserve the represented edition. |
| `Reference` | URL | Catalog page for this entry, often a Douban subject or Goodreads book page. |
| `Author` | relation to People Vault | Match an existing person page; never create one incidentally. |
| `Genres` | multi-select | Use current options only; do not add an option during a book write. |
| `Series` | relation to Book Series | Match an existing series page or leave unset after preview. |
| `Access` | relation to Book Access | Personal ownership/access, not inferred from a catalog. |
| `Status` | status | Personal reading state, not inferred from a public source. |
| `Score` | number | Personal score; never copy a public rating. |
| `Finished` | date | Personal completion date; never infer from publication metadata. |
| `Rating` | formula | Read-only; never write. |

The observed default template was a blank page with `Status` set to `Want to
Read`. Check the live template before using it. A new page should not acquire
a duplicated bibliographic section in its body. Cover images in this library
are user-uploaded files; do not create an external-cover dependency.

## Matching and duplicate decisions

1. Normalize `Reference` only for comparison: canonical HTTPS host/path,
   known tracking parameters and fragment removed, but identity-bearing query
   parameters retained. Preserve the source URL shown to the user and do not
   rewrite an existing reference merely to normalize it.
2. An exact canonical `Reference` match blocks creation and identifies the
   existing Notion page. Confirm the page before proposing any update to it.
3. Same or near-equal title plus author is a candidate, not a duplicate proof.
   Show each candidate's `Reference`, status, and Notion link. A different
   Douban/Goodreads reference can represent another edition; do not merge it.
4. The present schema has no ISBN field. Do not assert cross-catalog edition
   equivalence without direct evidence. If identity remains uncertain, ask
   for the edition, ISBN, catalog URL, or existing Notion page URL.
5. Check for duplicates again immediately before a confirmed creation. On an
   uncertain create response, query by canonical `Reference` and inspect any
   candidate before retrying.

## Field provenance

- Public catalog evidence may support `Name`, `Reference`, `Genres`, and an
  author-name candidate. It cannot supply the ID of a Notion relation page.
- The user owns `Status`, `Score`, `Finished`, `Access`, and substantive notes.
  Keep these unset or unchanged unless the user supplies the value; the live
  default template may set `Status` only if that default is in the preview.
- An existing non-empty field requires a specific user-requested replacement
  in the preview. Do not treat a newer public source as automatic authority to
  replace it.
- For note changes, preview the exact affected passage. Preserve images,
  links, unknown blocks, backlinks, and all unrelated notes.
