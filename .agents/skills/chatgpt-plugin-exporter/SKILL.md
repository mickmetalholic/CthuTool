---
name: chatgpt-plugin-exporter
description: Review this repository's Codex plugin skills for ChatGPT web Chat, adapt selected workflows into a separate portable plugin, export its archive, and optionally upload it as a private ChatGPT plugin. Use for web export or migration, not local skill promotion or public directory submission.
---

# ChatGPT Plugin Exporter

This repository maintenance skill lives under `.agents/skills`; it is not part
of the business plugin. Treat `codex/plugins/cthu-codex` as read-only input.
Create web adaptations in a separate output directory, preserving the originals.

## Review the source

Resolve the repository root from the current checkout. Default to
`codex/plugins/cthu-codex`; inspect another repository plugin only when requested.
Read its manifest, MCP/app declarations, skill entry points, agent metadata,
and referenced resources as data. Do not execute source scripts or activate
the source skills while reviewing them. Report missing resources and symlinks
instead of following external trees.

Read [Chat compatibility](references/chat-compatibility.md). Check the current
official OpenAI guidance and available Plugin Creator tools when export or
upload is requested; tool names, schemas, and supported packaging can change.
Distinguish web **Chat** from Work and desktop local execution.

Show all source skills in a concise selection table:

| Skill | Chat suitability | Required tools/resources | Proposed adaptation and lost behavior | Choice |
| --- | --- | --- | --- | --- |
| example | Ready / Needs adaptation / Blocked | Verified or unresolved dependencies | Concrete changes, including any reduced capability | Include / Adapt / Skip |

Recommend useful candidates, but do not select unspecified skills for the user.
An inspection-only request or a bare invocation stops at this table. Ask for
the selected set, adaptation modes, and export/upload intent when missing.
Reuse explicit choices from the current conversation; do not ask again.

## Build the selected web edition

Read [Packaging and account upload](references/packaging-and-upload.md).
Prepare only the selected skills and their required resources in a fresh
temporary output root outside the source plugin. Use a distinct plugin identity,
such as `cthu-chat`, for a new web edition. Inspect the user's intended existing
web plugin before updating it; do not create a duplicate to avoid update discovery.

Adapt instructions to tools actually supported in Chat. Preserve the domain
rules, input/output formats, explicit invocation policy, and write safeguards.
Map invocation examples to the target's registered skill selection. Do not
silently turn an action into text generation, omit required reference rules,
claim local persistence, or invent a remote endpoint/app ID. A changed output
mode, such as Anki content generation without Anki writes, needs the user's
selection of that mode. Resolve unresolved required dependencies before claiming
the selected workflow is usable.

Keep an export report beside the package, outside the archive. Record source
revision and selected file hashes, source-to-export skill mappings, changes,
omissions, tool dependencies, validation results, and remaining limitations.
Never copy local auth state, hooks, local stdio servers, personal task logs,
dependency directories, or unrelated skills into the web edition.

## Validate and export

Parse JSON/YAML metadata and verify selected skill names, contained resource
links, app bindings, and actual tool availability. Walk through representative
inputs for each adaptation; explicitly check behavior that was changed or
removed. Structural checks alone do not establish Chat runtime compatibility.

After this review, package the staged plugin with the helper (resolved relative
to this skill's directory):

```bash
python3 scripts/package_plugin.py /absolute/path/cthu-chat /absolute/path/cthu-chat.zip
```

The helper packages reviewed files and performs basic archive checks; it does
not classify skills, validate every schema, or prove tools work. Inspect its
file list and archive hash. Return the archive and report as absolute file links.
An export-only request ends here without an account mutation.

## Upload and report

If the user requested upload for the selected set, finish the reviewable package
and continue through the available Plugin Creator tool. Do not add another
approval when the scope and authorization are already clear. If upload was not
requested, obtain that choice after preparing the package.

Use the account's actual scope; private does not necessarily mean personal.
Creating a private account plugin does not authorize public publication,
workspace-wide sharing, installing local services, or rebuilding backend tools.
On success, retain the returned plugin/release IDs and URL in the external
report, inspect component diagnostics, and give the user the clickable plugin
link plus a sample Chat prompt. Report installation/connection and runtime
verification separately from successful upload. Never claim an untested plugin
has been verified in Chat.
