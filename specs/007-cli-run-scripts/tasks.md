---
description: "Task list for 007-cli-run-scripts (CLI script discovery and execution)"
---

# Tasks: CLI script discovery and execution (007-cli-run-scripts)

**Input**: Design documents from `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\007-cli-run-scripts\`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Per CthuTool Constitution, TDD is mandatory: failing tests before implementation for new logic. Use `bun test` with `--preload ./tests/setup.ts` per `apps/cli/package.json`.

**Organization**: Tasks are grouped by user story so each increment can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story label (`US1`, `US2`, `US3`) for story phases only
- Every task includes at least one concrete file path

## Path Conventions

- CLI app root: `apps/cli/`
- Source: `apps/cli/src/`
- Tests: `apps/cli/tests/unit/`, `apps/cli/tests/integration/`

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Create the bundled script packages root on disk so discovery and packages have a stable location.

- [ ] T001 Create bundled script packages root directory `apps/cli/src/scripts/` per `specs/007-cli-run-scripts/plan.md`

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Valibot schemas, pure id/catalog rules, and filesystem discovery for `script.json` / `index.ts` under `apps/cli/src/scripts/`. **No user story work should start until this phase is complete** (except writing failing tests that target these modules).

**⚠️ CRITICAL**: Complete failing tests (T002–T004) before implementing T005–T008 (TDD).

- [ ] T002 [P] Add failing unit tests for `ScriptManifest` parsing and validation rules in `apps/cli/tests/unit/script-manifest-schema.test.ts`
- [ ] T003 [P] Add failing unit tests for script id validation and normalization in `apps/cli/tests/unit/script-id.test.ts`
- [ ] T004 Add failing unit tests for scanning `apps/cli/src/scripts/`, invalid packages, and warning collection in `apps/cli/tests/unit/discover-scripts.test.ts`
- [ ] T005 Implement valibot `ScriptManifest` schema and safe parse exports in `apps/cli/src/domain/script-manifest-schema.ts`
- [ ] T006 Implement pure script id helpers (kebab-case policy per `specs/007-cli-run-scripts/data-model.md`) in `apps/cli/src/domain/script-id.ts`
- [ ] T007 Implement `ResultAsync`-based discovery (read directories, load JSON, validate manifests, skip invalid packages with actionable messages) in `apps/cli/src/infra/discover-scripts.ts`
- [ ] T008 Implement pure catalog helpers (`listSelectable`, `resolve`, deterministic duplicate-id handling per `data-model.md`) in `apps/cli/src/domain/script-catalog.ts`

**Checkpoint**: Discovery returns a catalog; invalid packages do not crash the CLI; tests pass for schema, id rules, and discovery.

---

## Phase 3: User Story 1 — Run the bundled demonstration script (Priority: P1) 🎯 MVP

**Goal**: User can run the bundled hello-world style script via the dedicated subcommand with an explicit script id, see success output, and read sufficient `--help` without reading source (`spec.md` US1).

**Independent test**: With only the demonstration package present, invoke the run-scripts flow with that script id and observe expected output; run `--help` and confirm usage describes invocation and layout (`contracts/run-scripts-command.contract.md`).

### Tests for User Story 1 (required — TDD)

> Write T009–T010 first; they must fail before T011–T015.

- [ ] T009 [P] [US1] Add failing integration test for successful execution when script id is provided explicitly in `apps/cli/tests/integration/run-scripts-explicit-id.test.ts`
- [ ] T010 [P] [US1] Add failing unit tests for load + invoke default export behavior (including sync/async) in `apps/cli/tests/unit/run-bundled-script.test.ts`

### Implementation for User Story 1

- [ ] T011 [US1] Add demonstration package `apps/cli/src/scripts/hello-world/script.json` and `apps/cli/src/scripts/hello-world/index.ts` per `specs/007-cli-run-scripts/contracts/script-package.contract.md`
- [ ] T012 [US1] Implement dynamic import path resolution (Bun + `import.meta.url`), default-export invocation, and neverthrow error mapping in `apps/cli/src/flow/run-bundled-script.ts`
- [ ] T013 [US1] Implement Citty subcommand in `apps/cli/src/command/run-scripts.command.ts` (args: explicit script id via position or option per locked contract; TTY detection stub for later; full `--help` with examples and scripts directory layout)
- [ ] T014 [US1] Register the new subcommand in `apps/cli/src/index.ts` `subCommands` without breaking existing `greet` behavior
- [ ] T015 [US1] Map `Result`/`ResultAsync` failures to stderr messages and non-zero exit codes in `apps/cli/src/command/run-scripts.command.ts` (optional `picocolors` for errors)

**Checkpoint**: P1 acceptance scenarios and FR-001, FR-003, FR-005, FR-006 for the single-script path are satisfied.

---

## Phase 4: User Story 2 — Choose among multiple scripts (Priority: P2)

**Goal**: With two or more valid packages, interactive users pick a script from a list; non-interactive users must pass an id; explicit id never shows the chooser (`spec.md` US2, `research.md`).

**Independent test**: Place two valid packages under `apps/cli/src/scripts/`, run without id on a TTY and select one; run with id and confirm no prompt; run without id when not a TTY and expect a clear error (`spec.md` Edge Cases).

### Tests for User Story 2 (required — TDD)

- [ ] T016 [P] [US2] Add failing integration test for non-TTY + missing script id (usage + non-zero exit) in `apps/cli/tests/integration/run-scripts-non-tty.test.ts`
- [ ] T017 [P] [US2] Add failing integration test for interactive selection among multiple scripts in `apps/cli/tests/integration/run-scripts-interactive.test.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Add a second valid script package directory under `apps/cli/src/scripts/` with distinct `id` and `title` per `contracts/script-package.contract.md`
- [ ] T019 [US2] Implement `@clack/prompts` `select` when script id is omitted and stdin is a TTY in `apps/cli/src/command/run-scripts.command.ts` (labels from manifest `title`, value `id`)
- [ ] T020 [US2] Ensure explicit script id via CLI args skips the interactive prompt in `apps/cli/src/command/run-scripts.command.ts`

