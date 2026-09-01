## Why

The personal Channel Library already has a `Xiaohongshu` source and matching template, but `$notion-add-channel` cannot add Xiaohongshu creators and requires pasted channel URLs. Xiaohongshu metadata is also more reliable when read from a page the user has already opened and authenticated in, so the skill needs a narrowly authorized browser-tab input without weakening its existing preflight and write safeguards.

## What Changes

- Add Xiaohongshu creator homepages at `xiaohongshu.com/user/profile/<userId>` as supported channel identities, normalized to the canonical profile URL and deduplicated by Xiaohongshu user ID.
- Let an explicitly requested or attached current browser tab supply one channel input, optionally alongside pasted URL inputs, while preserving the existing URL-only and batch forms.
- Restrict page-content access to the exact selected tab, read only the final URL and channel metadata needed by the existing workflow, and never inspect other tabs, browser history, cookies, storage, credentials, or profiles. If the browser surface requires one open-tab metadata listing to claim an exact attached tab, use it only for exact reference matching and discard unrelated metadata without guessing from it.
- Keep browser-tab acquisition read-only and non-disruptive: do not navigate, refresh, click, or mutate the page; reject unsupported pages and discard an input snapshot if its URL changes while metadata is being read.
- Preserve the explicit-tag fast path. Read only identity metadata when effective tags are valid, and inspect a bounded sample of profile description and recent content only when tags still require inference.
- Fail closed before loading or writing Notion when the requested browser surface or tab is unavailable, unauthenticated, blocked, unsupported, or cannot yield a stable channel identity; ask the user to make the tab ready or provide a canonical URL instead.
- Preserve explicit-only invocation, full-batch preflight, duplicate prevention, platform-template selection, inferred-tag confirmation, and per-item verification/reporting.
- Update skill metadata, user documentation, the existing capability specification, and plugin cachebuster metadata for the new platform and optional tab-input form.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-channel-skill`: Add Xiaohongshu creator identity handling and an explicit, privacy-bounded browser-tab input source while preserving the existing batch, tag, duplicate, template, and verification contract.

## Impact

- Follow-on dependency: implementation assumes the target branch already contains `improve-notion-channel-batch-add`; this change does not modify or sync that neighboring OpenSpec change.
- Affected plugin source: `codex/plugins/cthu-codex/skills/notion-add-channel/`, its UI metadata, and CthuCodex plugin cachebuster metadata.
- Affected documentation: `apps/docs/src/content/docs/modules/codex-plugin.md`.
- Affected specification: `openspec/specs/codex-plugins-cthu-codex-notion-channel-skill/spec.md` through this change's delta spec.
- External systems remain the Notion connector and public platform metadata, with connected browser control used only when the user explicitly requests tab input. Browser control is optional rather than a hard plugin or MCP dependency; URL input remains the fallback.
- The live Notion database already supplies the `Xiaohongshu` source option and matching template, so this change adds no database field, tag option, template, runtime service, or MCP server.
