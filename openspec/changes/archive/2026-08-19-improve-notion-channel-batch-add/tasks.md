## 1. Input and Tag Resolution

- [x] 1.1 Update `notion-add-channel` to accept one or more channel URLs, a batch-level `tags:` default, and per-channel replacement overrides while preserving the existing single-channel form.
- [x] 1.2 Split minimal channel identity lookup from category content inspection so valid explicit tags skip descriptions, recent content, and second confirmation.
- [x] 1.3 Validate all supplied tags against the live Notion `Tags` options and consolidate invalid values and suggested existing options without reinterpreting them from channel content.

## 2. Batch Preflight and Duplicate Handling

- [x] 2.1 Fetch and reuse the live Channel Library data source, schema, tag options, and templates once per invocation.
- [x] 2.2 Add input-batch identity deduplication and set-based database duplicate checks while preserving same-name identity safeguards and existing-entry links.
- [x] 2.3 Inspect content only for new channels without effective tags, then consolidate inferred and ambiguous tag decisions into one confirmation step.
- [x] 2.4 Block new writes until every new item passes URL, tag, identity, and platform-template preflight, while treating resolved duplicates as non-blocking item outcomes.

## 3. Batch Creation and Reporting

- [x] 3.1 Create ready entries through the Notion connector's multi-page operation with the correct per-item platform template and no explicit page content.
- [x] 3.2 Verify every created page after asynchronous template application and re-query the database before retrying any uncertain or partially failed item.
- [x] 3.3 Report each input item as created, already present, repeated in the input, or failed, including Notion links and incomplete verification details where applicable.

## 4. Plugin Metadata and Documentation

- [x] 4.1 Update the skill description and `agents/openai.yaml` prompt for single or batch input while preserving `policy.allow_implicit_invocation: false`.
- [x] 4.2 Document canonical shared-tag and per-channel-override examples plus explicit-tag fast-path behavior in the Codex plugin module documentation.
- [x] 4.3 Refresh the CthuCodex plugin cachebuster metadata so the updated skill can be reinstalled after merge.

## 5. Verification

- [x] 5.1 Validate the OpenSpec change and confirm the delta covers single-channel compatibility, fully tagged batches, mixed tagged and untagged batches, duplicate handling, preflight blocking, and partial creation outcomes.
- [x] 5.2 Validate the modified skill and plugin metadata, including exact skill name-directory-prompt consistency and the explicit-only policy.
- [x] 5.3 Run `git diff --check`, review the scoped diff, and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged.
- [x] 5.4 After merge, reinstall `cthu-codex@personal` and exercise the documented single-channel and batch examples in a fresh Codex task.
