# Package and upload the web edition

Refresh [the official package contract](https://developers.openai.com/plugins/build/plugins)
and discover the available Plugin Creator tools before exporting. If available,
read the Plugin Creator skill's package/archive requirements for the chosen flow.
Use a skills-only package unless selected workflows require an existing verified
remote tool connection. Hosting a new backend is a separate implementation task.

## Portable package

Use one plugin root with a new lowercase kebab-case name matching `plugin.json`:

```text
cthu-chat/
  plugin.json
  skills/<selected-skill>/SKILL.md
  skills/<selected-skill>/references/...
  assets/...                       # Only referenced assets
  .app.json                        # Only verified account app bindings
  mcp.json                         # Only verified remote MCP dependencies
```

A minimal skills-only manifest:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "cthu-chat",
  "version": "0.1.0",
  "description": "Selected CthuTool workflows adapted for ChatGPT Chat.",
  "extensions": {
    "com.openai": {
      "interface": {
        "displayName": "Cthu Chat",
        "shortDescription": "Personal Chat workflows"
      }
    }
  }
}
```

Use a strict semantic version. Put OpenAI presentation and app mapping settings
under `extensions.com.openai`; do not copy the legacy manifest's top-level
`skills`, `interface`, or `mcpServers` into this format. Keep any supplied listing
subtitle within 30 characters. Include only real metadata and referenced assets.
Preserve the original author attribution when supplied; do not invent a license.

If account app bindings are needed, use verified IDs in root `.app.json` and
declare `extensions.com.openai.apps: "./.app.json"`. Obtain the ID from supported
discovery; a tool namespace or plugin ID is not an app ID. If using MCP instead,
use portable root `mcp.json` with its declared schema, real remote transport and
endpoint, and supported authentication configuration. Do not package credentials.
Local `.mcp.json`, command hooks, stdio servers, or localhost URLs are not web
replacements. Avoid legacy overlays in a new web-only package.

Parse all metadata, check resource paths/assets, preserve explicit-only skill
policy, and review the final file set. The packaging helper checks a portable
root manifest and excludes common local artifacts; it is not a complete plugin
schema validator. Keep the ZIP and export report outside the plugin directory.

## Account save

Discover the tools rather than assuming a namespace remains stable. The current
tools provide these operations:

- `create_plugin`: accepts `archive` as an **absolute local ZIP/tar.gz path**.
  The host uploads it and creates one private plugin in the active workspace,
  or a personal plugin when there is no active workspace. Do not send base64,
  file contents, a file URL, or an invented storage reference.
- `get_plugin_files` / `get_plugin_metadata`: inspect an intended existing web
  plugin, its scope, and its `current_release_id` before editing.
- `update_plugin`: use its exact backend ID and the observed release ID guard.
  Omitted files can remain in the existing release; inspect the full file list
  and explicitly remove stale skills or local-only declarations only within the
  user's selected update scope. Never rely on omission to remove dependencies.

The user's selected export-and-upload request authorizes that bounded account
save. Do not widen sharing or submit a public directory listing. Do not create
a placeholder plugin as a connectivity test. Do not automatically repeat a
creation with an uncertain outcome; preserve the archive and returned evidence,
then resolve the existing result through supported discovery.

On success, record exact plugin/release IDs, returned scope, component diagnostics,
archive hash, and `plugin_url` in the report. Report diagnostics that skipped an
expected skill or connection even if the overall call succeeded. Link to the
returned URL using the manifest display name. Provide an explicit Chat invocation
and identify any connection or runtime checks still pending.

If saving is unavailable or rejected, deliver the completed ZIP/report and the
actual blocker. Account creation is not public publication, automatic installation,
or proof that every referenced tool works. Use a browser only if the connector
cannot perform the necessary operation and the user's requested upload permits it.
