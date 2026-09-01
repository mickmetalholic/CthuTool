## Context

The existing CLI uses Citty command groups and a shared JSON/non-interactive
output contract. Repository-owned CthuCodex assets are installed through
`chc codex install`; its current Hook configuration already uses a portable
`<PLUGIN_ROOT>` command template and contains the language-coach Hook.

The Obsidian vault's `.agents` directory is a separate synchronization domain
from Obsidian notes. Its repository root must map directly to the contents of
`.agents`, including `skills/`, `state/`, and references. The absolute vault
path is machine-specific, and the current Agent runtime data directory is not a
general-purpose CLI configuration store, so this feature needs a dedicated
CthuTool `chc` data root.

## Goals / Non-Goals

**Goals:**

- Make first-time and repeated setup possible through one interactive command.
- Keep vault paths and synchronization runtime state local to each machine.
- Provide a read-only status view that is useful to both users and diagnostics.
- Pull safe remote updates before explicit managed Skill work and publish
  changed Skills or state after the Codex turn.
- Preserve local work and fail visibly on conflicts, authentication failures,
  or concurrent operations.
- Keep Git policy in one CLI implementation so the Hook is only an adapter.

**Non-Goals:**

- Synchronizing Obsidian notes, `.obsidian`, or any vault content outside
  `.agents`.
- Storing Git passwords, PATs, SSH private keys, or other credentials.
- Force-pushing, resetting, deleting, or automatically resolving divergent
  histories.
- Adding a normal workflow that asks the user to run separate commit and push
  commands.
- Replacing the existing language-coach Hook or changing Skill invocation
  policy.

## Decisions

### 1. Use a dedicated command group and a single combined sync operation

Add the following command surface:

```text
chc obsidian agents setup
chc obsidian agents status [--refresh] [--json]
chc obsidian agents sync --phase before|after
```

`setup` is the user-facing configuration entry point. It presents existing
values before allowing edits and performs a final mutation preview. `status` is
always non-interactive and read-only unless the user explicitly requests a
remote refresh. `sync` is the shared operation used by Hooks and manual
diagnostics; normal users do not need separate commit or push commands.

The command group is separate from `chc codex` because the Git repository is an
Obsidian data source, while the CthuCodex plugin only consumes the sync service.

### 2. Persist machine-specific profiles outside the shared repository

Introduce a platform-aware CthuTool `chc` data root:

- Windows: `%APPDATA%\\CthuTool\\chc`
- macOS: `~/Library/Application Support/CthuTool/chc`
- Linux and other Unix-like systems: `$XDG_STATE_HOME/cthutool/chc`, falling
  back to `~/.local/state/cthutool/chc`

Store the configuration in `obsidian-agents.json`, with a versioned profile
shape containing `defaultProfile`, `vaultPath`, and `agentsPath`. The schema
can support multiple profiles, but setup initially selects one default profile
to keep the interaction simple. Normalize and validate paths before persisting
them, and write the JSON atomically.

The Git remote remains in the `.agents/.git/config` repository metadata. This
avoids duplicating remote configuration and lets SSH or Git Credential Manager
own authentication. Local locks and optional last-operation diagnostics also
belong under the CthuTool data root, never in `.agents`.

### 3. Keep the repository boundary exact

The configured `agentsPath` is the Git working tree. The remote repository root
therefore contains `skills/`, `state/`, and other intended `.agents` content,
not a second nested `.agents/` directory. Every Git command is executed with
that path as its working directory and uses argument arrays rather than shell
command strings.

Setup supports three safe cases:

1. An existing local repository: validate its worktree, branch, and remote.
2. An empty or absent agents directory with a configured remote: clone the
   remote into the configured path.
3. Existing local files without `.git`: initialize locally, show the complete
   initial file/change summary, and require confirmation before the initial
   commit and push. If the remote already has unrelated history, stop instead
   of guessing how to merge it.

### 4. Use fast-forward-only reconciliation and one synchronization lock

Each profile has a lock under the local `chc` data root. The lock contains
enough owner and timestamp information to report a busy or stale operation and
prevents overlapping fetch, commit, and push sequences.

The before phase follows this order:

1. Acquire the profile lock and inspect the worktree.
2. If a previous operation left local changes or local commits, use the same
   combined commit-and-push routine to preserve them; if that cannot succeed,
   stop before Skill work.
3. Fetch the configured remote.
4. Fast-forward a clean local branch when the remote is ahead.
5. Stop on divergence, conflicts, authentication failure, or any unsafe state.

The after phase follows this order:

