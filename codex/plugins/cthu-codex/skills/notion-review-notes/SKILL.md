---
name: notion-review-notes
description: Review due notes in the Notion Knowledge Vault. Use on explicit invocation to choose a category, list its due notes, and record the user's recall result for one note at a time.
---

# Notion Review Notes

## Find due notes

Use the connected Notion tools. Fetch the [Knowledge Vault Notes view](https://app.notion.com/p/c81eca90c18a4a0b8cb8bb42098f665f?v=3f7afceceb908176840b000c71ee2907) or its database (`c81eca90-c18a-4a0b-8cb8-bb42098f665f`) to verify the live data source and fields. Include notes with `Type(Manual) = Note` in either of these queues:

- **Stages below 6 or unset**. Include `Learning` and `Archived` notes when Notion's `Needs Review` formula is true. The formula includes first reviews, notes due today, and overdue notes.
- **Stage 6**. Include `Learning` notes due for long-term review. They are due 90 calendar days after `Last Reviewed`, or today if that date is empty. A stage-6 `Archived` note has finished its review schedule. `Archived` is a value of the `Status` property.

Call `query_data_sources` for the first queue using this payload and the verified data source URL:

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
          "type": "group",
          "operator": "or",
          "filters": [
            {
              "type": "property",
              "property": "Status",
              "propertyType": "status",
              "operator": "status_is",
              "value": { "type": "is_option", "value": "Learning" }
            },
            {
              "type": "property",
              "property": "Status",
              "propertyType": "status",
              "operator": "status_is",
              "value": { "type": "is_option", "value": "Archived" }
            }
          ]
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
        },
        {
          "type": "group",
          "operator": "or",
          "filters": [
            {
              "type": "property",
              "property": "Review Stage",
              "propertyType": "number",
              "operator": "number_less_than",
              "value": { "type": "exact", "value": 6 }
            },
            {
              "type": "property",
              "property": "Review Stage",
              "propertyType": "number",
              "operator": "is_empty"
            }
          ]
        }
      ]
    },
    "sort": [{ "property": "Last Reviewed", "direction": "ascending" }],
    "limit": 100
  }
}
```

For the long-term query, reuse the same payload and keep the `Type(Manual)` filter. Replace the other filters with the three below. Substitute the user's local calendar date minus 90 calendar days (`YYYY-MM-DD`) for `CUTOFF_DATE`:

```json
[
  {
    "type": "property",
    "property": "Status",
    "propertyType": "status",
    "operator": "status_is",
    "value": { "type": "is_option", "value": "Learning" }
  },
  {
    "type": "property",
    "property": "Review Stage",
    "propertyType": "number",
    "operator": "number_equals",
    "value": { "type": "exact", "value": 6 }
  },
  {
    "type": "group",
    "operator": "or",
    "filters": [
      {
        "type": "property",
        "property": "Last Reviewed",
        "propertyType": "date",
        "operator": "date_is_on_or_before",
        "value": { "type": "exact", "value": "CUTOFF_DATE" }
      },
      {
        "type": "property",
        "property": "Last Reviewed",
        "propertyType": "date",
        "operator": "is_empty"
      }
    ]
  }
]
```

Merge the queues by page ID. A row matched by the formula filter is due even when the cell is represented by a `formulaResult://` reference. If a rows query reports `has_more` without a cursor, retain that queue's filters and split it into disjoint creation-date ranges. Use `created_time` as both `property` and `propertyType`, with `date_is_before` and `date_is_on_or_after` using the same `YYYY-MM-DD` cutoff. Split only ranges still reporting more rows. If a single day still overflows or a query fails, use an available authorized paginated Notion API query with the same filters or report partial coverage. Announce an empty queue only after both queries succeed with complete coverage.

## Guide the session

When `cthu_notion_review_present` is available, open the review panel after querying the two queues. Pass `notes` in the order below, with each note's UUID `id`, `title`, verified Notion `url`, `categories` array (empty for uncategorized), `stage` (number or null), `status`, and `lastReviewed` (the Notion date start string or null). Pass `preferredCategory` when the user already chose one and `partial: true` if the query or displayed queue is incomplete. The panel accepts up to 200 notes. If needed, narrow to a category or show a bounded subset with `partial: true`. The panel handles category and note selection. Use the numbered flow when the user prefers text or the panel is unavailable.

