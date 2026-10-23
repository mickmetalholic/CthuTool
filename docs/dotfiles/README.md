# Dotfiles in chc

`chc dotfiles` has three groups and one initial onboarding command:

| Command | Purpose | Example |
| --- | --- | --- |
| init | Prepare chezmoi/mise, bind an existing published canonical host, optionally review existing files | `chc dotfiles init --source ~/Documents/GitHub/CthuTool --host darwin-macbook-pro` |
| env setup | Install the bound host's software only | `chc dotfiles env setup --dry-run`, then `chc dotfiles env setup` |
| env doctor | Check real software/service/runtime health and read Git identity | `chc dotfiles env doctor` |
| config add | Back up and review explicit local home files for import/merge, repository adoption or deferral | `chc dotfiles config add ~/.zshrc ~/.config/starship.toml` |
| config diff | Compare rendered repository templates with actual home files | `chc dotfiles config diff` |
| config apply | Preflight all conflicts, back up existing files, apply repository configuration | `chc dotfiles config apply` |
| notion auth | Hidden Token input, validation, interactive replace/clear menu | `chc dotfiles notion auth` |
| notion diff | Compare Notion API plan data with the published local YAML snapshot | `chc dotfiles notion diff --source ~/Documents/GitHub/CthuTool` |
| notion pull | Export valid Notion plan data transactionally into that checkout | `chc dotfiles notion pull --source ~/Documents/GitHub/CthuTool` |
| notion validate | Advanced/CI offline snapshot, model, digest and reference validation | `chc dotfiles notion validate --source ~/Documents/GitHub/CthuTool` |

There are no flat operation aliases, separate wizard, recovery command, connector modes, or Token arguments. Bare groups/help/completion perform no authentication or configuration changes. Shared flags: `--help`, `--json`, `--quiet`, `--no-interactive`.

## First installation

Download `scripts/bootstrap.sh` (macOS/Linux) or `scripts/bootstrap.ps1` (Windows) from this repository's GitHub Raw HTTPS endpoint and execute the saved script as your regular user. Review a downloaded bootstrap before running it. Git/OpenSSH/Node 24/npm are prepared first. SSH key reuse/registration and GitHub plus repository access are verified before an SSH clone. Host-key verification stays enabled; no HTTPS Git fallback exists.

POSIX options: `--dir <path>`, `--host <canonical-id>`, `--no-interactive`, `--configure-ssh-remote`. PowerShell: `-Directory <path>`, `-HostId <canonical-id>`, `-NoInteractive`, `-ConfigureSshRemote`. The default destination is `~/Documents/GitHub/CthuTool`. Matching existing checkouts are reused without reset/pull; an existing HTTPS origin changes only with the explicit option. No Go/pnpm/Bun/build is needed on the target machine.

Bootstrap installs the committed CLI from the chosen checkout into a user npm prefix and writes a fixed Node 24 launcher under `~/.cthutool/bin`. It calls notion auth, then init. Opening a new terminal retains the launcher PATH. Auth/init failure leaves completed installation intact and prints resume commands. Noninteractive bootstrap requires working SSH, `--host`/`-HostId` and an existing environment/cached Token; it never waits for key registration or Token input.

## Binding and existing files

Notion owns software, toolsets, host OS/shell/terminal and Tools/Exclude. Init selects a host from the local published snapshot, validates OS/WSL compatibility and persists only canonical `[data.local].host` and a fixed chezmoi sourceDir. It does not create Notion hosts or a local software plan. No match: create/review/activate the host in Notion, publish a snapshot through Git, update this checkout, then rerun init.

The five initial published IDs are windows-desktop, darwin-macbook-pro, darwin-mac-mini, linux-wsl, linux-ubuntu-server. Legacy environment/hostnames are not binding overrides. `init --host` saves a new choice; `env setup/doctor --host` and `config diff/apply --host` only select this invocation's compatible host. Config add uses the saved binding.

For an existing chezmoi source use `init --source <new-checkout> --migrate-from <exact-old-source> --host <id>`. The previous config is privately backed up; the old checkout and home remain. `chc source use` changes the executable's checkout and never silently rebinds dotfiles sourceDir.

A new repository does not absorb or delete existing home files. Use init's selected-file review or `config add <path...>`. Imports are limited to explicit regular home files; credentials, private keys and Git identity are excluded. Existing templates are merged in a private working copy, retaining cross-platform variables. Approval changes only dotfiles/home; it never edits real home, Notion YAML, or Git history. Review the resulting source diff in Git before publication. Deferral preserves the local file and blocks a conflicting apply. If source/local content changed since review, use config add again. Backups and short-lived migration receipts live under `~/.cthutool/state/dotfiles/<source-id>/`; chezmoi remains the normal applied-file state authority.

After onboarding, config apply works independently of env setup. Setup does not apply home files or install mise runtimes. Use `mise install` explicitly when needed. Existing k3s clusters are preserved for operator review; setup never resets/upgrades them implicitly or deploys workloads/GitOps.

Git user.name/email are read from Git only. The old whole-file Git template is not shipped; existing identity, include and custom settings remain. Shell templates preserve one enabled chc completion block and bootstrap PATH block. Existing SSH host configuration remains local and is preserved when rendering, including the bootstrap-selected GitHub identity and custom host mappings.

## Notion authentication and publication

Create a Notion integration Token with read access to each data source listed in sources.json and share all three sources with it. Run notion auth in a terminal; never paste a Token into chat, a command argument, Git or chezmoi. Resolution is NOTION_TOKEN environment first, then `~/.cthutool/credentials/notion.json`, then hidden input. New input is cached only after token and metadata access to all three sources verify. Environment credentials are not persisted. Cached files have 0600 permissions under a 0700 directory (current-user ACL on Windows). Failed replacement preserves the previous cache.

With an existing credential, auth offers validate/reuse, replace and local clear. Clearing does not revoke the integration or unset NOTION_TOKEN. Unset NOTION_TOKEN before replacing a lower-priority cached identity. Without a TTY or with --no-interactive/--json, auth only validates; missing credentials fail with no prompt and one JSON result when requested. Notion validate and ordinary env/config work offline with the Git snapshot.

Publication flow: edit and review active Notion rows → notion diff → notion pull → Git diff/review/commit/push → update each machine's bound checkout → explicit env setup or config diff/apply as appropriate. Notion pull does not run Git pull, update another checkout, write Notion, install packages, or apply home files. Relation order is a set; existing YAML member order is preserved. A missing/hidden page, published row changed to draft, or unexplained stable-key rename fails rather than deleting data. Explicit retired rows additionally require comma-separated `--allow-retire software:key,hosts:key` acknowledgements. Reviewed renames are recorded with page-ID continuity in manifest.identityMigrations.

First publication is intentionally gated by manifest.alignmentReviewed. Complete [the schema mapping](notion-schema.md) and [the separate first-alignment review](reconciliation.md); do not flip the gate to bypass drift. The initial Git model and the older Notion tables differed materially.

A failed publication rolls back locally. An interrupted process blocks snapshot consumers; retrying the same notion pull recovers a validated previous generation before authentication. Recovery conflicts preserve backups and journal paths for manual review. No standalone recovery command is needed. See rollback.md.
