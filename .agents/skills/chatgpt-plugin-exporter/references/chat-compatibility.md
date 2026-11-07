# Assess web Chat compatibility

Assess the workflow's required behavior, including supporting references,
scripts, and metadata. Shared skill syntax does not imply shared execution tools.

| Classification | Meaning |
| --- | --- |
| Ready | The workflow uses instructions/references and tools actually available in web Chat. Small invocation or metadata edits may still be needed. |
| Needs adaptation | A concrete replacement exists, or the user can choose a useful reduced mode. Describe the replacement, inputs/outputs, and removed behavior before selection. |
| Blocked | Required local state, tools, permissions, or services have no verified web equivalent. Exporting the instructions would not deliver the requested behavior. |

Check these dependencies:

- **Instructions and resources:** Include only the selected skill's reachable,
  required resources. Preserve examples, note fields, schema hints, and domain
  rules that affect output. Resolve relative links from their containing file.
- **Apps and MCP:** Discover the target account's supported actions and verified
  app IDs or remote endpoints. Reading access does not imply write access.
  Dependencies may be satisfied by a connected app where supported; copying a
  server name from a local config does not create a web connection.
- **Local execution:** Shell commands, local Node processes, installed CLIs,
  filesystem paths, SSH identities, browser cookies, and localhost Anki access
  do not transfer through an archive. Python/data-analysis resources are usable
  only when the target Chat experience actually supports their runtime and I/O.
- **Browser and network:** Do not assume web Chat can use a desktop browser tab,
  internal network, saved login, or native app. Replace optional browser fallbacks
  with supported web tools and disclose any resulting gaps. A mandatory fallback
  without a replacement blocks the original behavior.
- **Durable state:** Chat context and downloadable files are not a mounted local
  workspace or reliable cross-session filesystem. Use a supported persistent
  service, or offer a separately selected planning-only workflow.
- **Invocation:** Replace Codex `$skill` and namespaced examples with Chat's actual
  skill/plugin selection. Preserve an explicit-only policy where present; do not
  impose it on every exported skill.
- **Source data:** Personal database IDs may be intentional dependencies of a
  private edition. Keep only those needed by selected workflows and disclose the
  account-specific nature. Never include credentials or exported auth state.

## Current repository examples

These are starting points, not permanent classifications. Re-read the source
and current target capabilities each run.

- `notion-manage`: a good candidate when the connected Notion tools support the
  requested CRUD, templates, properties, and relations. Include its required
  references; resolve optional local music/cover scripts, local download paths,
  and desktop browser fallbacks. Disclose unsupported operations.
- The three Anki creation skills: keep actual Anki writes only with a verified
  web-accessible tool. Otherwise offer an explicitly selected content/file
  generation edition preserving the field rules and HTML/cloze formatting.
  Make note-type/import requirements clear and do not report notes as created.
- `persistent-task`: the planning method is portable; its `.agent/tasks` files
  and local execution contract need an actual state store/runtime or a selected
  change in purpose.

Use current official documentation for uncertain surface support:

- [Skills and distribution](https://learn.chatgpt.com/docs/build-skills)
- [ChatGPT web plugin creation and usage](https://learn.chatgpt.com/docs/build-plugins)
- [Web MCP and local MCP differences](https://learn.chatgpt.com/docs/extend/mcp)

Do not mark a plugin web-compatible merely because a remote MCP endpoint exists;
other declarations or dependencies can still require a local executor.
