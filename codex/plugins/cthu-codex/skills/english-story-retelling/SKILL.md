---
name: english-story-retelling
description: Turn personal experiences, notes, English drafts, or factual sources into spoken English retelling exercises for Stories I Can Tell in English. Use when the user wants a story-bank exercise draft or asks to add a new exercise to that Notion collection.
---

# English Story Retelling

Use this skill to create a practice note the user can retell aloud from Chinese prompts. The [story bank](https://app.notion.com/p/421afceceb90818f996ff55ecad9360f) defines the template. [Story 001](https://app.notion.com/p/421afceceb9081cd9923df1bc692c446) is the layout example. Apply the live template when available. Use the outline below for drafts when Notion is unavailable.

## Prepare the exercise

- Base personal stories on the user's details and preserve their perspective. For news or other factual material, read the supplied sources, verify details that matter to the story, and retain source links. Ask for a missing detail only when it would materially change the story.
- Give the exercise an English title and state the audience, speaking goal, and approximate duration. Use the sample's 2–3 minutes as a starting point and adjust to the material or the user's target.
- **Story Prompt · 中文提示** gives the situation and a short Chinese sequence of key events. Put optional storytelling cues and vocabulary hints in toggles so the learner can attempt the story first.
- **Full English Story · 完整英文故事** contains the full spoken narrative in a toggle. Give it a clear opening, natural transitions, and an ending that fits the source. Preserve the level of detail needed to tell the story on its own.
- **Useful Expressions · 地道表达** gives 6–10 reusable expressions with meanings or cues for when to use them. Favor phrases the user can borrow in other conversations.
- **Speaking Practice · 口语复述** guides the user to retell from the Chinese prompts, compare with the English, and try again from memory. Add a self-check for the story's key points.
- **Review Notes · 复习记录** leaves space for expressions to revisit, forgotten details, and the user's improved retelling. Use the story bank's suggested intervals and the existing Knowledge Vault review controls.

Return a draft in chat when the user asks for a draft or supplies material without asking to save it. An explicit request to add or save the exercise authorizes creating its entry and updating the collection index.

## Save to Notion

1. Fetch the story bank, its Knowledge Vault data source, and the layout example with the connected Notion tools. Verify the live template and field options. The story bank is itself a Knowledge Vault record. The exercise is a second record in the same data source, linked through the `Parent` relation.
2. Check `Story Index` and the story bank's `Sub-items` for an existing exercise on the same incident or personal story. Reuse an entry that already matches the request. If a matching exercise has the correct `Parent` and is missing from `Story Index`, finish indexing it. For a new entry, use one higher than the highest sequence number in the index or linked items. Match the `001 · English Title` format.
3. Create the record with `Name`, `Parent` set to the story bank page, `Type(Manual)` set to `Note`, `Category` set to `05.Language ▸ English ▸ English Speaking`, and `Status` set to `Learning`, following the observed example and live schema. Set the writable source URL field when there is a primary source. Leave review dates, stages, and formulas to the existing review workflow. Use Notion-flavored Markdown for the body, including `<toggle heading="h3">` for the folded sections and a link back to the collection.
4. Once the page and its `Parent` are verified, refetch the story bank. Insert one page mention with a short topic summary and speaking time at the end of `Story Index` using a scoped content update. Match the current section and preserve adjacent content. If the index changed, recompute the insertion from the latest page. If the number is now taken by a different story, use the next free number and align the new entry's title before indexing it.
5. Read back the entry and index. Verify the title, parent relation, required sections and toggles, and exactly one index mention of the new page. If a write has an unclear result, read the affected page and relations before retrying. If only the index failed, report the saved entry link and which part remains pending. If Notion is unavailable, return the draft in chat and state that saving is pending.
