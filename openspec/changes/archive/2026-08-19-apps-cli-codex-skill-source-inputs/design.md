## Context

The existing skills manager treats every Add input as a GitHub `owner/repo` value. The pinned `skills@1.5.19` backend already understands GitHub repository URLs, GitHub tree URLs, and local directories, but the CLI prompt, manifest validator, lifecycle source resolver, and GitHub-only update checker discard that broader source model.

The change must preserve the current reviewed-plan workflow and existing version 2 GitHub entries. GitLab URLs and arbitrary Git URLs remain rejected. Local sources are intentionally limited to directories inside the selected repository root so the manifest does not record machine-specific absolute paths.

## Goals / Non-Goals

**Goals:**

- Normalize the three supported GitHub forms into the existing reproducible repository/selector/ref model.
- Add a validated local-source manifest variant whose path is relative to the repository root.
- Route discovery, installation, validation, and removal through the pinned backend with explicit source-specific arguments.
- Keep local-source inventory and plans understandable, while avoiding false remote update signals.
- Make local update and removal safe even when the pinned backend does not expose local-source provenance, while still allowing a deliberately changed local source to be reinstalled.
- Preserve atomic manifest writes, default-negative confirmation, read-only JSON behavior, and fail-closed backend parsing.

**Non-Goals:**

- Supporting GitLab, SSH, `git://`, arbitrary HTTPS Git repositories, or other generic Git transports.
- Adopting arbitrary local skills discovered outside the manifest into desired state.
- Vendoring local skill files into the repository.
- Adding automatic remote update detection for local directories.
- Changing Codex plugin installation or unrelated `chc` commands.

## Decisions

### 1. Parse and classify the source before discovery

Add a source parser at the command/domain boundary that returns one of:

```text
GitHub shorthand       ─┐
GitHub repository URL   ├─> github { repository, optional ref, optional subpath }
GitHub tree URL         ┘

Repository-relative path ─> local { absolutePath, relativePath }

GitLab / arbitrary Git URL ─> unsupported-source error
```

The parser accepts the listed `owner/repo`, `https://github.com/<owner>/<repo>`, and `https://github.com/<owner>/<repo>/tree/<ref>/<path>` forms. GitHub tree inputs retain their parsed ref and subpath during discovery; the selected manifest entry stores the canonical `owner/repo`, skill selector, and reviewed tracking ref. This means all equivalent GitHub inputs use the same later install and update command.

The parser uses URL/path classification rather than a single permissive regular expression. It rejects credentials, path traversal, non-GitHub hosts, and unsupported Git transports before invoking `npx skills`. Rejected inputs produce an actionable list of supported forms and cannot reach a mutating plan.

Alternatives considered:

- Pass every string directly to `npx skills`. This would accept sources the manifest and update checker cannot reproduce safely.
- Store the original GitHub URL verbatim. Canonical repository metadata is already what the lock adapter and GitHub tree checker understand, and canonicalization avoids separate lifecycle implementations for equivalent URLs.

### 2. Extend manifest version 2 with a discriminated local entry

Existing GitHub entries remain unchanged:

```json
{
  "name": "web-design-guidelines",
  "source": "github",
  "repository": "vercel-labs/agent-skills",
  "selector": "web-design-guidelines",
  "tracking": { "type": "branch", "ref": "main" },
  "enabled": true
}
```

Local entries use the same current manifest version and omit remote tracking:

```json
{
  "name": "my-local-skill",
  "source": "local",
  "path": "my-local-skills",
  "selector": "my-local-skill",
  "enabled": true
}
```

The stored path is normalized to a relative POSIX path under the repository root. Absolute inputs are accepted only when they resolve inside that root, then are converted to the relative form. Paths that escape the repository root are rejected because they would make a checked-in manifest machine-specific and non-reproducible. Existing GitHub manifests do not require migration.

The validator becomes a discriminated union: GitHub entries require canonical repository and tracking metadata; local entries require a safe relative path and selector and do not accept a tracking object. Deterministic name ordering and atomic path-bounded writes remain unchanged.

Alternatives considered:

- Bump the manifest to a new version. The entry shape is being extended without invalidating existing GitHub entries, so keeping version 2 avoids an unnecessary migration while the discriminant makes the new variant explicit.
- Store an absolute local path. That would work on one machine but leak user-specific paths into repository state and fail on another checkout.

### 3. Keep backend source construction source-specific

The backend adapter will accept normalized source metadata rather than assuming every skill has `repository` and `tracking.ref` fields.

- GitHub discovery uses the original normalized GitHub locator, including a tree subpath when present, so direct tree URLs discover only the requested area.
- GitHub install, validation, and update use the canonical repository plus encoded reviewed ref and pass the selector through `--skill`.
- Local discovery, validation, and install pass the resolved absolute directory as the source and the selected name through `--skill`; no ref fragment is appended.
- Removal remains name-based and global for Codex.

