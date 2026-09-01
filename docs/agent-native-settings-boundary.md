# Native vs Web Agent settings boundary

Self-use Agent configuration splits the trust-boundary setting (native Origin) from operational settings (deployed Web `/agent`). The Web page never owns Origin. Agent access is authorized by the deployment's private-network boundary rather than a static Agent Secret.

## Ownership

| Capability | Native setup / tray | Web `/agent` |
| --- | --- | --- |
| First-run Origin configuration | Yes | No |
| Change Origin later | Yes | No (read-only status) |
| Connection verification and Agent restart after trust changes | Yes | Status only |
| Device name, Chrome path, connection toggle | Yes | Yes |
| Profile management | No | Yes |
| Browser operations / login challenges | No | Yes |
| Diagnostics and detailed runtime status | Summary | Full |

Open native settings from the tray (**Configure Agent** / **Agent Settings**) or `chc agent settings`. Open the Web console from the tray (**Open Web Console**) or the native setup **Open Web Console** action; each open issues a fresh one-time bridge session.

## Trust-boundary enforcement

The local Fetch bridge rejects Web RPC payloads that attempt to mutate Origin, environment IDs, derived Backend/Web URLs, or legacy secret-shaped fields. The error directs operators to native Agent Settings.

Allowed Web `settings.update` fields remain device name, connection toggle, and optional browser executable path.

## Unavailable Web / Backend endpoints

- If the Agent or local bridge is not ready, tray **Open Web Console** fails without launching a browser and surfaces a bridge-unavailable detail on the tray snapshot.
- Backend offline does not clear Origin; the Web console can still attach when the local bridge is up and shows backend status as offline.
- Change Origin only through native settings; a failed candidate verify keeps the last known-good configuration.
