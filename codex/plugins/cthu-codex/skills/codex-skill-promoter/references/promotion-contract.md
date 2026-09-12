# Codex Skill promotion contract

This reference defines eligibility, compatibility, and the single-confirmation
transaction for `$codex-skill-promoter`. Current Git state is irrelevant to
read-only discovery. A selected run later creates its own scoped branch and
OpenSpec change.

## Candidate ownership and selection

Scan direct children only; never follow symlinks. Resolve `CODEX_HOME` to
`~/.codex` and `HERMES_HOME` to `~/.hermes` unless configured otherwise.

| Codex ownership inventory | Exclude |
| --- | --- |
| Repository `codex/skills.manifest.json` | Every manifest name, enabled or disabled |
| User npx lock, normally `$HOME/.agents/.skill-lock.json` | Version 3 GitHub entries |
| Repository plugin source and installed plugin/cache | All plugin Skills |
| System and bundled roots | All installation-owned Skills |

An otherwise unowned direct Codex child with valid `SKILL.md` is locally
authored. A valid `.cthu-skill-bridge.json` marks Hermes absorption; a malformed
or conflicting marker makes the candidate ambiguous. If an ownership inventory
is unreadable, do not guess. `chc codex skills` is only for GitHub-backed
third-party Skills.

For Hermes, read `.bundled_manifest`, `.hub/lock.json`, and every available
protected built-in inventory. Exclude bundled, Hub-managed, protected,
external, organization-managed, and opted-out (`sync: false` or
`absorb: false`) trees. A candidate requires a dedicated, valid
`.hermes-evolution.json` marker like this:

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

`skillName` must match identity, `createdAt` must parse, and `sync` must not
be false. Usage, author, activity, patch counts, and directory location do
not prove Evolution origin. Missing provenance or ownership data fails closed.

Present a Markdown candidate table with name, exact source and mode,
ownership/provenance, file summary and fingerprint, Codex and Hermes
compatibility/warnings, target/collision choice, exact original-removal path,
and action. Include any Hermes replacement and Codex staging path. Default
each row to **Skip**. A **Promote** selection includes verified retirement of
the original active source and OpenSpec proposal → implementation → archive →
PR. For collisions, show existing identity and file differences and require
merge, replace, or rename in that same confirmation. No mutation occurs if
selection is empty or canceled. Ask again only if the reviewed scope changes.

## Provenance sidecar

An adapted Codex staging Skill carries `.cthu-skill-bridge.json` beside
`SKILL.md`:

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

Require non-empty identities, a `sha256:` fingerprint, and a matching target
name unless rename was selected. A missing sidecar makes no Hermes claim;
a malformed sidecar is ambiguous. The local sidecar may show the resolved
source for review. Repository source must replace `sourcePath` with
`$HERMES_HOME/skills/<sourceRelativePath>` or `hermes:<sourceName>` and retain
identity, relative path, fingerprint, and adaptation. Never commit a username,
home directory, machine name, token, or other private local path.

## Codex and Hermes compatibility

Preserve required behavior rather than identical agent files.

| Layer | Contract |
| --- | --- |
| Shared core | `SKILL.md`, references, and scripts describe capabilities and configurable paths in agent-neutral language |
| Codex adapter | `agents/openai.yaml` and `references/codex-adapter.md` describe Codex invocation/tool mappings |
| Hermes adapter | `references/hermes-adapter.md` describes Hermes invocation/tool/path mappings |

Inspect every required reference, executable dependency, input, and output.
Record each inclusion, omission, rewrite, mapping, and warning. A required
behavior without a safe shared representation or verified adapter blocks
promotion. Do not execute source scripts during inspection. Format and file
checks are necessary but do not prove actual discovery or invocation.

For Codex, verify the checkout, marketplace registration, installed cache,
required references, and explicit invocation. For Hermes, identify a supported
Skill location and verify discovery and an explicit representative invocation.
The CthuCodex cache alone is not a Hermes installation. A Hermes original
remains active until its non-conflicting replacement works alongside it. If
that cannot be established, keep the original and stop before archive and PR.

## Safe copy and retirement

Enumerate stable sorted relative POSIX paths. Allow only readable, contained
regular files/directories; reject symlinks, sockets, devices, FIFOs, traversal,
escaping targets, secrets, and inaccessible references. Fingerprint reviewed
relative paths, bytes, and relevant modes. Recompute before staging, repository
copy, and source retirement. Copy to a temporary sibling, validate, and rename
atomically where supported. Merge only non-conflicting files; replace only the
explicitly reviewed target; rename to a validated lowercase hyphenated name.

After one candidate confirmation, use an isolated task checkout from the
intended repository's default branch. Do not include the caller's unrelated
changes. Create and validate a scoped OpenSpec proposal, specs/design/tasks
before editing the plugin target. Install from that checkout with
`chc codex install`, then verify both agents as above.

Before removing any original, recheck every selected source as an unchanged,
non-symlinked direct child of its expected active Skill root with the same
file list, fingerprint, ownership, and, for Hermes, valid Evolution marker
and protected/opt-out classification. If any check fails, remove none. Remove
only confirmed original and temporary staging trees. If permanent deletion is
rejected, a reversible move to a verified path outside every active Skill
root may satisfy retirement; report its exact location and verify the old path
is absent. Otherwise preserve all originals. Verify Codex and Hermes remain
available after retirement.

Complete the change's tasks and validation, archive only that change, inspect
affected main specs, stage an exact path allowlist, review the diff, and open
one PR. Do not publish neighboring OpenSpec changes, generated adapters, or
unrelated local work. Stop on a real conflict, failed verification, or denied
operation and report reviewable state; routine stages need no second prompt.
