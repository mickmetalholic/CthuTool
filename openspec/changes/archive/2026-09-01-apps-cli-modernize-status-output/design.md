## Context

See `proposal.md` for motivation. The current `chc status` command collects a `CliInstallationStatus` value and renders its fields inline in the command handler. The value already contains a short commit hash when the selected source is a Git checkout, but it has no commit date or subject. JSON and quiet behavior are governed by the shared CLI context, and the repository commits `apps/cli/dist/index.js` for installations that do not have the development toolchain.

The output must tolerate long repository URLs and source paths, unavailable Git metadata, redirection to non-TTY consumers, and commit subjects controlled by the inspected checkout.

## Goals / Non-Goals

**Goals:**

- Make the default human status output scannable without hiding any existing installation fact.
- Add local-only commit time and subject with deterministic structured fields.
- Keep color, decorations, and long text safe for terminal and redirected output.
- Make the renderer independently testable from command dispatch and Git inspection.

**Non-Goals:**

- Changing how local versus remote installation mode is detected.
- Adding remote update availability checks or network access to `chc status`.
- Showing the full commit body, author identity, dirty-worktree state, or relative time.
- Changing install/update mutation behavior or exit codes.

## Decisions

### Collect local commit metadata with one optional Git query

After resolving the status mode and the existing short commit hash, local Git checkouts will use one read-only Git query for the HEAD committer date (`%cI`) and subject (`%s`). The result will be split using an unambiguous delimiter, normalized, and attached as optional `commitTime` and `commitMessage` fields. The query will not run in remote mode and failure will leave both fields absent.

Committer date is used instead of author date because status describes the exact checked-out commit object and the time at which that commit was finalized. Strict ISO 8601 retains the commit's explicit timezone and avoids locale-dependent JSON.

Alternative considered: run separate Git commands for date and subject. Rejected because both values belong to one commit and can be collected atomically with one subprocess.

### Bound and sanitize the commit subject at collection time

The subject will be collapsed to one line, stripped of terminal control characters, and truncated to 120 visible characters with an ellipsis. The bounded value will be used in both human and JSON output so every consumer receives the same safe status model.

Alternative considered: preserve the complete subject in JSON and truncate only the human rendering. Rejected because status is a concise diagnostic contract and unbounded checkout-controlled text provides little value while complicating downstream display and testing.

### Move status presentation behind a dedicated renderer

The command handler will retain JSON dispatch and error handling, while a status renderer owns human layout, semantic colors, decoration, and value formatting. The renderer will accept injectable output/TTY dependencies so tests can cover color and plain-text variants without changing process-global state.

The layout will use a short decorated title and two sections, `Source` and `Installation`. Fixed-width labels align nearby values but no enclosing box or fixed total width will be used, allowing long paths and URLs to wrap naturally.

Alternative considered: continue emitting each line directly from the command handler. Rejected because color adaptation, message bounding, and grouped rendering would make the command boundary harder to test and maintain.

### Use semantic color only as enhancement

Color will be enabled only for color-capable TTY stdout and will respect the color support detected by the existing coloring library. The title and section structure provide hierarchy; mode badges, the commit hash, and present/missing bundle markers receive distinct colors. Plain output keeps the same labels, symbols, and status words without ANSI sequences.

The proposed human shape is:

```text
◆ CthuTool  v0.0.0  ● LOCAL
│
├─ Source
│  Repository  https://github.com/mickmetalholic/CthuTool.git
│  Ref         main
│  Commit      e41acd3 · 2026-09-01 12:08:45 +08:00
│  Message     feat(agent): add unsigned self-use release and native setup
│
└─ Installation
   Directory   /path/to/CthuTool
   Bundle      ✓ present · /path/to/CthuTool/apps/cli/dist/index.js
```

Alternative considered: render a fully boxed table. Rejected because source paths and repository URLs regularly exceed conventional terminal widths and would produce brittle wrapping.

## Risks / Trade-offs

- [Unicode decoration renders poorly in an unusual terminal] → Keep all semantic information in ASCII labels and words, and cover ANSI-free redirected output independently from color.
- [A malicious local commit subject injects terminal controls] → Sanitize control characters before the subject enters the status model and bound its length.
- [Additional Git inspection slows status] → Use one local-only read-only subprocess and skip it entirely for remote mode or absent Git checkouts.
- [New JSON fields surprise strict consumers] → Add only optional fields under the existing `status` object and retain all existing keys and envelope structure.
- [Committed runtime bundle drifts from TypeScript source] → Refresh the bundle during implementation and verify the public bin shim in targeted integration coverage.

## Migration Plan

1. Extend the status domain model and local Git inspection with optional commit metadata.
2. Introduce and unit-test the adaptive human renderer, then delegate to it from `chc status`.
3. Update local/remote JSON and bin-shim integration coverage plus lifecycle documentation.
4. Refresh the committed CLI bundle and run targeted CLI validation.

Rollback restores the previous renderer and removes the optional metadata fields; no persisted data or checkout migration is required.
