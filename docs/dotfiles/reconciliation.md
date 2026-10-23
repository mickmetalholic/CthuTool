# First publication reconciliation

Status: pending a fresh direct API read and separate explicit Notion data migration. Existing published YAML must remain protected; `alignmentReviewed: false` blocks the first pull. Diff may report schema/identity conflicts until this is completed. No normal CLI operation writes Notion.

Use this per-record review format (retain page ID continuity):

```json
{"group":"hosts","pageId":"...","oldKey":"macbook-pro","proposedKey":"darwin-macbook-pro","missingFields":[],"dataAction":"rename after review","expandedPlan":{"added":[],"removed":[],"changed":[]},"reviewed":false}
```

Known observations came from the planning session, not a fresh API read. Re-read all sources with a locally supplied Token before editing the following operation table. Do not treat observed counts as permanent constraints.

| Existing Notion identity | Published baseline | Required action and validation |
| --- | --- | --- |
| win-desktop / 3daafcec-eb90-8152-b62d-db8b2d001069 | windows-desktop | Review explicit rename with same page ID; record identityMigrations; compare expanded Windows plan |
| macbook-pro / 3daafcec-eb90-818e-8ba1-ca9b475ee9f6 | darwin-macbook-pro | Review explicit rename with same page ID; record identityMigrations; compare expanded macOS plan |
| work-mac / 3daafcec-eb90-8139-bf41-d8b82f9026b5 | no confirmed correspondence | Keep pending draft/explicit retirement decision; never infer Mac mini |
| linux-devbox / 3daafcec-eb90-8139-b700-eeef2da7aaeb | no confirmed correspondence | Keep pending draft/explicit retirement decision; never infer WSL |
| not yet confirmed | darwin-mac-mini, linux-wsl, linux-ubuntu-server | Create missing host as draft in separate migration, review aliases/OS/shell/terminal and final tools, then activate |
| base/desktop/devops toolsets | core + focused CLI/development/operations/desktop groups | Expand each old host's plan and compare member sets before split/retirement; no name-only mapping |
| shell-zsh/fish/nushell, terminal-multiplexers | independent groups in baseline | Preserve page IDs when membership agrees; record every membership change |
| k9s Linux brew | official-release | Copy pinned version, destination, arch URLs/SHA256 and health losslessly |
| k3s | service definition | Preserve fresh-install boundaries, service/readiness and kubeconfig policies |
| remaining software and new toolsets | published catalog | Map every page/key; add missing advanced fields, explicitly retire rather than hide any previously published row |

Record each renamed page in manifest identityMigrations with group/page/from/to. A missing page, draft transition, or unreviewed rename is an error. The old manifest includes legacy identities: reconcile each, including entries absent from the latest YAML; never delete the continuity map merely to make pull pass. Reviewed retirements require `--allow-retire group:key`. Once aligned, review API fixture/candidate YAML and all five resolved plans, then commit the field/identity alignment evidence and manifest gate change. Git publication and machine application are separate explicit operations.
