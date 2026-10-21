# AI Tooling Reference

OpenSpec workflow Skills are committed to this repository. A clone or worktree
can discover them without running a repository setup script or a checkout hook.

## Skill ownership

| Owner | Path | Consumers |
| --- | --- | --- |
| OpenSpec 1.13.0 | `.agents/skills/openspec-*` | Codex, Cursor, OpenCode, Pi |
| OpenSpec 1.13.0 | `.zcode/skills/openspec-*` | ZCode |
| Repository authors | `.agents/skills/codex-skill-promoter` | Codex, Cursor, OpenCode, Pi |
| Repository authors | `.agents/skills/chatgpt-plugin-exporter` | Codex and compatible local agents with Plugin Creator tools |
| Repository authors | `.cursor/skills/commit`, `.cursor/skills/create-pull-request` | Cursor |
| `npx skills` | Explicit third-party installation | Selected agents |
| `chc codex skills` | `codex/skills.manifest.json` | Codex user scope |
| Business plugin | `codex/plugins/cthu-codex` | CthuCodex plugin |

The OpenSpec snapshot contains the six core workflows: `explore`, `propose`,
`apply`, `update`, `sync`, and `archive`. The generated `openspec-*` files are
versioned so every checkout gets the same Skills. Change project policy in
`AGENTS.md` or `openspec/config.yaml`, then regenerate and review the diff.
Do not hand-edit generated Skills or copy them into other agent directories.
OpenSpec initialization must not modify `codex/plugins/cthu-codex`.

## Use and refresh

The agent host discovers Skills from the checked-out files. Install the OpenSpec
CLI to run their workflow commands:

```bash
npm install -g @fission-ai/openspec@latest
openspec --version
```

The committed snapshot was generated with OpenSpec 1.13.0. To upgrade it, set
OpenSpec's global delivery mode to `skills`, initialize the selected tool
targets, and review the resulting Git diff. If other projects need a different
delivery mode, restore that global setting afterward.

```bash
openspec config set delivery skills
openspec init --tools 'codex,agents,zcode' --profile core --force --no-animation
openspec doctor --json
openspec validate --all
git diff --check
```

`codex` and `agents` write one shared Codex-led `.agents/skills` tree. Cursor,
OpenCode, and Pi discover that tree without separate generated copies. ZCode
uses its native `.zcode/skills` tree. OpenSpec's `agents` target creates Skills,
not tool-specific `opsx-*` command adapters.

| Tool | Example invocation |
| --- | --- |
| Codex | `$openspec-propose "idea"` |
| Cursor | `/openspec-propose` |
| OpenCode | Ask the agent to load `openspec-propose` through its Skill tool |
| Pi | `/skill:openspec-propose` |
| ZCode | `$openspec-propose "idea"` |

Pi loads project Skills after the project is trusted. Reasonix also discovers
the shared `.agents/skills` tree and can use `/skill openspec-propose`; it does
not require another generated copy. Keep machine-local Reasonix settings out of
Git and do not restore the legacy `reasonix.toml`.

Git hooks remain for commit checks. `pnpm setup:git-hooks` installs them after
`pnpm install --ignore-scripts` if desired; no hook regenerates Skills.

## Other Skills

UI/UX Pro Max is not installed by default. To opt in explicitly:

```bash
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a codex -a cursor -a opencode
```

`chc codex skills` manages only user-scope, manifest-backed GitHub Skills. It
does not install or remove project OpenSpec Skills. The CthuCodex business
plugin is outside this workflow.

## Local Skill promotion

Invoke `$codex-skill-promoter` from a CthuTool checkout to review locally
authored Codex Skills and eligible Hermes Evolution Skills for promotion.
The repository owns this maintenance workflow under
`.agents/skills/codex-skill-promoter`; it is not bundled with CthuCodex and
`chc codex install` does not install it. Selected promoted Skills still
target `codex/plugins/cthu-codex/skills`.

Discovery is read-only and independent of the caller's Git state. One
confirmed candidate selection authorizes an isolated task branch, a scoped
OpenSpec change, implementation, verified Codex and Hermes replacements,
guarded original retirement, archive, and PR. If either replacement cannot
be loaded, originals remain active and the dependent stages stop.

## ChatGPT web plugin export

Invoke `$chatgpt-plugin-exporter` to review the repository's CthuCodex skills
for web Chat. It shows compatibility, dependencies, and proposed adaptations
before the user selects the workflows. Exported skills form a separate portable
plugin; the source business plugin remains unchanged.

The skill produces a ZIP and a traceable export report. When requested, it uses
Plugin Creator to save the package as a private account/workspace plugin and
returns its link. Local stdio servers, CLI authentication, browser sessions, and
filesystem persistence do not transfer to Chat. Upload success and actual Chat
runtime verification are reported separately. This maintenance skill is not
bundled with CthuCodex or installed by `chc codex install`.
