## Why

The promoter requires a dedicated Evolution marker that the installed Hermes creation workflow does not generate, and direct-child discovery misses categorized local Skills. Users need native creation evidence and an explicit way to review uncertain origins while keeping managed Skills excluded.

## What Changes

- Add a read-only Hermes scanner that walks category directories, identifies package boundaries, and reports exact relative paths, fingerprints, ownership, native creation evidence, and unresolved origin.
- Read Hermes's mutation ledger and usage records. Match create events to the actual Skill identity and path; treat management flags and adoption as hints.
- Present recorded local creations and source-uncertain Skills separately, defaulting both to Skip. Require explicit local-source confirmation plus selection for uncertain origins.
- Preserve hard exclusions for managed/protected/external/opted-out or unsafe packages, and recheck nested source containment, reviewed evidence, and fingerprints before copying or retirement.
- Record native evidence or user attestation in portable bridge provenance; update Skill instructions, metadata, contract tests, and affected specifications.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-skill-promoter`: Recursive Hermes discovery, native provenance classification, uncertain-origin review, and exact-package retirement.
- `apps-cli-cross-agent-skill-absorption`: Native creation evidence, explicit local-source attestation, and portable nested source identity.

## Impact

Changes are limited to the project-owned promoter, its read-only scanner and tests, and this OpenSpec change. Generated OpenSpec skills, CthuCodex business Skill content, installed Skills, and Hermes metadata remain unchanged. This work improves the promoter; it does not promote or retire any local Skill.
