## Context

See `proposal.md` for the motivation. Obsidian Sync excludes hidden dot
directories but synchronizes ordinary visible vault directories. Agent runtimes
expect vault-scoped Skills at `.agents/skills` and can follow directory links.
The unmerged predecessor implementation instead makes `<vault>/.agents` a Git
working tree and installs Codex Hooks that fetch, commit, and push around Skill
turns.

The existing CLI already has platform-aware local data storage, interactive and
JSON command conventions, and an Obsidian agents profile shape. The replacement
must preserve unrelated CthuCodex Hooks and must not treat generated agent
adapter files as project policy sources.

## Goals / Non-Goals

**Goals:**

- Keep the real synchronized Skill and state files in one visible directory
  owned by the Obsidian vault.
- Make `.agents` a compatibility alias inside the same vault, not a second copy
  or synchronization domain.
- Make first-time setup, adoption of an existing real `.agents` directory, and
  link repair safe and inspectable.
- Keep machine-specific paths and link metadata local to each machine.
- Reduce normal operation to Obsidian Sync with no CthuTool network or Hook work.

**Non-Goals:**

- Providing user-global Skills outside the configured vault.
- Driving, polling, or verifying Obsidian Sync's remote completion state.
- Automatically merging two non-empty agents directories.
- Adding Git history, backup, conflict resolution, or strong cross-machine
  consistency guarantees.
- Synchronizing Obsidian configuration, unrelated vault content, or local agent
  plugin registries.

## Decisions

### 1. Use one visible source and one vault-local compatibility link

The default topology is:

```text
<vault>/
├─ Agents/         real Obsidian-synchronized source
│  ├─ skills/
│  └─ state/
└─ .agents -> Agents
```

`Agents` is the default visible source name, while setup may select another
visible directory inside the same vault. `.agents` is fixed at the vault root
because agent discovery depends on that convention. The command rejects a
source outside the vault, a hidden source, and any topology in which the source
contains or equals `.agents`.

This is preferred over linking `$HOME/.agents` because the requested content is
vault-scoped and the user-level directory also contains machine-local plugin and
lock data. It is preferred over copying `Agents` into `.agents` because copies
would immediately reintroduce synchronization and conflict handling.

### 2. Treat the link as machine-local setup, never shared data

Obsidian Sync transports `Agents/`; it is not expected to transport the hidden
`.agents` link. Every machine runs setup once after connecting the vault.
Machine-local configuration stores `vaultPath` and `sourcePath`; `linkPath` is
always derived as `<vault>/.agents` to prevent drift. Configuration remains
under the existing platform-aware CthuTool data root and is written atomically.

The alternative of storing a relative link in the synced vault was rejected
because link metadata is not a portable Obsidian Sync contract and Windows
junctions resolve machine-specific local paths.

### 3. Prefer a Windows junction and a Unix directory symlink

On Windows, setup creates a directory junction for a supported local source.
This avoids requiring Developer Mode or administrator elevation for the common
case. On macOS and Linux, setup creates a directory symbolic link. After either
operation, setup resolves the link through the filesystem and compares the
canonical target with the configured source before saving a healthy result.

Setup does not fall back to copying files when link creation fails. A copy would
look successful while creating two independent trees.

### 4. Model setup as a preflighted topology transition

Before mutation, setup classifies the source and compatibility paths as absent,
real directory, correct link, incorrect link, broken link, or unsupported file.
It then prints the exact transition and requires confirmation for filesystem
changes.

The safe common transitions are:

1. Both absent: create `Agents/skills`, `Agents/state`, then create the link.
2. Source present and link absent: preserve the source and create the link.
3. Real `.agents` present and source absent or empty: rename/adopt the whole
   directory as the source, preserving hidden files such as legacy `.git`, then
   create the link.
4. Correct link present: verify it and update only local profile metadata.
5. Incorrect link present: replace only the link after explicit confirmation;
   never touch the previous target.

If both paths are real non-empty directories, setup stops. Automatic recursive
merge, duplicate detection, and conflict selection were rejected because they
would rebuild much of the complexity this change removes. Failures are reported
with the post-failure filesystem state so rerunning setup is recoverable.

### 5. Keep only setup and status as the supported command surface

The user-facing surface is:

```text
chc obsidian agents setup
chc obsidian agents status [--json]
```

The predecessor's `sync --phase before|after`, Git remote and branch options,
refresh behavior, locks, commit recovery, and remote status fields are removed.
Status is local-only and reports profile, source, link type, resolved target,
`skills/`, `state/`, and actionable health findings.

No CthuCodex Hook is needed. The existing language-coach and unrelated plugin
Hooks remain unchanged; only the unmerged Obsidian Git sync adapter and its Hook
entries are removed.

### 6. Expose eventual consistency instead of simulating a strong guarantee

CthuTool cannot guarantee that Obsidian has uploaded or downloaded the latest
version before a Skill runs. Setup and status therefore describe this topology
as eventually consistent. Shared state should avoid concurrent writes to one
non-Markdown file; machine-scoped state files or append-oriented records are
recommended when concurrency is possible.

Retaining Git Hooks as an additional safety layer was rejected because running
two synchronizers over the same files creates a double-sync boundary and restores
the latency, conflict, and recovery complexity the new topology is intended to
remove.

## Risks / Trade-offs

- **[Eventual consistency]** A machine can invoke a Skill before Obsidian Sync
  downloads another machine's latest change. → State the limitation explicitly
  and rely on the user-visible Obsidian Sync status when freshness matters.
- **[Concurrent state writes]** Non-Markdown files can be overwritten according
  to the sync provider's conflict behavior. → Recommend machine-scoped or
  append-oriented state and avoid claiming transactional consistency.
- **[Platform link differences]** Junction and symlink behavior differs across
  operating systems and filesystems. → Select the platform-specific type,
  validate canonical targets, and fail without copying.
- **[Vault scope]** Skills are discovered only when the agent works in the vault
  or a qualifying descendant. → Report the scope during setup and status; do not
  silently create a user-global link.
- **[Legacy Git metadata]** Adopting an existing `.agents` Git working tree also
  preserves its hidden `.git` directory. → Preserve it for rollback and report
  it as legacy metadata; never delete it automatically.
- **[Broken links after moving a vault]** A Windows junction can retain the old
  absolute target. → Store the configured source locally and make rerunning
  setup repair the link after preview and confirmation.

## Migration Plan

1. Remove the unmerged Obsidian synchronization Hook registration and adapter,
   preserving all unrelated CthuCodex Hooks.
2. Replace Git-specific CLI options, services, status fields, and tests with the
   topology profile, setup state machine, link adapter, and local status model.
3. Upgrade an existing local profile by retaining its `vaultPath`, defaulting
   the visible source to `<vault>/Agents`, and discarding Git-only configuration
   only after the new topology succeeds.
4. If `<vault>/.agents` is a real directory and `<vault>/Agents` is absent or
   empty, preview and rename the complete directory to `Agents`; preserve any
   `.git` metadata and then create the compatibility link.
5. If both directories contain data, stop and require manual reconciliation.
6. Run setup independently on each machine after Obsidian has downloaded the
   visible `Agents` directory, then verify with status.

Rollback removes only the machine-local `.agents` link and leaves `Agents`
untouched. A user may then rename `Agents` back to `.agents` manually if they
accept losing Obsidian Sync coverage; no automated rollback deletes shared
content.
