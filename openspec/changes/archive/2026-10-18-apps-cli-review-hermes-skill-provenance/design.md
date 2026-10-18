## Context

See proposal.md for the discovery gap. Hermes currently writes create mutations to `skills/.curator_ledger.jsonl` with `id`, `ts`, `actor`, `action`, `skill`, and before/after path/hash snapshots. Foreground creation uses actor `agent` or `user`; background review uses `curator`. Usage `created_by: agent` can also be set by adoption, so it is not historical creation proof.

## Goals / Non-Goals

**Goals:** Reproducible read-only inventory, exact nested identity, visible evidence quality, and one explicit user decision for selected uncertain local sources.
**Non-Goals:** Modify Hermes, fabricate provenance, promote a candidate during this maintenance task, or relax exclusions for third-party/managed/unsafe content.

## Decisions

- **Read-only helper:** Add a Node scanner using the repository's existing YAML dependency. It walks Hermes category directories and stops at each package's SKILL.md; support and metadata directories stay out of candidate discovery. Codex direct-child discovery remains unchanged.
- **Three outcomes:** Report `recorded-local-creation`, `source-uncertain`, or an exclusion with reason. Native creation requires a valid event linked by declared identity and exact contained after-state SKILL.md path. Keep the event id/actor/time and current package fingerprint; flag later removal or conflicting/unlogged content. Usage and legacy marker claims are hints. Missing/malformed provenance yields review rows; unavailable ownership inventories block affected selection.
- **Actual ownership first:** Check bundled and Hub names/paths, native protected inventories, external directories, organization mirrors, and opt-outs. Source confirmation cannot override these exclusions.
- **Explicit uncertain-source choice:** Use a separate review table, default Skip, and require confirmation that the displayed exact path/fingerprint is the user's local source together with promotion selection. Record user attestation separately from native evidence.
- **Portable provenance and safe nested cleanup:** Carry full sourceRelativePath and classification/evidence or attestation in bridge records. Redact machine-specific source locations in repository files. Before copy/retirement, recheck exact package containment, unchanged evidence/classification and fingerprint, eligibility, and replacement availability. Preserve category parents and siblings.
- **Focused tests:** Use temporary Hermes homes for nested discovery, native create records, adoption-only/legacy uncertainty, unavailable metadata, managed/opted-out content, duplicate identities, unsafe paths/links, and read-only behavior. Inspect the real installation only through the scanner.

## Risks / Trade-offs

- [History may be missing or compacted] -> Show uncertainty for explicit user review rather than inventing records.
- [A create event refers to another package or prior incarnation] -> Match identity and exact path; flag later removal, mismatched snapshots, or conflicting history.
- [Recursive scanning reaches metadata or shared content] -> Package boundaries, pruned metadata/support directories, link rejection, and exact-package retirement.
- [User confirmation is mistaken for historical proof] -> Preserve an explicit user-confirmed classification and its scope in the bridge.
- [Source changes after preview] -> Recheck snapshots and require a fresh review when provenance or source identity materially changes.

## Migration Plan

Update promoter instructions, scanner, invocation text, tests, and the affected delta specifications together. Existing legacy markers remain inspectable as claims; native evidence or explicit source confirmation governs eligibility. No installed Skill, Hermes ledger, or user provenance file is modified.
