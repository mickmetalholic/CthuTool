# Tasks: CLI Welcome Greeting Demo

**Input**: Design documents from `/specs/005-cli-greeting-demo/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Per CthuTool Constitution, TDD is mandatory. Write failing tests before implementation for each user story and core pure functions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All task descriptions include exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize CLI app workspace and baseline toolchain.

- [x] T001 Create CLI app scaffold and workspace metadata in `apps/cli/package.json`
- [x] T002 Add Bun TypeScript project configuration in `apps/cli/tsconfig.json`
- [x] T003 [P] Add CLI start/build/test scripts in `apps/cli/package.json`
- [x] T004 [P] Create feature-aligned directory skeleton in `apps/cli/src/.gitkeep`
- [x] T005 [P] Add Bun test bootstrap file in `apps/cli/tests/setup.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared primitives and flow contracts required by all stories.

**⚠️ CRITICAL**: No user story work can start until this phase is complete.

- [x] T006 Implement run state type and transitions in `apps/cli/src/domain/run-state.ts`
- [x] T007 [P] Implement greeting message pure function in `apps/cli/src/domain/greeting-message.ts`
- [x] T008 [P] Implement name normalization and valibot schema in `apps/cli/src/domain/name-schema.ts`
- [x] T009 Implement welcome panel renderer with color fallback in `apps/cli/src/ui/welcome-panel.ts`
- [x] T010 Implement typed flow result model with neverthrow in `apps/cli/src/domain/flow-result.ts`
- [x] T011 Implement CLI entry-point exit code mapping in `apps/cli/src/index.ts`

**Checkpoint**: Foundation ready - user stories can now be implemented.

---

## Phase 3: User Story 1 - Complete Guided Greeting Flow (Priority: P1) 🎯 MVP

**Goal**: Deliver full happy-path flow from welcome panel to final personalized greeting.

**Independent Test**: Start CLI, input a valid name, and verify sequence `panel -> prompt -> clear/loading(2s) -> final panel + greeting`.

### Tests for User Story 1 (required — TDD) ⚠️

> **NOTE**: Write tests first, confirm they fail before implementation.

- [x] T012 [P] [US1] Add unit test for greeting message formatting in `apps/cli/tests/unit/greeting-message.test.ts`
- [x] T013 [P] [US1] Add unit test for run state transition order in `apps/cli/tests/unit/run-state.test.ts`
- [x] T014 [US1] Add integration test for happy-path sequence in `apps/cli/tests/integration/greeting-happy-path.test.ts`

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement interactive name prompt adapter in `apps/cli/src/infra/prompt-name.ts`
- [x] T016 [P] [US1] Implement 2-second loading renderer with spinner in `apps/cli/src/infra/loading-screen.tsx`
- [x] T017 [P] [US1] Implement final result Ink app component in `apps/cli/src/ui/app.tsx`
- [x] T018 [US1] Implement greeting command route in `apps/cli/src/command/greet.command.ts`
- [x] T019 [US1] Implement end-to-end orchestration flow in `apps/cli/src/flow/run-greeting-flow.ts`
- [x] T020 [US1] Wire command startup to entrypoint in `apps/cli/src/index.ts`

**Checkpoint**: User Story 1 works independently and meets MVP demo expectations.

---

## Phase 4: User Story 2 - Recover From Empty Input (Priority: P2)

**Goal**: Ensure empty/whitespace input shows feedback and allows retry without restart.

**Independent Test**: Submit empty input first, verify validation feedback and reprompt, then submit valid name and complete flow.

### Tests for User Story 2 (required — TDD) ⚠️

- [x] T021 [P] [US2] Add unit test for empty/whitespace name validation in `apps/cli/tests/unit/name-schema.test.ts`
- [x] T022 [US2] Add integration test for reprompt on invalid input in `apps/cli/tests/integration/empty-input-retry.test.ts`

### Implementation for User Story 2

