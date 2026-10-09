# Cover handling

Apply on creation in the eight media libraries, or when cover completion/replacement
is requested. Preserve existing covers unless replacement is requested, including
covers supplied by a template. Wait for template application before setting a cover.
Knowledge, channels, apps, and people/organizations are outside this workflow.

## Choose the image

| Library | Direct-link sources, in priority order |
| --- | --- |
| English-language books | Goodreads, matching the selected edition |
| Movies | TMDB Movie, then IMDb |
| Dramas | Multi-season entries: TMDB TV matching season poster; other dramas: TMDB TV, then IMDb |
| Games | IGDB wherever possible, matching the game/edition |
| Documentaries / Animation | IMDb, matching the selected work/season/episode |

For multi-season drama entries, follow [drama rules](dramas.md): each season uses
its own TMDB TV season poster. If unavailable, report it; do not automatically fall
back to IMDb, Douban, a general series poster, or another season's image.

Use a verified actual image URL from the matching source record, not its detail-page
URL or a guessed image path. Set it through the supported Notion page `cover` URL
operation and refetch to verify. If retrieval or application fails, follow the
Douban route below; inspect uncertain writes before retrying or replacing anything.

Except for the seasonal-drama rule above, use the corresponding Douban cover for all other cases: this includes Chinese books,
comics, music releases, and unavailable direct-link covers above. Match the work and
edition/release/season; label representative volume art used for a whole comic work.
This cover policy does not change metadata-source priorities. Do not use unrelated
artwork or invent an image URL when no matching cover can be verified.

## Douban: download, upload, and set the cover

Download the verified Douban image as a file; do not hotlink it as the Notion cover.
Validate that the response is a usable image, not HTML or a blocked-access response.
Save it in `~/downloads` (create that directory if needed), with a safe, descriptive,
collision-free filename and the correct extension. Retain it for manual fallback.

Use the Notion native File Upload API when `NOTION_TOKEN` is available in the process
environment and its integration can edit the target page. Read the token without
printing it; do not put it in skill files, source control, command arguments, or logs.
Do not extract credentials from the connected Notion MCP session.

With an HTTP client, send the token only to `https://api.notion.com` in the Bearer
Authorization header. Use a supported Notion-Version (documented flow: `2026-03-11`):

1. POST `/v1/file_uploads` with `mode: "single_part"`, filename, and image MIME type.
2. POST multipart form data with the image in the `file` field to
   `/v1/file_uploads/{id}/send`. Let the client set the multipart boundary.
3. Only after status is `uploaded`, PATCH `/v1/pages/{page_id}` with
   `{"cover":{"type":"file_upload","file_upload":{"id":"<upload-id>"}}}`.
4. Refetch the page and verify its uploaded cover before reporting success. A
   successful upload alone is not a successful cover update; do not attach the image
   to the body or a Files property instead. Do not reuse temporary signed image URLs
   as permanent external cover URLs.

Attach within the upload's expiry window (normally one hour). The single-part flow
supports up to 20 MiB and remains subject to workspace limits. Report unsupported
sizes rather than claiming an upload succeeded. For uncertain PATCH outcomes, refetch
before retrying; never recreate the library entry to retry its cover.

If the token is absent, API access is unavailable, or upload/cover assignment fails,
keep the downloaded image in `~/downloads` and return its absolute clickable path
plus the Notion page link, asking the user to set the cover manually. Do not block
successful record creation on token setup. If downloading itself fails, report that
no local file was saved; never claim the fallback file exists without checking it.

Report each item's source and outcome: direct-link cover set, uploaded cover set,
local file ready for manual setup, or no verified image. Preserve existing icons.

API reference: https://developers.notion.com/guides/data-apis/uploading-small-files
