# Codex skill absorption and promotion contract

Use this reference to keep source eligibility, provenance, and filesystem
operations consistent across both source modes.

## Post-discovery selection contract

Explicit invocation authorizes read-only discovery. After classification, show
every eligible candidate and collect these choices per row:

| Choice | Values | Default |
| --- | --- | --- |
| Promotion | Promote or Skip | Skip |
| Cleanup targets | Any reviewed exact local paths owned by this candidate | None; keep every local copy |

A cleanup target is valid only for a promoted candidate. A Codex-local
candidate contributes its exact direct child under $CODEX_HOME/skills. A raw
Hermes candidate contributes two independent targets: its exact eligible
direct child under $HERMES_HOME/skills and its planned adapted direct child
under $CODEX_HOME/skills. If collision handling changes a planned target path,
show the replacement path and reconfirm that target. Review and confirm the
complete promotion set and exact cleanup target set before any staging or
repository write.

## Codex candidate boundaries

The Codex candidate root is the direct directory $CODEX_HOME/skills, where
CODEX_HOME defaults to ~/.codex. Do not recursively treat every directory
under the user's home as a candidate. Do not follow symlinks.

Check these ownership sources before classifying a Codex directory:

| Source | Ownership to exclude |
| --- | --- |
| Repository codex/skills.manifest.json | Every manifest name, enabled or disabled |
| User npx lock, normally $HOME/.agents/.skill-lock.json | Version 3 entries with sourceType: "github" |
| Repository plugin source | Every skill below codex/plugins/*/skills |
| Installed plugin/cache | Every skill below $CODEX_HOME/plugins or the configured plugin cache |
| System/bundled roots | .system, bundled roots, and paths documented by the active Codex installation |

If ownership metadata cannot be read, classify the affected directory as
ambiguous. A directory with no recognized marker may be locally authored only
when it has a valid SKILL.md and no conflicting ownership evidence.

## Hermes Evolution eligibility

The Hermes candidate root is the direct directory $HERMES_HOME/skills, where
HERMES_HOME defaults to ~/.hermes. The promoter accepts a Hermes source only
when its directory contains a readable .hermes-evolution.json with this
minimum shape:

~~~json
{
  "version": 1,
  "kind": "evolution",
  "source": "hermes-evolution",
  "skillName": "example-skill",
  "createdAt": "2026-08-19T00:00:00Z",
  "sync": true
}
~~~

skillName must match the skill identity, createdAt must be a valid timestamp,
and sync must not be false. Additional fields may be retained as provenance
but must not weaken these checks.

The dedicated marker is separate from curator and usage metadata. None of the
following proves Evolution origin by itself:

- created_by: "agent" or agent_created: true in .usage.json;
- author, activity, use counts, patch counts, or recency;
- a directory name or location; or
- successful loading or presence in a local inventory.

Before discovery, exclude names from .bundled_manifest, .hub/lock.json, and
protected built-in inventories. Exclude external or organization-managed roots
and explicit sync: false or absorb: false opt-outs. Missing ownership metadata
or provenance makes a candidate ineligible. Keep Hermes read-only through
discovery, adaptation, repository promotion, installation, and verification.
Only the final cleanup phase may delete an explicitly selected source that
passes all eligibility and unchanged-source checks again.

## Codex absorption sidecar

An adapted Codex staging skill carries .cthu-skill-bridge.json beside
SKILL.md:

~~~json
{
  "version": 1,
  "kind": "hermes-absorption",
  "sourceAgent": "hermes",
  "targetAgent": "codex",
  "sourceName": "example-skill",
  "sourcePath": "/Users/example/.hermes/skills/example-skill",
  "sourceRelativePath": "example-skill",
  "sourceFingerprint": "sha256:...",
  "targetName": "example-skill",
  "targetScope": "codex-user",
  "absorbedAt": "2026-08-19T00:00:00Z",
  "adapterVersion": "1",
  "adaptation": {
    "included": ["SKILL.md", "agents/openai.yaml"],
    "omitted": [],
    "rewrites": [],
    "warnings": []
  }
}
~~~

Require non-empty identity fields, a sha256: fingerprint, and a target name
matching the candidate unless the user explicitly chooses a rename. A missing
sidecar means no Hermes claim; a present malformed sidecar makes the Codex
candidate ambiguous rather than locally authored.

The local sidecar may contain the resolved sourcePath for review. The
repository copy must retain source identity, relative path, fingerprint,
adaptation summary, and target identity while replacing sourcePath with
$HERMES_HOME/skills/<sourceRelativePath> or hermes:<sourceName>. Never commit a
username, home directory, machine name, token, or other machine-specific path.

## Shared Codex and Hermes compatibility

Treat compatibility as preservation of required behavior, not byte-identical
agent files. A promoted tree has three layers:

| Layer | Rule |
| --- | --- |
| Shared core | SKILL.md, references, and scripts use agent-neutral capability language and configurable paths |
| Codex adapter | agents/openai.yaml and references/codex-adapter.md contain Codex-only discovery or invocation details |
| Hermes adapter | references/hermes-adapter.md retains required Hermes-only mappings without overriding shared semantics |

Do not hard-code CODEX_HOME, HERMES_HOME, ~/.codex, ~/.hermes, a plugin-cache
path, or agent-specific tool identifiers in shared instructions when a portable
capability or configuration placeholder is possible. Agent metadata may remain
agent-specific when the other agent can safely ignore it.

The proposal must list shared files, adapter files, tool/invocation mappings,
path substitutions, preserved behavior, and omissions. Block promotion when a
required behavior has no safe shared representation or explicit adapter, when
one adapter silently changes shared meaning, or when compatibility depends on
executing source content during inspection.

## Adaptation and safe-tree rules

Adapt only referenced files needed by the Codex result. Map Hermes tools,
invocation syntax, paths, and agent assumptions only when the mapping is
verified. Record included files, omissions, rewrites, and warnings in the
sidecar. Unavailable references, secret-like material, unexplained executable
behavior, and unmapped required dependencies are blocking.

For both source modes, enumerate a stable sorted list of relative POSIX paths.
Allow only readable regular files and directories contained by the source
root. Reject symlinks, sockets, devices, FIFOs, absolute target paths, path
traversal, and entries that escape the root. Treat scripts as reviewable files,
not executable authority.

The fingerprint covers every reviewed relative path, file byte, and relevant
mode bit. Recompute it immediately before adaptation write, repository copy,
and optional local deletion from either candidate root.

Write a Codex adaptation or repository target into a temporary sibling,
validate it, and rename it into place atomically. For merge, add only
non-conflicting paths and stop on a conflicting file. For replace, show and
confirm the existing tree. For rename, validate the new lowercase hyphenated
name and preview the target again.

## Checkout and cleanup invariants

The user prepares and selects the checkout and feature branch. Capture the
repository root, branch, HEAD, upstream default branch, and clean status before
skill discovery, and recheck them immediately before writing. Refuse a dirty,
detached, default-branch, wrong, or changed checkout. Never create, switch, or
remove a branch or worktree.

Run chc codex install only after the reviewed source exists in the selected
checkout. Verify exact promoted files in the checkout and installed cache
before offering cleanup. Cleanup requires a separate confirmation that lists
every exact selected path, warns that deletion is not restored automatically,
and defaults to No. Never let confirmation for one path authorize a second
path, and never infer both targets for a Hermes candidate from one cleanup
choice.

Before deleting any target, validate all selected targets again:

- every target belongs to a candidate in the confirmed promotion set and is
  one of that candidate's reviewed exact cleanup paths;
- a Codex target is an unchanged, non-symlinked direct child of
  $CODEX_HOME/skills with the reviewed fingerprint; and
- a Hermes target is an unchanged, non-symlinked direct child of
  $HERMES_HOME/skills, retains the same valid .hermes-evolution.json marker and
  identity, remains absent from bundled, Hub-managed, protected, external, and
  organization-managed inventories, has no sync: false or absorb: false
  opt-out, and matches the reviewed fingerprint.

If any target fails validation, delete none and require a new cleanup review.
After all checks and final confirmation, remove only the selected exact trees.
Do not edit, merge, update, install into, mirror, or broadly clean Hermes.
Failed install, failed verification, changed fingerprint, changed marker,
ambiguous path, or cancellation always retains every local source.
