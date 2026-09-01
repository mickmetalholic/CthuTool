## Why

`chc codex skills` currently accepts only the `owner/repo` shorthand even though its pinned `npx skills` backend accepts GitHub URLs, GitHub skill-tree URLs, and local directories. This prevents users from using equivalent GitHub sources and from installing skills maintained in a local directory, while GitLab and arbitrary Git sources are intentionally outside the CLI's supported scope.

## What Changes

- Accept GitHub shorthand, full GitHub repository URLs, and direct GitHub `tree/<ref>/<skill-path>` URLs in the Add flow.
- Normalize supported GitHub inputs into repository, selector, and tracking-ref metadata so existing GitHub lifecycle operations remain reproducible.
- Accept local directory paths, discover selected skills through the pinned backend, and record them as explicit local-source manifest entries.
- Resolve relative local paths from the repository root and report missing local sources as actionable managed-skill state.
- Record machine-local ownership, source fingerprints, and installed-target fingerprints for successful local installs, and refuse update or removal when that provenance is missing or the installed target no longer matches.
- Skip remote update checks for local-source entries and show the path/source kind in inventory and reviewed plans.
- Reject GitLab URLs and arbitrary Git URLs with a clear supported-source error before any mutation.
- Preserve the reviewed plan, default-negative confirmation, JSON read-only behavior, and partial-failure semantics for every supported source.
- Add contract, unit, integration, documentation, and manifest validation coverage for the expanded source model.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-codex-skill-management`: Expand accepted Add sources to supported GitHub URL forms and repository-relative local directories, while explicitly excluding GitLab and arbitrary Git URLs and managing local-source desired state.

## Impact

- Affected CLI command, manifest, backend adapter, inventory/planning, and execution code under `apps/cli/src/`.
- The versioned `codex/skills.manifest.json` schema gains a local-source entry variant while retaining compatibility with existing GitHub entries; Codex user state gains a machine-local local-source ownership record.
- Affected unit/integration/contract tests and CLI documentation.
- No new runtime dependency; the existing pinned `skills@1.5.19` subprocess contract remains the installation backend.