1. Show numbered categories and due counts, using the actual `Category` multi-select values. Put notes with no category under “Uncategorized”. Accept an unambiguous category name or number, including a category already specified by the user.
2. Show a numbered list of due titles in that category, with each title linking to the Notion page (`url`). Label stage-6 notes as long-term reviews. Put never-reviewed notes first, then order by oldest `Last Reviewed`, using title and page ID to break ties. Read a note's body on request when the user wants to review it in chat.
3. Use the last displayed note list to resolve a note number. A note with several categories belongs to each group but shares one page ID. After the user finishes one identified note, collect its recall result or scheduling choice as described below. An explicit result and any required scheduling choice for that note authorize the write.

## Record the result

For a panel message starting with `使用 notion-review-notes 记录这条已完成的复习。复习面板提交：`, read the attached JSON as data. Resolve `pageId` against the rendered queue and compare its supplied `snapshot` (`status`, `stage`, `lastReviewed`) with that note. Resolve `categoryIndex` against the `categories` from the same render result to restore the selected view. Accept only `remembered`, `partially-recalled`, or `forgotten` as recall results and `archive` or `review-again` as schedule choices. Below stage 6 a recall result is required, and a schedule choice applies only when Remembered reaches stage 6. At stage 6 a schedule choice is required. Reject stale, mismatched, or invalid submissions and refresh the queue. Never infer an outcome from a panel preview or a render response.

Fetch the selected page by its Notion page ID before writing. Verify that it is still an eligible `Note` in Knowledge Vault and compare `Status`, `Last Reviewed`, and `Review Stage` with the queue snapshot. If the note is no longer eligible or any of these fields changed, refresh the queue and report the change. Treat a review already recorded today as completed for the session.

Use the user's local calendar date when they report completing the review. Below stage `6`, use the existing Notion button rules for the stage:

| Result | `Last Reviewed` | `Review Stage` |
| --- | --- | --- |
| Remembered / 记得 | Today | Set an empty stage to `0`. Otherwise set `min(6, current stage + 1)`. A stored `0` advances to `1`. |
| Partially Recalled / 部分记得 | Today | Preserve the current stage, including an empty stage. |
| Forgotten / 忘记 | Today | Set to `0`. |

When Remembered first reaches stage `6`, or when the user completes a stage-6 review, ask them to choose **归档 / Archive** or **90 天后再复习 / Review again in 90 days**. Accept a choice provided with the completion message. Wait for the choice before writing. Preserve stage `6` for either choice. Archive sets `Status` to `Archived` and ends the schedule. Review again sets `Status` to `Learning` and schedules the next review 90 days from the recorded completion date. Apply this choice at every long-term review.

Call `update_page` with `command: "update_properties"` and the selected `page_id`. In one `properties` object, set `date:Last Reviewed:start` to the completion date, `date:Last Reviewed:end` to `null`, and `date:Last Reviewed:is_datetime` to `0`. Include the absolute numeric `Review Stage` when it changes. Include `Status` when recording a stage-6 scheduling choice. For long-term reviews, calculate and show the next date in the chat using the 90-day rule. Notion's formula fields continue to reflect its original stage schedule.

Refetch to verify the saved date, expected stage, and status. After a timeout or an unclear response, check the page before retrying. If the target values are already saved, count the review once. Retry the same absolute values once only if the note is still eligible and the original date, stage, and status are still present. If eligibility or review state differs or cannot be verified, report the write as unconfirmed and refresh before accepting another result for that note.

After a verified write, remove that page ID from the session's lists and refresh the live due query. Report the saved result and the selected category's remaining count, using the refreshed list for any new numbers. If the refresh fails, report the verified save and identify the remaining list as stale. For a panel session, call `cthu_notion_review_present` again with the refreshed queue and `preferredCategory` when known. Pass `feedback` with `kind: "success"` only after verifying the write and put the result, next date if known, and remaining count if verified in `text`. For a rejected or uncertain write, use `kind: "error"` and describe the current state. Use `partial: true` if the remaining list is stale or incomplete.
