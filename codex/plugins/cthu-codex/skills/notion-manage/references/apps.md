# Apps

## Target and fields

- Database: `https://app.notion.com/p/0faf46d7187d4c12849f798b8160dba1`.
- Data source hint: `collection://e9c868d0-3310-4a06-bfc7-3035131f285a`.
- `Knowledges` relation: Knowledge Vault,
  `collection://94d3d31a-68e8-4966-bd0c-4bddf8e19ee0`.

Fetch the live schema and available templates. `Name` is title; `URL` is the app/site
URL, currently exposed as `userDefined:URL`, not the Notion page's system `url`.
`Platform` and `Tag` are multi-selects. Observed platforms: Web, MacOS, Windows,
Linux, iOS, Android. Reuse exact live option names, including existing Tag spelling;
do not silently rename taxonomy or add schema fields, options, or views.

No template was returned during discovery. The database has a gray `window` icon;
sampled records use individual uploaded app/site icons. Recheck live availability.
Use a template if one exists; otherwise report its absence and use the verified
gray window fallback for missing icons, preserving existing app-specific icons.
Do not claim a template was applied or create one as a side effect.

## Essential safeguards

- Match product, publisher, and edition where relevant. Same names or shared vendor
  domains do not prove identity; a suite, individual app, extension, fork, and renamed
  successor are not automatically interchangeable. Verify redirects and aliases.
  Normalize only non-identifying tracking parameters; retain product/store IDs and
  meaningful paths or queries. Prefer official product/store evidence and do not
  invent URLs or substitute an unrelated vendor homepage for a product.
- Respect requested Platform/Tag choices. For delegated enrichment, verify current
  platform support; Web availability alone does not prove a native desktop/mobile app.
  Do not infer installation, ownership, or usage from availability. Clarify whether
  Platform means supported platforms or a selected subset if it affects the write.
  Add/remove only requested memberships; replace the whole set only when intended.
  Report unmapped tags or platforms instead of creating options.
- Resolve requested Knowledges links to verified existing records in the live relation
  target. Preserve unrelated members and clarify missing/ambiguous matches. Do not
  create/edit knowledge pages or unrelated reciprocal memberships as a side effect.
- Verify template conventions and icon after creation/update. If application fails
  or the icon is missing, apply the live template icon using supported tools; when
  no template exists, use the verified gray window fallback. Preserve branded icons
  unless replacement is requested and disclose any unavailable template/repair support.
- Verify image identity against the selected app/site. Return images for manual
  addition; do not automatically replace covers or branded icons, copy another app's
  artwork, or invent image URLs. Missing-image disclosure is an acceptable outcome.

Record CRUD does not install, launch, purchase, or uninstall software, or alter accounts/subscriptions.
