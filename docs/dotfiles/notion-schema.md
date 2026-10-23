# Notion mapping, version 1

The read-only client uses Notion API 2026-03-11. Source IDs and API version are in `dotfiles/notion/sources.json`; credentials never belong there.

Software `Kind` remains `package` or `runtime`. `Software Kind` is separately `command`, `desktop`, `framework`, or `service`. Name is the stable software/toolset key; host ID is its own rich_text field. State is active/draft/retired. Unrelated note columns are ignored, exported model objects are strict.

| Model | Notion |
| --- | --- |
| homepage, github | Homepage URL, GitHub rich_text |
| health | Health Config rich_text: `{"version":1,"value":{"mode":"automatic","severity":"optional","checks":[{"type":"command","command":"k9s"}]}}` |
| platforms[linux/darwin/windows].install, package, guidance | Linux/Darwin/Windows Install select, Package rich_text, Guidance rich_text |
| platform.owner | Linux/Darwin/Windows Owner select: dot/system/user |
| platform.handler | Linux/Darwin/Windows Handler select, blank or supported handler |
| platform.version,release,service | Linux/Darwin/Windows Config rich_text: `{"version":1,"value":{...}}` |
| aliases[os] | Aliases Linux/Darwin/Windows rich_text, one value per line |
| runtime, guidance | Runtime, Guidance rich_text; runtime ownership is always runtime |
| toolset members | Software relation |
| host | ID, Name, OS, Purpose, Aliases, Shell, Terminal; Toolsets/Tools/Exclude relations |

Checks and Doctor are legacy compatibility columns: when populated they must agree with Health Config. Automatic health always has typed checks; manual health has guidance and no checks. Rich text fragments are concatenated before JSON parsing. Config cannot redeclare Owner, Handler, Install or Package. The same strict TS model validates local snapshots and API exports. No shell text is executed from Notion.

To construct full k9s/k3s values without dropping fields, take `health` verbatim from the published packages.yaml into Health Config's value, and copy only `version`, `release`, `service` from each platform into Config's value. In particular preserve k9s v0.51.0, each amd64/arm64 SHA256, destination; preserve k3s v1.36.3+k3s1, config_path, kubeconfig owner/group/mode and fresh_install disable/enable. The round-trip tests exercise both records. The committed YAML is authoritative until the separate reconciliation below is reviewed.

Schema editing is a separate data migration, never a side effect of auth/diff/pull. See reconciliation.md. Only after page identities, fields and five expanded host plans are reviewed should alignmentReviewed become true in the manifest through a reviewed Git change.

The imported Go baseline is generation 0: its legacy page-ID map intentionally does not yet correspond to the newer YAML. After explicit alignment review, the first successful API publication seals generation 1. Subsequent published generations validate active page-key references against the complete catalog. Each meaningful publication increments generation; API ordering alone does not. Diff includes manifest identity/digest changes as well as YAML.

The [property API](https://developers.notion.com/reference/retrieve-a-page-property) returns URL-encoded property IDs, which are preserved as returned. HTTP 429 and temporary server/overload responses, including 529, share the bounded Retry-After policy.