**Checkpoint**: FR-004 and interactive vs non-interactive behavior from `contracts/run-scripts-command.contract.md` are satisfied.

---

## Phase 5: User Story 3 — Contributor-understandable layout (Priority: P3)

**Goal**: A contributor can add a new folder under `apps/cli/src/scripts/` following the documented contract and see it discovered alongside existing scripts (`spec.md` US3).

**Independent test**: Add a new package using only the folder + `script.json` + `index.ts` layout; it appears in discovery/listing without unrelated command changes.

### Tests for User Story 3 (required — TDD)

- [ ] T021 [P] [US3] Add failing test that a newly added valid package directory is included in discovery output in `apps/cli/tests/unit/contributor-script-package.test.ts`

### Implementation for User Story 3

- [ ] T022 [US3] Add an additional contributor-style sample package `apps/cli/src/scripts/contrib-sample/script.json` and `apps/cli/src/scripts/contrib-sample/index.ts` following only `contracts/script-package.contract.md`
- [ ] T023 [US3] Align `--help` text and examples in `apps/cli/src/command/run-scripts.command.ts` with `specs/007-cli-run-scripts/quickstart.md` (command name, args, paths)

**Checkpoint**: SC-004 and US3 acceptance scenario hold; contributor flow matches `quickstart.md`.

---

## Phase 6: Polish and cross-cutting concerns

**Purpose**: Documentation in code (TSDoc), manual validation, and quality gates.

