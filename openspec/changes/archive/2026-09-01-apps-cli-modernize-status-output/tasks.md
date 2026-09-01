## 1. Extend local status metadata

- [x] 1.1 Add optional `commitTime` and `commitMessage` fields to the CLI installation status model and collect them with one read-only HEAD query only for local-mode Git checkouts.
- [x] 1.2 Normalize the committer time and sanitize, collapse, and bound the commit subject before exposing it through human or JSON status.
- [x] 1.3 Add domain unit coverage for available, unavailable, malformed, and remote-skipped commit metadata while preserving existing status success behavior.

## 2. Modernize human status rendering

- [x] 2.1 Add a dedicated status renderer with the decorated title, `Source` and `Installation` groups, aligned labels, semantic mode/commit/bundle colors, and explicit present/missing text.
- [x] 2.2 Make the renderer adapt to color-capable TTY and plain non-TTY output, preserve long path/URL readability, and suppress output in quiet and JSON modes.
- [x] 2.3 Delegate human `chc status` output to the renderer while retaining the existing JSON envelope, error handling, exit codes, and existing status fields.
- [x] 2.4 Add renderer unit tests for local metadata, remote output, missing bundle state, ANSI-free fallback, color output, message bounding, and quiet/JSON suppression.

## 3. Update public artifacts and documentation

- [x] 3.1 Extend CLI integration coverage to verify local JSON metadata remains optional, remote mode omits local-only fields, and the global bin shim emits the modern human summary.
- [x] 3.2 Update CLI lifecycle documentation and examples to describe grouped status output and local commit time/message semantics.
- [x] 3.3 Refresh the committed `apps/cli/dist/index.js` bundle after source verification so installer targets receive the new status behavior.

## 4. Verify the scoped change

- [x] 4.1 Run the affected CLI unit and integration tests, target-file lint/format checks, CLI TypeScript type checking, and `git diff --check`.
- [x] 4.2 Run `openspec status --change apps-cli-modernize-status-output --json` and strict OpenSpec validation for this change.
- [x] 4.3 Review the final diff and confirm generated OpenSpec adapter trees and `codex/plugins/cthu-codex` remain unchanged.
