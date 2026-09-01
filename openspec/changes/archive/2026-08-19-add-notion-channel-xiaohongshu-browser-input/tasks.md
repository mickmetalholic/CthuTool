## 1. Prerequisite and Input Contract

- [x] 1.1 Confirm the implementation target already contains the completed `improve-notion-channel-batch-add` behavior, and leave that neighboring change and its artifacts untouched.
- [x] 1.2 Update `notion-add-channel/SKILL.md` frontmatter, introduction, constants, and supported-platform language for YouTube, Bilibili, and Xiaohongshu while preserving explicit-only invocation.
- [x] 1.3 Extend the documented input model to accept at most one explicit attached/current-tab item, alone or alongside URL items, with the existing batch default and per-item replacement tag semantics.
- [x] 1.4 Preserve the no-input fast failure so an invocation with neither URLs nor an explicit tab request asks for input without accessing browser or Notion state.

## 2. Browser-Tab Acquisition and Privacy Boundary

- [x] 2.1 Add exact-tab selection instructions that prefer an attached tab, otherwise use only the explicitly requested browser surface's selected tab, permit at most one metadata-only tab listing solely to claim an exact attached ID/title/URL tuple, and never guess from that listing or silently switch browser families.
- [x] 2.2 Define the immutable tab snapshot sequence: read the URL, extract allowlisted metadata without navigation or interaction, read the URL again, and discard the item on any URL change.
- [x] 2.3 Prohibit tab navigation, refresh, clicks, typing, scrolling, submission, closure, browser-history access, cookies, storage, credentials, profiles, and unrelated DOM reads.
- [x] 2.4 Resolve all browser-unavailable, no-selected-tab, authentication, verification, unsupported-page, missing-identity, and unstable-tab failures before loading Notion, with a ready-homepage-tab or canonical-URL fallback.
- [x] 2.5 Keep URL-only invocations browser-free, read identity fields only for tab items with valid explicit tags, and limit missing-tag tab evidence to the profile description plus at most eight currently loaded recent-item titles without scrolling or opening content.

## 3. Xiaohongshu Identity and Notion Mapping

- [x] 3.1 Accept only canonical Xiaohongshu creator homepage paths at `www.xiaohongshu.com/user/profile/<userId>` and normalize them to HTTPS without query, fragment, or trailing slash.
- [x] 3.2 Resolve `Source` as `Xiaohongshu`, use the path user ID as canonical identity, require a current nickname for `Name`, and reject note, board, search, unresolved share-link, and unsupported pages.
- [x] 3.3 Extend batch and database duplicate comparisons to include normalized Xiaohongshu links and user IDs while retaining same-name clarification safeguards and per-item results.
- [x] 3.4 Require live discovery of the `Xiaohongshu` source option and exactly one template whose default source matches it; do not hard-code the observed option or template IDs or fall back to a blank page.
- [x] 3.5 Reuse the existing explicit-tag fast path, inferred-tag confirmation, full-batch preflight, multi-page creation, uncertain-result re-query, and created-page verification behavior for Xiaohongshu and tab-derived items.

## 4. Skill Metadata and User Documentation

- [x] 4.1 Regenerate or update `agents/openai.yaml` so its short description and default prompt mention Xiaohongshu plus optional explicit current-tab input while `policy.allow_implicit_invocation` remains `false`.
- [x] 4.2 Document canonical Xiaohongshu URL, `Chrome current tab`, tab-plus-URL batch, shared-tag, and per-item override examples in the Codex plugin module documentation.
- [x] 4.3 Document that browser input is optional and exact-tab-only, URL-only mode does not connect to a browser, and unavailable or blocked tab acquisition falls back to a canonical URL without reading Notion.
- [x] 4.4 Refresh the CthuCodex plugin cachebuster metadata so the revised skill can be reinstalled after merge.

## 5. Validation and Forward Testing

- [x] 5.1 Run strict OpenSpec validation and confirm the delta preserves the complete post-batch requirements while adding Xiaohongshu and explicit tab behavior.
- [x] 5.2 Run the skill-folder validator and validate skill name, directory, frontmatter, UI metadata, plugin manifest, and explicit-only policy consistency.
- [x] 5.3 Perform read-only forward tests in a fresh task for canonical Xiaohongshu URL input, an authenticated selected homepage tab, tab plus URL batch input, explicit-tag minimal reads, missing-tag bounded inference, and URL-only execution with no browser access.
- [x] 5.4 Forward-test duplicate URL/tab identity, unsupported note or board tabs, missing browser capability, no selected tab, login or verification barriers, and a simulated or observed URL change, confirming each fails before Notion access where required.
- [x] 5.5 Run `git diff --check`, review the scoped diff, and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files and neighboring OpenSpec changes remain unchanged.
- [x] 5.6 After merge, reinstall `cthu-codex@personal` and perform any explicitly authorized live Notion creation test from a Xiaohongshu URL or selected tab, recording the resulting page for review.