- [ ] T024 [P] Add TSDoc (`@param` / `@returns`) to exported functions in `apps/cli/src/domain/script-manifest-schema.ts`, `apps/cli/src/domain/script-id.ts`, `apps/cli/src/domain/script-catalog.ts`, `apps/cli/src/infra/discover-scripts.ts`, and `apps/cli/src/flow/run-bundled-script.ts`
- [ ] T025 [P] Manually execute and tick through validation steps in `specs/007-cli-run-scripts/quickstart.md` (CLI invocation + direct `bun run` to `apps/cli/src/scripts/<id>/index.ts`)
- [ ] T026 Run `bun test --preload ./tests/setup.ts` and `bun x tsc --noEmit` from `apps/cli` per `apps/cli/package.json`; fix any regressions

---

## Dependencies and execution order

### Phase dependencies

- **Phase 1 (Setup)**: No prerequisites.
- **Phase 2 (Foundational)**: Depends on Phase 1. **Blocks all user stories.**
- **Phase 3 (US1 / P1)**: Depends on Phase 2 completion.
- **Phase 4 (US2 / P2)**: Depends on Phase 3 (or at minimum Phase 2 + demonstration package; in practice complete US1 first so explicit-id path is stable).
- **Phase 5 (US3 / P3)**: Depends on Phase 4 for multi-script listing context; may proceed after US1 if US2 scope is deferred, but spec priority is P1 → P2 → P3.
- **Phase 6 (Polish)**: Depends on completed user stories planned for the release.

### User story dependencies

- **US1 (P1)**: After Phase 2; no dependency on US2/US3.
- **US2 (P2)**: After US1 (needs end-to-end command and at least one script; second package is added in US2 tasks).
- **US3 (P3)**: After US2 recommended (multi-script listing matches contributor expectations).

### Within each phase

- For Phase 2 and story phases: failing tests before implementation where TDD tasks are listed first.
- Domain pure functions before infra/flow that depends on them.
- Command registration after command implementation.

---

## Parallel execution examples

### Phase 2 (tests first)

```bash
# After Phase 1, write failing tests in parallel:
# - apps/cli/tests/unit/script-manifest-schema.test.ts
# - apps/cli/tests/unit/script-id.test.ts
# Then implement schema + id helpers in parallel before integration-heavy discover-scripts tests pass.
```

### User Story 1

```bash
# In parallel before implementation:
# T009: apps/cli/tests/integration/run-scripts-explicit-id.test.ts
# T010: apps/cli/tests/unit/run-bundled-script.test.ts
```

### User Story 2

```bash
# In parallel before implementation:
# T016: apps/cli/tests/integration/run-scripts-non-tty.test.ts
# T017: apps/cli/tests/integration/run-scripts-interactive.test.ts
```

---

## Implementation strategy

### MVP first (User Story 1 only)

1. Complete Phase 1–2 (scripts root + discovery stack with tests).
2. Complete Phase 3 (US1): demonstration package + subcommand + help + errors.
3. Stop and validate P1 independent test and `quickstart.md` single-script path.

### Incremental delivery

1. Setup + Foundational → stable catalog and tests.
2. US1 → demonstrable `hello-world` via CLI.
3. US2 → multi-script + TTY vs non-TTY UX.
4. US3 → contributor sample package + help aligned with docs.
5. Polish → TSDoc, manual quickstart, full test/typecheck.

### Parallel team strategy

- Developer A: Phase 2 tests (T002–T004).
- Developer B: Phase 1 + scaffold empty `apps/cli/src/scripts/` and fixture dirs for tests (coordinate paths).
- After Phase 2: Developer A on US1 flow; Developer B on US1 command + index wiring; converge before merge.

---

## Notes

- Lock final subcommand name and flag names in `apps/cli/src/command/run-scripts.command.ts` and mirror them in `specs/007-cli-run-scripts/contracts/run-scripts-command.contract.md` when stable.
- Business logic must avoid raw `try`/`catch`/`throw` outside adapter boundaries; use neverthrow and valibot per constitution.
- Do not introduce Zod; validation stays in valibot.
