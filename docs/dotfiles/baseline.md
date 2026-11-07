# Migration baseline

Verified against GitHub remote main on 2026-10-22; stale local checkouts were not used.

| Repository | Commit | Migration inputs |
| --- | --- | --- |
| mickmetalholic/dotfiles | 8e59d3283eba2d99b8abcc327e694b23a2d4cc8e | data, home, strict model, plan/health/setup behaviors |
| mickmetalholic/dotfiles-bootstrap | 44d274e592f1c640ab523f958e68453f0bb121de | Git/OpenSSH discovery, key registration and SSH checkout sequence; Go handoff replaced |

15 upstream text fixtures (five hosts × inventory, doctor, setup-dryrun) and three critical Go test references live under apps/cli/tests/fixtures/dotfiles. They are reference data, never compiled or required on target machines. Git email is replaced with user@example.invalid. No secrets or personal identity defaults are shipped. Home assets move to dotfiles/home and dotfiles/data. Old generated skills, Go binaries, releases and repository history are not copied. Whole-file Git identity management is removed; existing .gitconfig remains untouched.

Notion runtime and export share model version 1. The legacy exporter omitted health, owner, handler, release and service metadata. Initial manifest deliberately has alignmentReviewed=false: publication is blocked until a separate reviewed Notion migration reconciles the existing page identities and all five expanded host plans.