- [x] T023 [US2] Add retry loop and validation feedback in `apps/cli/src/infra/prompt-name.ts`
- [x] T024 [US2] Compose prompt retry result handling in `apps/cli/src/flow/run-greeting-flow.ts`
- [x] T025 [US2] Add trim normalization before greeting render in `apps/cli/src/domain/name-schema.ts`

**Checkpoint**: User Story 2 independently handles invalid input and recovery.

---

## Phase 5: User Story 3 - Stable Visual Presentation (Priority: P3)

**Goal**: Keep welcome panel visible together with final greeting for polished end-state.

**Independent Test**: Run flow with valid input and verify final render includes both panel and `Hello, <name>`.

### Tests for User Story 3 (required — TDD) ⚠️

- [x] T026 [US3] Add integration test for final panel persistence in `apps/cli/tests/integration/final-panel-persistence.test.ts`

### Implementation for User Story 3

- [x] T027 [US3] Preserve welcome panel model through loading/result in `apps/cli/src/flow/run-greeting-flow.ts`
- [x] T028 [US3] Render panel and success message together in final UI in `apps/cli/src/ui/app.tsx`
- [x] T029 [US3] Add low-color fallback assertions in panel renderer in `apps/cli/src/ui/welcome-panel.ts`

**Checkpoint**: User Story 3 independently satisfies final visual continuity.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, documentation, and end-to-end quality verification.

- [x] T030 [P] Add interrupted-loading behavior test (no success message) in `apps/cli/tests/integration/loading-interrupt.test.ts`
- [x] T031 Add Ctrl+C cancellation handling in flow orchestrator in `apps/cli/src/flow/run-greeting-flow.ts`
- [x] T032 [P] Add long-input readability test case in `apps/cli/tests/integration/long-name-readability.test.ts`
- [x] T033 Update CLI usage and known issues docs in `specs/005-cli-greeting-demo/quickstart.md`
- [x] T034 Run full quality gate commands and record results in `specs/005-cli-greeting-demo/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3-5 (User Stories)**: Depend on Phase 2 completion.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on other stories.
- **US2 (P2)**: Starts after Phase 2; builds on prompt/validation boundary, remains independently testable.
- **US3 (P3)**: Starts after Phase 2; can proceed independently but integrates final rendering path from US1.

### Within Each User Story

- Tests first and failing before implementation.
- Domain and adapters before orchestration wiring.
- Orchestration before final integration assertions.

### Parallel Opportunities

- Setup tasks `T003`, `T004`, `T005` can run in parallel.
- Foundational tasks `T007` and `T008` can run in parallel.
- US1 implementation tasks `T015`, `T016`, `T017` can run in parallel.
- Different stories can run in parallel after foundational checkpoint with separate owners.

---

## Parallel Example: User Story 1

```bash
# Parallel test-first tasks
T012 apps/cli/tests/unit/greeting-message.test.ts
T013 apps/cli/tests/unit/run-state.test.ts

# Parallel implementation tasks
T015 apps/cli/src/infra/prompt-name.ts
T016 apps/cli/src/infra/loading-screen.tsx
T017 apps/cli/src/ui/app.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (`T012`-`T020`).
3. Validate US1 independently against quickstart scenario.
4. Demo MVP before expanding to US2/US3.

### Incremental Delivery

1. Deliver US1 (end-to-end happy path).
2. Deliver US2 (input recovery robustness).
3. Deliver US3 (final visual continuity).
4. Finish with Polish phase for interruption and edge-case hardening.

### Parallel Team Strategy

1. One developer finalizes Setup/Foundational.
2. After checkpoint, split stories by owner:
   - Dev A: US1
   - Dev B: US2
   - Dev C: US3
3. Merge after independent story-level tests pass.

---

## Notes

- `[P]` means file-level independence with no unmet prerequisite.
- Story labels map tasks directly to user-story acceptance verification.
- Every task includes an exact path for immediate LLM execution.
- Quality gate run (2026-04-09):
  - `bun test --preload ./tests/setup.ts` -> pass (10/10)
  - `bun x tsc --noEmit` -> pass
