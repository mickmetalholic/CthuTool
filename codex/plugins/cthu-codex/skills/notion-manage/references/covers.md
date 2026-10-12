# Cover handling

Apply on creation in the eight media libraries, or when cover completion/replacement
is requested. Preserve existing covers unless replacement is requested, including
covers supplied by a template. Wait for template application before setting a cover.
Knowledge, channels, apps, and people/organizations are outside this workflow.

## Choose the image

| Library | Direct-link sources, in priority order |
| --- | --- |
| English-language books | Goodreads, matching the selected edition |
| Music releases | MusicBrainz / Cover Art Archive, then Discogs |
| Movies | TMDB Movie, then IMDb |
| Dramas | Multi-season entries: TMDB TV matching season poster; other dramas: TMDB TV, then IMDb |
| Games | IGDB wherever possible, matching the game/edition |
| Documentaries | TMDB, then IMDb, matching the selected film/series/season/episode |
| Animation | IMDb, matching the selected work/season/episode |

For multi-season drama entries, follow [drama rules](dramas.md): each season uses
its own TMDB TV season poster. If unavailable, report it; do not automatically fall
back to IMDb, Douban, a general series poster, or another season's image.

Use a verified actual image URL from the matching source record, not its detail-page
URL or a guessed image path. Set it through the supported Notion page `cover` URL
operation and refetch to verify. For image retrieval failures or missing image URLs, first try the shared in-app
browser fallback in [SKILL.md](../SKILL.md). If retrieval or application fails, follow the
Douban route below; inspect uncertain writes before retrying or replacing anything.

Except for the seasonal-drama rule above, use the corresponding Douban cover for all other cases: this includes Chinese books,
comics, and unavailable direct-link covers above. Match the work and
edition/release/season; label representative volume art used for a whole comic work.
This cover policy does not change metadata-source priorities. Do not use unrelated
artwork or invent an image URL when no matching cover can be verified.

For music, prefer the verified Release Group's Cover Art Archive front cover;
otherwise use a matching release's front cover, then the verified Discogs Master's
front artwork. Read actual image URLs from source pages or API responses, not
catalog detail URLs or guessed image paths. Match the album/recording identity;
if neither source yields usable artwork, follow the Douban upload route below.

## Douban: download, upload, and set the cover

Documentary exception: download the matching Douban image to `~/downloads` and
return the local file for manual cover setting, without automatic native upload.
Use browser download when direct retrieval fails. The upload helper below applies
to the other libraries; documentary TMDB/IMDb covers still use direct links.

Use `scripts/set-cover.mjs` relative to the installed skill directory. It accepts
JSON on stdin; pass a verified image URL and the target page ID, for example:

```json
{"page_id":"<page-uuid>","image_url":"https://<verified-image-host>/cover.jpg","filename":"Original Title"}
```

If direct image retrieval fails, download the verified image through the in-app
browser, then pass its absolute `local_path` instead of `image_url`:

```json
{"page_id":"<page-uuid>","local_path":"/absolute/path/to/cover.jpg","filename":"Original Title"}
```

Supply exactly one image input. Local files receive the same size/type validation
and are copied to a unique file under `~/downloads`, preserving the original. With
a token they continue through native upload; without one return the local fallback.

Run `node scripts/set-cover.mjs` from the skill directory. The agent chooses and
verifies the image identity and waits for template completion first; the script does
not search catalogs or create pages. Set `replace: true` only for requested cover
replacement. Keep the direct-link route above on the existing Notion connector.

The script uses only Node built-ins. It checks HTTP responses, file signatures and
basic image headers for PNG/JPEG/GIF/WebP (not a full image decoder), enforces a
20 MiB limit, and saves a uniquely named file under `~/downloads`. HTML/block pages
are rejected. It uses `NOTION_TOKEN` from the process environment for native upload,
cover assignment, and refetch verification; workspace limits still apply. Never put
the token into input JSON, arguments, skill files, source control, or logs, or extract
MCP credentials. The integration must have access to the target page.

Result JSON uses these statuses:

- `uploaded_cover_set`: upload, cover assignment, and refetch verification succeeded.
- `preserved_existing`: an existing cover was left untouched; no upload occurred.
- `manual_required`: downloaded file is available in `local_path`; return its absolute
  clickable path and `page_url` and ask the user to set it manually. `reason` identifies
  missing credentials, access/upload failure, concurrent cover changes, or uncertain
  write/verification outcomes. Do not repeat an uncertain PATCH blindly.
- `download_failed`: no complete validated file is reported; disclose the failure.
- `invalid_request`: fix the input before retrying; no successful operation is claimed.

Before PATCH, the script rechecks that the cover has not changed since its initial
read. It preserves existing covers by default, never alters icons/body/properties,
and retains downloaded files for manual fallback. Missing token/API access does not
block successful library entry creation. Report the source and per-item outcome;
upload success alone is not cover success.

API reference: https://developers.notion.com/guides/data-apis/uploading-small-files
