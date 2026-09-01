## Context

This change adds one Codex-side bridge skill. The bridge reads local Hermes skill metadata and content, adapts a selected eligible Hermes skill into Codex, and leaves Hermes under its own skill-management workflow. A future Hermes-side bridge belongs in the Hermes skill source/repository and is explicitly outside this CthuTool change.

The Codex bridge is repository-managed under `codex/plugins/cthu-codex/skills`. It may inspect a local Hermes installation such as `~/.hermes/skills`, but CthuTool does not install, update, write, or delete Hermes skills. `chc codex skills` remains the only repository-promotion entry point and only publishes the adapted Codex result.

## Goals / Non-Goals

**Goals:**

- Let Codex inspect eligible local Hermes skills and absorb one selected skill into a Codex-local scope.
- Exclude Hermes bundled, Hub, external, organization-managed, and unprovenanced content.
- Make absorption a reviewed semantic adaptation with explicit confirmation.
- Preserve source files, local edits, provenance, and collision visibility.
- Keep Codex repository publication in the single `chc codex skills` command, with a distinct promotion action.

**Non-Goals:**

- Adding or deploying a Hermes bridge skill in CthuTool.
- Writing, installing, updating, deleting, or changing Hermes skill metadata.
- Two-way directory mirroring, automatic merges, background watchers, or cross-machine synchronization.
- Calling Hermes's gated remote sync service.
- Importing Hermes built-ins, Skills Hub content, external content, organization mirrors, or skills without the required evolution provenance.
- Executing scripts supplied by a source skill during inspection or absorption.

## Decisions

### 1. Codex reads Hermes provenance but does not manage Hermes

The Codex bridge will inspect the local Hermes roots read-only and apply this order:

1. Exclude names in `.bundled_manifest`, `.hub/lock.json`, protected built-in sets, external directories, or organization mirrors.
2. Require a dedicated evolution provenance marker that Hermes identifies as evidence of Evolution-created content.
3. Respect an explicit opt-out such as `sync: false` when present.
4. Require a readable `SKILL.md` and a valid skill identity.

The bridge will not infer provenance from directory location, recency, use count, patch count, successful loading, or `author`. Hermes's current `created_by: "agent"` / `agent_created: true` fields are curator-management declarations rather than historical authorship proof; they are not sufficient for strict Evolution-only eligibility unless Hermes explicitly supplies the required evolution provenance alongside them. If no dedicated marker is available, the bridge reports provenance as unavailable and offers no automatic candidate.

This conservative rule favors omitting a valid skill over importing a built-in or a manually adopted skill. The bridge does not mutate `.usage.json` to manufacture eligibility.

### 2. Keep only the Codex bridge asset in this repository

The repository contains a Codex-targeted skill such as `hermes-skill-absorber` under `codex/plugins/cthu-codex/skills`. Its instructions cover Hermes discovery, Codex adaptation, preview, confirmation, and provenance. No Hermes-targeted `SKILL.md`, Hermes deployment directory, or Hermes installer is added here. Hermes can later add its own counterpart in its own repository without changing this CthuTool change.

### 3. Absorb by adaptation, not raw copying

For a selected Hermes source, the Codex bridge inspects `SKILL.md`, frontmatter, referenced files, scripts, and path assumptions. It produces a Codex-targeted plan containing:

- the Codex target name and scope;
- transformed instruction content;
- included support files and omitted files;
- Codex tool/path/reference rewrites;
- warnings for unsupported Hermes-only behavior, secrets, absolute paths, or executable content;
- a source fingerprint for repeat absorption.

The bridge treats source content as untrusted instructions. It may read and describe scripts but never executes them as part of discovery or absorption. An unresolved safety error blocks writing.

### 4. Store provenance in the Codex target

Every confirmed absorption writes a versioned sidecar beside the Codex skill, for example `.cthu-skill-bridge.json`, containing:

- source agent (`hermes`) and target agent (`codex`);
- source skill name and normalized source path;
- source content fingerprint;
- absorption timestamp and bridge/adaptation version;
- adaptation warnings and selected resolution;
- prior target fingerprint when the operation is a re-absorption.

The sidecar distinguishes a bridge-created Codex skill from arbitrary local content and gives `chc codex skills` a safe promotion marker. It does not modify Hermes metadata or convert the skill into an `npx skills` entry.

### 5. Promote the adapted Codex skill as first-party plugin source

The explicit promotion action in `chc codex skills` scans only valid bridge-marked Codex-local skills. It validates the sidecar, source readability, skill identity, target path, and repository collision before constructing a plan. A confirmed plan writes the adapted skill and required Codex support files under `codex/plugins/cthu-codex/skills/<name>` and preserves provenance in repository-readable metadata.

Promotion does not add `codex/skills.manifest.json` entries and does not call `npx skills`; those mechanisms remain reserved for third-party GitHub/local-source lifecycle management. The existing Codex plugin installation flow remains responsible for making the repository plugin available after review or installation.

The promotion implementation must follow the repository's existing plugin skill metadata conventions, including any required `agents/openai.yaml`, cache metadata, or validation. It must not hand-edit generated `.claude/`, `.codex/`, or `.cursor/` adapters.

### 6. Make all writes explicit and collision-aware

The bridge preview and the `chc` promotion plan both default to no write. A collision offers merge, replace, or rename only after showing the relevant source, target, and provenance differences. Declining or cancelling leaves Hermes, Codex, repository, manifests, and sidecars unchanged. No action deletes the Hermes source as part of absorption.

## Risks / Trade-offs

- **Hermes does not expose a dedicated evolution marker** → fail closed and report provenance unavailable; do not treat `created_by: "agent"` alone as historical proof.
- **Valid evolved skills without a marker are omitted** → prefer safe omission and document the exact provenance contract Hermes must expose before a skill can be offered.
- **A source skill can contain secrets or unsafe instructions** → scan and warn, never execute source scripts, block unresolved safety findings, and require a reviewed preview.
- **Codex and Hermes have different tool semantics** → require Codex-targeted adaptation and present unsupported references instead of silently translating them.
- **A private absorbed skill could be promoted** → promotion is explicit, shows the full file list and destination, and never auto-promotes.
- **Repeated absorption can overwrite Codex evolution** → store source/target fingerprints and require a visible collision resolution for local Codex edits.
- **Plugin metadata can be incomplete** → validate the promoted skill against existing CthuCodex conventions and keep generated adapters out of hand-authored files.

## Migration Plan

1. Add and test the Codex bridge skill and its read-only Hermes provenance contract.
2. Add Codex-local provenance sidecar creation, repeat-absorption handling, and collision reporting.
3. Extend `chc codex skills` with read-only bridge candidates and explicit first-party promotion.
4. Add fixtures and documentation for built-in exclusion, strict evolution provenance, adaptation, cancellation, collisions, and promotion.
5. Roll out the Codex bridge without modifying existing Hermes or Codex skill directories. Users opt in by invoking the bridge and then separately confirming repository promotion.

Rollback is additive: remove or disable the Codex bridge and promotion action. Existing manifest entries, plugin skills, Hermes files, and user-local skills remain unchanged unless the user explicitly created them through the new workflow.
