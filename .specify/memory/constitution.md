<!--
Sync Impact Report
- Version: (template) → 1.0.0 — Initial ratification; all placeholder principles replaced with CthuTool rules (Last Amended set to sync date).
- Principles: [PRINCIPLE_1–5 placeholders] → I–V as titled below (Extreme FP & Modular; Neverthrow; Valibot; TDD; TSDoc).
- Added sections: Architecture & Ecosystem Constraints; Development Workflow & Quality Gates (replacing generic SECTION_2/3).
- Removed: Inline template HTML comments and [TOKEN] placeholders.
- Templates: .specify/templates/plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅ | .specify/templates/commands/*.md ⚠ (directory absent; no command templates to update).
- Deferred: None.
-->

# CthuTool Constitution

## Core Principles

### I. Extreme Functional & Modular Design

All code MUST follow a rigorous functional programming paradigm. Side effects MUST be explicitly managed, and
data mutation MUST be avoided.

Files MUST adhere to the Single Responsibility Principle. While there is no hard limit on file length, modules
MUST be split the moment they handle more than one specific domain concern.

**Rationale:** Predictable, testable modules and explicit effects reduce regressions and ease review in a
monorepo.

### II. Explicit Error Handling (Neverthrow)

The `try` / `catch` / `throw` pattern is FORBIDDEN for business logic.

All operations that can fail (for example API calls, database queries, file I/O) MUST return a `Result` or
`ResultAsync` from the `neverthrow` library. Errors MUST be treated as values and explicitly handled or
composed via the type system.

**Rationale:** Typed, value-based errors make failure modes visible and avoid control flow hidden in
exceptions.

### III. Robust Validation Ecosystem (Valibot)

All data parsing, schema validation, and runtime boundary checks MUST use `valibot`. Zod MUST NOT be used
(bundle size constraint). Valibot schemas MUST be defined in a functional style and shared across the monorepo
where applicable.

**Rationale:** One validation approach keeps bundles lean and contracts consistent.

### IV. Test-Driven Development (TDD) Required

TDD is mandatory. Developers MUST write failing tests (Red) before implementing logic (Green), then refactor.

- **Frameworks:** Jest for Next.js and NestJS; native `bun test` for Bun scripts.
- **Coverage:** Comprehensive unit tests are required for all pure functions and core business logic.

**Rationale:** Red-Green-Refactor locks intent before implementation and protects refactors.

### V. Intent-Driven Documentation (TSDoc)

Code MUST be self-documenting through descriptive function and variable names.

- **Why over what:** Inline comments MUST explain only *why* an approach was chosen. Explaining *what* the
  code does is permitted only for extremely complex algorithmic logic.
- **TSDoc:** All pure functions and core business functions MUST include TSDoc with `@param` and `@returns`
  documenting inputs and outputs.

**Rationale:** Names and contracts carry day-to-day understanding; comments avoid redundant narration.

## Architecture & Ecosystem Constraints

- **Monorepo:** Turborepo.
- **Package naming:**
  - Standard packages and apps: `@cthutool/[name]`.
  - Temporary work under `scratches/`: namespace from the parent folder, e.g. `scratches/xhs-collection-organizer/web` → `@xhs-collection-organizer/web`.
- **Technology stack:**
  - Frontend and BFF: Next.js
  - Backend API: NestJS (Node)
  - Browser extensions: Plasmo
  - Scripts and tools: Bun
- **Communication:** Front-end and back-end communicate only via standard REST APIs using `fetch`.
- **UI consistency:** Front-end apps share one UI library built on Tailwind CSS and Ant Design.

## Development Workflow & Quality Gates

- **CI:** Every Pull Request MUST pass all CI checks with zero errors before merge:
  1. **Biome** — formatting and linting
  2. **TSC** — strict typecheck (`tsc --noEmit`)
  3. **Knip** — unused files, dependencies, dead code
  4. **Commitlint** — Conventional Commits
  5. **Tests** — all Jest and Bun tests pass
- **Branching:** Use Spec Kit branch conventions (e.g. auto-generated `001-feature-name` tied to specs).
- **Versioning:** Continuous delivery on `v1.0.0`; no Changesets or per-release version bump requirement.

## Governance

This Constitution supersedes other coding practices and personal preferences when they conflict.

AI coding assistants (including Copilot, Cursor, and Spec Kit) MUST prioritize these directives, especially
`neverthrow` and `valibot` over default Node.js exception and ad hoc validation patterns.

**Amendments:** Material changes MUST update this document, bump the semantic **Version** per rules below
(MAJOR: incompatible removals or redefinitions; MINOR: new or expanded principles; PATCH: clarifications
only), set **Last Amended** to the amendment date, and propagate updates to Spec Kit templates and agent
guidance as needed.

**Compliance review:** Authors and reviewers MUST verify plans, specs, and PRs against this Constitution;
violations MUST be justified in plan **Complexity Tracking** or rejected.

**Version**: 1.0.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-22
