---
name: notion-review-notes
description: Review due notes in the Notion Knowledge Vault. Use on explicit invocation to choose a category, list its due notes, and record the user's recall result for one note at a time.
---

# Notion Review Notes

## Find due notes

Use the connected Notion tools. Fetch the [Knowledge Vault Notes view](https://app.notion.com/p/c81eca90c18a4a0b8cb8bb42098f665f?v=3f7afceceb908176840b000c71ee2907) or its database (`c81eca90-c18a-4a0b-8cb8-bb42098f665f`) to verify the live data source and fields. The saved view selects notes of all review states. Add the `Needs Review` formula filter at query time. It includes first reviews, due dates through today, and overdue notes.

Call Notion `query_data_sources` with this payload, using the verified data source URL:

```json
{
  "data": {
    "mode": "rows",
    "data_source_url": "collection://94d3d31a-68e8-4966-bd0c-4bddf8e19ee0",
    "filter": {
      "type": "group",
      "operator": "and",
      "filters": [
        {
          "type": "property",
          "property": "Type(Manual)",
          "propertyType": "select",
          "operator": "enum_is",
          "value": { "type": "exact", "value": "Note" }
        },
        {
          "type": "property",
          "property": "Needs Review",
          "propertyType": "formula",
          "operator": "every",
          "resultFilter": {
            "type": "property",
            "property": "Needs Review",
            "propertyType": "checkbox",
            "operator": "checkbox_is",
            "value": { "type": "exact", "value": true }
          }
        }
      ]
    },
    "sort": [{ "property": "Last Reviewed", "direction": "ascending" }],
    "limit": 100
  }
}
```

A matching row is due even when its formula cell is represented by a `formulaResult://` reference. If rows report `has_more` without a cursor, keep both filters and split the query into disjoint creation-date ranges. Use `created_time` as both `property` and `propertyType`, with `date_is_before` and `date_is_on_or_after` using the same `YYYY-MM-DD` cutoff. Split only ranges still reporting more rows. If a single day still overflows or a query fails, use an available authorized paginated Notion API query with the same filters or report partial coverage. Announce an empty queue only after a complete successful query.

## Guide the session

1. Show numbered categories and due counts, using the actual `Category` multi-select values. Put notes with no category under “Uncategorized”. Accept an unambiguous category name or number, including a category already specified by the user.
2. Show a numbered list of due titles in that category, with each title linking to the Notion page (`url`). Put never-reviewed notes first, then order by oldest `Last Reviewed`, using title and page ID to break ties. Read a note's body on request when the user wants to review it in chat.
3. Use the last displayed note list to resolve a note number. A note with several categories belongs to each group but shares one page ID. Record a result only when the user identifies one note and gives a recall outcome. Ask which note or outcome is intended when it is unclear. An explicit result for an unambiguous note authorizes the write.

## Record the result

Fetch the selected page by its Notion page ID before writing. Verify that it is still a `Note` in Knowledge Vault and compare its current `Last Reviewed` and `Review Stage` with the queue snapshot. If the review state changed, refresh the queue and report the change instead of applying the result to the new state. Treat a review already recorded today as completed for the session.

Use the user's local calendar date when they report the result. Apply the existing Notion button behavior:

| Result | `Last Reviewed` | `Review Stage` |
| --- | --- | --- |
| Remembered / 记得 | Today | Set an empty stage to `0`. Otherwise set `min(6, current stage + 1)`. A stored `0` advances to `1`. |
| Partially Recalled / 部分记得 | Today | Preserve the current stage, including an empty stage. |
| Forgotten / 忘记 | Today | Set to `0`. |

Call `update_page` with `command: "update_properties"` and the selected `page_id`. In one `properties` object, set `date:Last Reviewed:start` to the date string, `date:Last Reviewed:end` to `null` and `date:Last Reviewed:is_datetime` to `0`. Include the absolute numeric `Review Stage` for Remembered or Forgotten. Omit it for Partially Recalled. `Next Review` and `Needs Review` are calculated by Notion. Scope the write to the review properties on this one page.

Refetch to verify the saved date and expected stage. After a timeout or an unclear response, check the page before retrying. If the target values are already saved, count the review once. Retry the same absolute values once only if the original review state is still present. If the state differs or cannot be read, report the write as unconfirmed and refresh before accepting another result for that note.

After a verified write, remove that page ID from the session's lists and refresh the live due query. Report the saved result and the selected category's remaining count, using the refreshed list for any new numbers. If the refresh fails, report the verified save and identify the remaining list as stale.
