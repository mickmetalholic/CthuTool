---
name: notion-add-channel
description: Add a YouTube or Bilibili channel to the personal Notion Channel Library after checking for duplicates, resolving an existing category, selecting the platform template, and returning the entry URL. Use only when the user explicitly invokes `$notion-add-channel`.
---

# Notion · Add Channel

Add one YouTube or Bilibili channel to the configured Notion database. Treat the database as live state: fetch its schema, category options, and templates on every run instead of relying on cached IDs.

## Constants

- Database: `https://app.notion.com/p/2c52c070ae2f42dbad20a3b4ff7764f3?v=3aa4470214734650ab0388d5f5d4bdac&source=copy_link`
- Required properties: `Name`, `Link`, `Source`, `Tags`
- Supported `Source` values: `YouTube`, `Bilibili`

## Workflow

1. Parse the explicit invocation for a channel URL and an optional category.
2. If the channel URL is missing, ask for it and stop without reading or writing Notion.
3. Fetch the configured database through the Notion connector. Extract the current data-source ID, property schema, `Tags` options, and template IDs. Stop with a clear connection error if the Notion connector is unavailable.
4. Confirm that the required properties exist and that the platform has a matching `Source` option.
5. Identify and inspect the channel:
   - Accept YouTube channel URLs using `/channel/`, `/@handle`, `/c/`, or `/user/`.
   - Accept Bilibili channel URLs using `space.bilibili.com/<uid>`.
   - Reject video, playlist, search, and unsupported-site URLs; ask for the channel homepage URL.
   - Normalize the URL to HTTPS, remove query strings, fragments, and trailing slashes, and preserve the channel identifier or handle.
   - Read the channel page or current web metadata to determine its display name, canonical identity when available, description, and representative recent content.
6. Check for an existing entry before creating anything:
   - Query the fetched data source with parameterized SQL.
   - Compare normalized `Link` values first.
   - Also compare the canonical YouTube channel ID or handle, or the numeric Bilibili UID, when available.
   - Treat a same-name entry as a candidate only; verify its link or platform identity before declaring it a duplicate.
   - If a duplicate exists, do not create or update anything. Return the existing Notion page URL.
7. Resolve the category from the data source's current `Tags` options:
   - If the user supplied a category, require an exact existing option. For a close or invalid value, show the nearest existing options and ask the user to choose; do not create yet.
   - If the user omitted the category, infer the strongest existing option from the channel description and representative recent content. Present the proposed category with a short reason and ask for explicit confirmation before creating.
   - If no category is sufficiently supported, present the most plausible two or three existing options, or the full option list when necessary, and ask the user to choose.
   - Treat a category supplied in the original invocation or explicitly confirmed in a follow-up as authorization for that category only.
8. Select the correct template dynamically:
   - Fetch every current database template page.
   - Select the template whose default `Source` property exactly equals the detected platform.
   - Prefer the matching platform icon only as a secondary check.
   - If no template matches, or more than one matching template remains ambiguous, stop and ask the user instead of creating a blank page or guessing.
9. Create the database page with the selected `template_id` and no explicit page content. Set:
   - `Name` to the channel display name.
   - `Link` to the normalized channel URL.
   - `Source` to the detected platform.
   - `Tags` to a JSON array containing the confirmed category value or values.
10. Fetch the created page after template application. Verify its name, link, source, tags, and platform template icon. Retry the fetch briefly if template application is still pending; never apply a second template to compensate for normal asynchronous delay.
11. Report the channel name, source, confirmed category, and clickable Notion entry URL. If verification is incomplete, say exactly which field or template signal could not be verified.

## Safety Rules

- Never create an entry without a channel URL.
- Never create an entry from a video URL when the channel homepage cannot be resolved reliably.
- Never create a duplicate or silently edit an existing entry.
- Never invent a category or add a new `Tags` option.
- Never infer a missing category and write it without explicit user confirmation.
- Never hard-code the data-source ID or template IDs; discover them from the database each run.
- Never fall back to a blank page when the platform template cannot be identified.
