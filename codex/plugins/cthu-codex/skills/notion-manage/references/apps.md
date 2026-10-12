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

No template was returned on 2026-10-09. This is an explicit no-template exception,
not a successful template application. Recheck availability and apply a live template
if present, then use the corresponding official website's verified icon for the app
page. Prefer its declared favicon or apple-touch-icon; resolve relative image URLs
against the verified site. Do not guess `/favicon.ico` or substitute a generic database
icon. Preserve existing app-specific icons unless replacement is requested.

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
- On creation or missing-icon repair, retrieve the corresponding official website's
  verified favicon/apple-touch-icon and apply it using supported icon tools, then
  refetch to verify. This app-specific icon rule overrides the generic template-icon
  convention. If retrieval/application fails, report the missing icon without using
  a generic fallback or claiming success. Do not replace an existing icon incidentally.

Record CRUD does not install, launch, purchase, or uninstall software, or alter accounts/subscriptions.
