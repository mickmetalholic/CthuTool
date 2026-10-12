# Game relations

Schema hints checked 2026-10-09. Fetch the relevant live source before resolving
relations; this reference does not authorize creating or editing related records.
Reuse existing matches and preserve unrelated relation memberships.

| Data source | ID | Relevant fields |
| --- | --- | --- |
| Video Game Access | `0bec1aa0-afc2-4d61-aeff-538418ede824` | `Name`; `Device` → Video Gaming Device; `Emulator` → Video Gaming Emulator; `Video Games` → game library; `Total` rollup |
| Video Gaming Device | `1edd1605-c3c4-40d8-88ee-59f751dc120f` | `Name`; `Game Access` → Video Game Access |
| Video Gaming Emulator | `4a57ea95-1fc9-458c-a92b-66ee0f3885f2` | `Name`; `URL` (connector key `userDefined:URL`); `Platforms` → Video Game Access; `Recommendation` select |
| Video Game Developer | `4c56ac5d-f00a-450e-aa01-1f47dfabaf51` | `Name`, `IGDB`; `Games` → game library; `Video Game Count` rollup |
| Video Game Series | `52b3cbea-e2ac-4a2f-b8c2-e97f6a69f9d1` | `Name`, `IGDB`; `Video Game` → game library; `Genres` and `Video Games Count` rollups |

Game `Owned On` points to Access. `Playable On` rolls up Access `Device`, and
`Emulators` rolls up Access `Emulator`. These represent the user's existing access,
not the game's full supported-platform list. Do not populate ownership from IGDB
platform metadata or edit Access/Device/Emulator relations to force rollup values.