1. Acquire the profile lock and inspect only the `.agents` worktree.
2. If clean, return success without creating a commit.
3. Otherwise stage all changes under `.agents`, including `state/`, create one
   synchronization commit, and push the current branch.
4. If the push fails, retain the local commit and report that recovery is
   required; never recreate the commit or force the remote forward.

This makes a failed after phase recoverable by a later before phase while
keeping ordinary Skill work to one commit and push operation.

### 5. Make status local-first and explicitly refreshable

`status` reads the local profile and Git metadata without changing the
worktree. It reports configuration, path existence, repository validity,
branch, redacted remote identity, worktree state, cached ahead/behind data,
last known sync result, and whether the repository-owned Hook is installed.
When the user passes `--refresh`, it fetches remote metadata under the same
lock and marks the comparison as fresh. It does not merge, commit, or push.

Human output uses grouped checks; `--json` follows the existing CLI envelope
and exposes stable fields such as `configured`, `healthy`, `profile`, `paths`,
`git`, `remote`, `worktree`, `sync`, and `hook`.

### 6. Keep the Codex Hook thin and portable

Extend the existing CthuCodex `hooks/hooks.json` with:

- `UserPromptSubmit`: the adapter recognizes an explicit managed Skill request
  and invokes `chc obsidian agents sync --phase before`.
- `Stop`: the adapter invokes `chc obsidian agents sync --phase after` so the
  final commit and push complete before the turn is considered synchronized.

The adapter reads Hook JSON from stdin, uses the local CthuTool profile rather
than the Hook `cwd` as the vault source, and delegates all Git behavior to the
CLI. Its command is installed with the existing `<PLUGIN_ROOT>` normalization,
and it must preserve the language-coach Hook in the same plugin configuration.

The pre-hook does not perform a network sync for ordinary prompts. If an
explicit managed Skill request has no configuration or cannot prepare the
repository, it returns a blocking Hook result with setup or recovery guidance.
The end-of-turn Hook is safe to run after any turn: it is a no-op when `.agents`
is unchanged and publishes any detected `.agents` changes otherwise. A failed
after phase returns an explicit failure result and leaves local work intact.

`PostToolUse` is intentionally not used for network Git operations because it
would create partial commits or commit storms after individual tool calls.
`Stop` provides one synchronization boundary per turn.

### 7. Reuse existing CLI and plugin installation boundaries

The implementation adds the new command registration and domain/infra modules
under `apps/cli`, using the existing output and error abstractions. The plugin
source remains under `codex/plugins/cthu-codex`; `chc codex install` remains the
only path that materializes repository-owned plugin Hook files. Setup can check
for the installed Hook and offer to invoke the existing installation flow, but
it does not hand-edit unrelated Codex configuration.

## Risks / Trade-offs

- **[Network latency]** A before or after Hook can delay a Skill turn. → Run
  before sync only for explicit managed Skill prompts, make clean after phases
  no-ops, and report phase-specific progress.
- **[Remote conflict]** Fast-forward-only behavior can require manual recovery.
  → Preserve local commits and files, never force-push, and show exact status
  and recovery commands.
- **[Automatic scope]** Manual edits inside `.agents` may be committed by the
  after Hook. → Restrict Git operations to the configured `.agents` root and
  show the changed-file summary in status and synchronization output.
- **[Multiple Codex sessions]** Concurrent Hooks could race on one repository.
  → Use a per-profile local lock with bounded waiting and stale-lock diagnostics.
- **[Hook installation/trust]** A configured CLI profile does not guarantee that
  Codex has loaded or trusted the plugin Hook. → Report installation readiness
  separately, preserve the existing install flow, and document the required
  Codex reload/trust step.
- **[Initial bootstrap]** Existing local files and a non-empty remote may have
  incompatible histories. → Require an explicit initial preview and stop on
  unrelated remote history instead of attempting an implicit merge.

## Migration Plan

1. Install the CthuTool version containing the CLI and plugin changes.
2. On the current machine, run `chc obsidian agents setup`; initialize or adopt
   the existing `.agents` directory and confirm the initial private-repository
   push.
3. On each additional machine, run setup with the same remote. Clone into an
   empty `.agents` path or validate an existing matching repository.
4. Run `chc codex install`, review/trust the new Hook when Codex requests it,
   and start a fresh Codex session.
5. Verify with `chc obsidian agents status --refresh` before using a managed
   Skill.

Rollback disables or removes the local profile and plugin Hook registration
   while preserving the `.agents` working tree and remote history. No rollback
   step deletes Skill or state files.