The backend continues to invoke `npx --yes skills@1.5.19` with `--global --agent codex` for lifecycle mutations. All output parsing remains inside the adapter and continues to fail closed when the pinned contract is not recognized.

The global `skills` lock reliably exposes GitHub provenance but does not provide equivalent provenance for global local-directory installs. The repository manifest records desired source intent, while the machine-local ownership record proves which local installation CthuTool may mutate; a known conflicting GitHub lock entry still takes precedence as an unmanaged collision. Local entries do not participate in GitHub tree hashing or automatic `update_available` detection.

### 4. Make local-source state explicit in inventory and plans

The inventory distinguishes these local-source cases:

- `missing`: the manifest path exists, but the selected skill is not installed;
- `installed`: the source path exists and the selected skill is present;
- `source_missing`: the manifest path no longer exists, so installation cannot be offered until the source is restored;
- `source_changed`: the recorded local source still owns the installation, but its current fingerprint differs from the last successful install and a reviewed reinstall/update is available;
- `unmanaged_collision`: a known incompatible installed source owns the same skill name;
- `ownership_missing`: the local skill is present but CthuTool has no machine-local record proving that this manifest entry installed it;
- `ownership_mismatch`: the recorded source, selector, or target does not match the manifest, or the installed target fingerprint no longer matches the last successful installation.

Local entries show their repository-relative path and source kind in human and JSON output. They do not display a remote update state. A confirmed Add plan writes the local manifest entry only after installation succeeds; a missing source or failed local discovery leaves both local state and the manifest unchanged.

After a successful local install, the CLI writes an atomic machine-local provenance record adjacent to the Codex skill root, for example `~/.codex/.chc-skill-sources.json`. Each record contains the managed skill name, manifest source path, selector, target path, the source fingerprint and installed-target fingerprint captured at install time, and the install timestamp. This record is not repository desired state and is never inferred from a skill name alone.

Local Update/Reinstall and Remove are offered only when the record matches the manifest source, selector, and target, and the current installed target still matches the recorded installed-target fingerprint. A missing or mismatched record becomes `ownership_missing` or `ownership_mismatch`; the command reports a collision and performs no lifecycle mutation until the user explicitly re-adopts the source through a reviewed flow. A changed current source fingerprint is instead classified as `source_changed`: it does not erase ownership, but the plan must show the source diff/fingerprint change and refresh both fingerprints after a confirmed reinstall. This prevents a local manifest entry from deleting a same-named skill installed from another source without blocking legitimate edits to the managed local source.

For a GitHub tree URL, the parsed ref is shown as the initial tracking-ref value but the user still explicitly selects branch versus pin. For a local path, tracking prompts are skipped and the plan warns that the source is checkout-local and not remotely version-tracked.

### 5. Preserve exclusion and safety boundaries

The existing local-only adoption flow remains GitHub-only. A local directory supplied through Add becomes managed only because the user explicitly selected it and confirmed the reviewed Add plan; unrelated local directories remain unnamed and untouched. JSON mode continues to be read-only, and unsupported input rejection happens before discovery or mutation.

All child-process arguments remain passed as an argument array, never through a shell. Relative path normalization, repository containment checks, and source display redaction prevent path traversal and accidental credential exposure.

## Risks / Trade-offs

- [A local source is not portable if another checkout lacks the directory] → Store only repository-relative paths, require the source to be inside the repository, and show the limitation in the reviewed plan and documentation.
- [The pinned backend does not write global provenance for local installs] → Separate repository desired intent from a machine-local ownership record, recognize known incompatible lock metadata as a collision, and never auto-adopt unrelated local skills.
- [A same-named skill may belong to another local or GitHub source] → Persist a machine-local source record and installed-target fingerprint after successful local installation and require the target ownership proof to match before Update/Reinstall or Remove; treat a changed source fingerprint as a reviewed source update instead of a collision.
- [A local directory can change without a detectable remote update] → Do not claim `update_available`; let users remove and re-add or explicitly reinstall through the supported source path.
- [GitHub tree URL refs or subpaths may contain unusual URL encoding] → Normalize and validate the exact supported URL grammar, retain the parsed subpath only for discovery, and cover encoded and traversal cases with parser tests.
- [The pinned human discovery output may change] → Keep existing fixture-based parsing and add source-form contract fixtures; fail closed on unknown output.

## Migration Plan

1. Add source parsing and manifest-union validation while preserving all existing GitHub version 2 entries.
2. Extend backend discovery and lifecycle argument construction for canonical GitHub URLs/tree URLs and local paths.
3. Add local inventory states, plan rendering, source-specific execution, and unsupported-source errors.
4. Add unit, backend contract, CLI integration, documentation, and manifest fixture coverage for all supported and rejected inputs.
5. Refresh the committed CLI bundle and run the repository-required focused lint, typecheck, and `git diff --check` checks during implementation.

Rollback removes the local manifest variant and source parser while leaving existing GitHub entries and installed local skill directories untouched. A repository containing newly created local entries must remove those entries before using an older CLI that only understands GitHub entries.
