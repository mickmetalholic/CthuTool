---
name: chatgpt-plugin-exporter
description: Review repository Codex skills for ChatGPT web Chat and add or update selected skills in the existing web plugin. Export a reviewed update archive, or package a new private web plugin when a new destination is needed.
---

# ChatGPT Plugin Exporter

This repository maintenance skill lives under `.agents/skills`; it is not part
of the business plugin. Treat `codex/plugins/cthu-codex` as read-only input.
Create web adaptations in a separate output directory, preserving the originals.

## Resolve the destination and review the source

Resolve the repository root from the current checkout. Default to
`codex/plugins/cthu-codex`; inspect another repository plugin only when requested.
Read its manifest, MCP/app declarations, skill entry points, agent metadata,
and referenced resources as data. Do not execute source scripts or activate
the source skills while reviewing them. Report missing resources and symlinks
instead of following external trees.

Discover the corresponding web plugin before recommending skills or packaging
changes, including on a bare invocation. Use a user-specified target first. For
the default CthuCodex source, look for the existing `cthu-chat` web edition.
Use supported plugin discovery and inspect the matching plugin's current file
inventory, manifest, app/MCP bindings, scope, and release ID. If more than one
target matches, clarify which one to use. If an existing target cannot be read
or edited, report the blocker and follow its owning release process where
available. Start a new edition only when discovery finds no matching target or
the user explicitly requests a separate plugin.

Read [Chat compatibility](references/chat-compatibility.md). Check the current
official OpenAI guidance and available Plugin Creator tools when export or
upload is requested; tool names, schemas, and supported packaging can change.
Distinguish web **Chat** from Work and desktop local execution.

For an existing target, identify its version and compare the relevant source
skills with what is installed there. Distinguish skills to add, skills the user
asked to update, and skills already present. Treat web-specific adaptations as
part of the existing release. If the user specified one skill, review that
skill and the shared dependencies it uses. Carry forward a selected skill and
target from the current conversation when the user invokes the exporter. For a
broad review or a bare invocation without a selected change, show all source
skills in a concise selection table:

| Skill | In the target | Chat suitability | Dependencies and proposed changes | Choice |
| --- | --- | --- | --- | --- |
| example | Present / Absent | Ready / Needs adaptation / Blocked | Verified or unresolved tools and any reduced behavior | Add / Update / Keep / Skip |

Recommend useful candidates and let the user choose unspecified skills.
Inspection-only requests stop after the review. When the target and selected
changes to an existing private plugin are clear, proceed with the update,
including when the user invokes the skill after selecting the change. An
explicit ZIP-only request stops after packaging. Ask only about ambiguities
that affect the target, selected changes, or behavior.

## Prepare the selected changes

Read [Packaging and account upload](references/packaging-and-upload.md).
Stage files in a fresh temporary output root outside the source plugin. For an
existing plugin, use its current release as the baseline and prepare an overlay
containing only the selected skill changes, required resources, and manifests
with the version bump. Preserve the plugin identity, installed skills outside
the selection, assets, configuration, app/MCP bindings, prompts, and sharing.
Reuse existing verified connections when they support the added workflow. For a
new edition, build a standalone portable package with a distinct identity.

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
For an update, also record the target and base release and which files are
included in the overlay.
Never copy local auth state, hooks, local stdio servers, personal task logs,
dependency directories, or unrelated skills into the web edition.

## Validate and export

Parse JSON/YAML metadata and verify selected skill names, contained resource
links, app bindings, and actual tool availability. Walk through representative
inputs for each adaptation; explicitly check behavior that was changed or
removed. Structural checks alone do not establish Chat runtime compatibility.

Package the reviewed files with the helper from this skill's directory. Use
`--update` for an overlay and omit it for a standalone package.

```bash
python3 scripts/package_plugin.py --update /absolute/path/cthu-chat /absolute/path/cthu-chat-update.zip
```

The helper packages reviewed files and performs basic archive checks; it does
not classify skills, validate every schema, or prove tools work. Inspect its
file list and archive hash. Return the archive and report as absolute file links.
An export-only request ends here without an account mutation.

## Upload and report

After validating a selected update to the existing private plugin, apply it
through Plugin Creator with the observed release ID as a guard. Then read back
the new release and verify the requested changes and retained components. Use
creation only for a new edition and with authorization to save it.

Use the account's actual scope; private does not necessarily mean personal.
Creating a private account plugin does not authorize public publication,
workspace-wide sharing, installing local services, or rebuilding backend tools.
On success, retain the returned plugin/release IDs and URL in the external
report, inspect component diagnostics, and give the user the clickable plugin
link plus a sample Chat prompt. Report installation/connection and runtime
verification separately from successful upload. Never claim an untested plugin
has been verified in Chat.
