## Context

See proposal.md for motivation. Citty resolves `--help` before script execution. The existing help appendix provider receives no invocation context, while script discovery already owns manifest metadata and installation packages copy each manifest. Deprecated Agent `env` bypasses the shared registration model and consequently leaks into help.

## Goals / Non-Goals

**Goals:** Make help sufficient for agent command selection and provide a self-contained installed-plugin workflow. Preserve execution, JSON result shapes, sample-script discovery, and compatibility errors.

**Non-Goals:** Rebuild the script parser, add a second CLI wrapper/MCP transport, remove sample scripts, change Agent distribution, install the plugin into the active Codex process, regenerate OpenSpec adapters, or modify neighboring changes.

## Decisions

1. Extend optional script manifest metadata with structured help options, notes, and examples. Give help appendix providers the normalized raw invocation, resolve the selection with the existing Citty parser, and render only discovered metadata. This supports packaged Node execution and contributors without importing script modules or hard-coding conversion behavior into the root dispatcher. Unknown targets receive bounded explanatory help; scripts without metadata retain generic help.
2. Register Agent `env` as a compatibility operation. Dispatch and its migration error remain intact, while existing visibility filters hide it consistently in help and completion.
3. Keep the new skill short with UI metadata and one conditional workflow reference. Use live `chc` help, command-specific JSON, explicit targets, and post-operation verification. Allow implicit invocation for matching CLI requests; existing user authorization remains authoritative. Preserve the plugin identity and installation/cache release mechanism.
4. Correct only relevant stale Agent documentation and the conflicting main requirement through this change's delta. The user explicitly requested a business-plugin skill, so its source is in scope; project AI-tooling policy and generated adapters stay unchanged.

## Risks / Trade-offs

- Help defaults can drift from conversion behavior -> verify the published flags/defaults and preserve existing conversion option tests.
- Help could accidentally run a script or require Poppler -> integration tests exercise help without input/dependencies and assert no output creation.
- Installed bundle could differ from source -> rebuild with the repository's pinned Bun version and run the distribution consistency check.
- A plugin guide can overreach user intent -> use scenario review for read-only status, authorized update, conversion conflicts, and interactive-only skills management.

## Migration Plan

Existing commands and JSON consumers require no migration. Install/update the plugin through its existing `chc codex install` flow and use a fresh Codex thread to discover the new skill. Revert this task's commit to restore prior behavior if necessary.
