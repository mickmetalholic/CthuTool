# Tasks: 批量 PDF/ePub 转 CBZ 工具

**Input**: Design documents from `/specs/008-add-cbz-converter/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cli-convert-contract.md`, `quickstart.md`

**Tests**: Per constitution and feature plan, TDD is mandatory. Every story includes failing tests first, then implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story?] Description`

- `[P]`: task can run in parallel (different files, no blocking dependency)
- `[Story]`: required only in user story phases (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create script package skeleton and wire command discovery.

- [X] T001 Create script package directories for convert feature in `apps/cli/src/scripts/convert-to-cbz/`
- [X] T002 Create script metadata for command discovery in `apps/cli/src/scripts/convert-to-cbz/script.json`
- [X] T003 Create script runtime entry that exports `run` in `apps/cli/src/scripts/convert-to-cbz/index.ts`
- [X] T004 Register convert script in scripts registry at `apps/cli/src/scripts/index.ts`
- [X] T005 [P] Add shared test fixtures directory for mixed input samples in `apps/cli/src/tests/scripts/convert-to-cbz/fixtures/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared contracts, validation, orchestration and adapters required by all stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase completes.

- [X] T006 Define domain entities and conversion types in `apps/cli/src/scripts/convert-to-cbz/domain/conversion-types.ts`
- [X] T007 Define converter contract and result interfaces in `apps/cli/src/scripts/convert-to-cbz/domain/converter.ts`
- [X] T008 Define domain error taxonomy for scan/convert/archive stages in `apps/cli/src/scripts/convert-to-cbz/domain/errors.ts`
- [X] T009 Implement valibot schemas for CLI options and safe defaults in `apps/cli/src/scripts/convert-to-cbz/domain/option-schema.ts`
- [X] T010 [P] Implement output path and archive name pure helpers in `apps/cli/src/scripts/convert-to-cbz/domain/path-mapping.ts`
- [X] T011 [P] Implement conversion strategy selection pure helpers in `apps/cli/src/scripts/convert-to-cbz/domain/strategy.ts`
- [X] T012 Implement Poppler preflight dependency check in `apps/cli/src/scripts/convert-to-cbz/infrastructure/dependencies/check-poppler.ts`
- [X] T013 Implement recursive scanner with relative path preservation in `apps/cli/src/scripts/convert-to-cbz/infrastructure/scanners/file-scanner.ts`
- [X] T014 Implement CBZ archiver adapter for ordered page assets in `apps/cli/src/scripts/convert-to-cbz/infrastructure/packagers/cbz-archiver.ts`
- [X] T015 Implement progress view model for total and active slots in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-view-model.ts`
- [X] T016 Implement buffered progress-safe logger in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`
- [X] T017 Implement task scheduling with `p-limit` and slot reuse in `apps/cli/src/scripts/convert-to-cbz/application/schedule-tasks.ts`
- [X] T018 Implement job orchestrator pipeline (validate, scan, schedule, summarize) in `apps/cli/src/scripts/convert-to-cbz/application/run-conversion-job.ts`

**Checkpoint**: Foundation complete; user stories can now proceed.

---

## Phase 3: User Story 1 - 批量发现并转换漫画文件 (Priority: P1) 🎯 MVP

**Goal**: 扫描目录树中的 PDF/ePub 并输出保留相对路径结构的 `.cbz` 文件。  
**Independent Test**: 在包含多层目录与混合格式的输入运行命令，验证全部可转换文件生成对应 `.cbz`。

### Tests for User Story 1 (required — TDD)

- [X] T019 [P] [US1] Add unit tests for recursive scan and extension matching in `apps/cli/src/tests/scripts/convert-to-cbz/unit/file-scanner.test.ts`
- [X] T020 [P] [US1] Add unit tests for path mapping and zero-padded archive naming in `apps/cli/src/tests/scripts/convert-to-cbz/unit/path-mapping.test.ts`
- [X] T021 [P] [US1] Add integration test for mixed PDF/ePub batch conversion success in `apps/cli/src/tests/scripts/convert-to-cbz/integration/batch-convert-success.test.ts`

### Implementation for User Story 1

- [X] T022 [US1] Implement PDF converter using `pdfinfo` + single `pdftoppm` invocation in `apps/cli/src/scripts/convert-to-cbz/infrastructure/converters/pdf-converter.ts`
- [X] T023 [US1] Implement ePub renderer pool adapter (single browser, limited pages) in `apps/cli/src/scripts/convert-to-cbz/infrastructure/renderers/epub-renderer-pool.ts`
- [X] T024 [US1] Implement ePub converter with extract-first and render-fallback pipeline in `apps/cli/src/scripts/convert-to-cbz/infrastructure/converters/epub-converter.ts`
- [X] T025 [US1] Integrate converter registry and file-type dispatch in `apps/cli/src/scripts/convert-to-cbz/application/run-conversion-job.ts`
- [X] T026 [US1] Implement CLI command argument flow and interactive input fallback in `apps/cli/src/scripts/convert-to-cbz/index.ts`

**Checkpoint**: US1 independently delivers end-to-end batch conversion.

---

## Phase 4: User Story 2 - 获得清晰进度与结果反馈 (Priority: P2)

**Goal**: 提供总体进度 + 活跃文件进度，并在结束输出可读总结报告。  
**Independent Test**: 执行 3+ 文件并发转换，验证两层进度与最终统计完整输出。

### Tests for User Story 2 (required — TDD)

- [X] T027 [P] [US2] Add unit tests for progress slot assignment and reuse in `apps/cli/src/tests/scripts/convert-to-cbz/unit/progress-view-model.test.ts`
- [X] T028 [P] [US2] Add unit tests for summary formatting and status coloring in `apps/cli/src/tests/scripts/convert-to-cbz/unit/progress-logger.test.ts`
- [X] T029 [P] [US2] Add integration test for multi-file progress and final summary report in `apps/cli/src/tests/scripts/convert-to-cbz/integration/progress-and-summary.test.ts`
- [X] T045 [P] [US2] Add unit tests for active-only file progress labels (relative path, no absolute path) in `apps/cli/src/tests/scripts/convert-to-cbz/unit/progress-view-model.test.ts`
- [X] T046 [P] [US2] Add unit tests for distinct color mapping between global and file progress bars in `apps/cli/src/tests/scripts/convert-to-cbz/unit/progress-logger.test.ts`
- [X] T047 [P] [US2] Add unit tests for english styled summary layout (sections + emoji + multi-color statuses) in `apps/cli/src/tests/scripts/convert-to-cbz/unit/progress-logger.test.ts`
- [X] T048 [P] [US2] Add integration test asserting progress output is not interrupted by logs (no interleaved plain lines during render) in `apps/cli/src/tests/scripts/convert-to-cbz/integration/progress-and-summary.test.ts`

### Implementation for User Story 2

- [X] T030 [US2] Implement multibar progress controller (total + active tasks) in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`
- [X] T031 [US2] Implement PDF progress lifecycle (set total from `pdfinfo`, complete on success) in `apps/cli/src/scripts/convert-to-cbz/infrastructure/converters/pdf-converter.ts`
- [X] T032 [US2] Implement final summary aggregation (success, failures, output, duration) in `apps/cli/src/scripts/convert-to-cbz/application/run-conversion-job.ts`
- [X] T033 [US2] Ensure logger-only output channel during progress rendering in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`
- [X] T049 [US2] Ensure file progress display uses relative paths (never absolute paths) and hides completed file bars (active-only) in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-view-model.ts`
- [X] T050 [US2] Apply distinct colors for global progress bar vs active file progress bars in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`
- [X] T051 [US2] Update final summary renderer to english structured layout with emoji and multi-color status sections in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`
- [X] T052 [US2] Enforce non-interrupting log flushing behavior during progress rendering (buffer/queue only) in `apps/cli/src/scripts/convert-to-cbz/infrastructure/logging/progress-logger.ts`

**Checkpoint**: US2 independently delivers observable runtime progress and completion report.

---

## Phase 5: User Story 3 - 单文件失败不影响全局任务 (Priority: P3)

**Goal**: 单文件异常时记录失败原因并继续处理后续文件。  
**Independent Test**: 混入损坏/权限受限文件后，任务仍处理其余文件并输出失败清单。

### Tests for User Story 3 (required — TDD)

- [X] T034 [P] [US3] Add unit tests for recoverable vs unrecoverable failure mapping in `apps/cli/src/tests/scripts/convert-to-cbz/unit/errors.test.ts`
- [X] T035 [P] [US3] Add integration test for damaged input skip-and-continue behavior in `apps/cli/src/tests/scripts/convert-to-cbz/integration/skip-failed-file.test.ts`
- [X] T036 [P] [US3] Add integration test for permission-denied output handling in `apps/cli/src/tests/scripts/convert-to-cbz/integration/permission-error.test.ts`

### Implementation for User Story 3

- [X] T037 [US3] Implement per-file error capture and continuation semantics in `apps/cli/src/scripts/convert-to-cbz/application/schedule-tasks.ts`
- [X] T038 [US3] Implement user-actionable permission and dependency error messages in `apps/cli/src/scripts/convert-to-cbz/domain/errors.ts`
- [X] T039 [US3] Integrate failure record collection into final job status calculation in `apps/cli/src/scripts/convert-to-cbz/application/run-conversion-job.ts`

**Checkpoint**: US3 independently guarantees resilient batch execution.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates, docs alignment, and regression safety.

- [X] T040 [P] Add unit tests for option schema bounds (`quality`, `dpi`, `concurrency`) in `apps/cli/src/tests/scripts/convert-to-cbz/unit/option-schema.test.ts`
- [X] T041 [P] Add integration test for no-target-files early exit in `apps/cli/src/tests/scripts/convert-to-cbz/integration/no-target-files.test.ts`
- [X] T053 [P] Add integration test for summary scanability (key fields visible within <=3 screens) in `apps/cli/src/tests/scripts/convert-to-cbz/integration/progress-and-summary.test.ts`
- [X] T042 Validate quickstart command and expected outputs in `specs/008-add-cbz-converter/quickstart.md`
- [X] T043 Update script usage and examples in `apps/cli/README.md`
- [X] T044 Run full CLI package checks (`bun test`, lint, type-check) and record notes in `specs/008-add-cbz-converter/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Setup and blocks all user stories.
- User Story phases (Phase 3-5) depend on Foundational completion.
- Polish (Phase 6) depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: starts after Phase 2; no dependency on US2/US3.
- **US2 (P2)**: starts after Phase 2; depends on US1 converter events but remains independently testable.
- **US3 (P3)**: starts after Phase 2; depends on scheduler/orchestrator baseline from US1.

### Within Each User Story

- Write tests first and confirm failures.
- Implement domain/infrastructure logic.
- Integrate into application orchestration.
- Re-run story-specific tests before moving on.

### Parallel Opportunities

- Phase 2: T010 and T011 can run in parallel; logging/view-model tasks can also parallelize after type contracts exist.
- US1: T019/T020/T021 can run in parallel; T022 and T023 can proceed in parallel before orchestration integration.
- US2: T027/T028/T029 can run in parallel; T030 and T031 can run in parallel then converge at T032.
- US3: T034/T035/T036 can run in parallel; T037 and T038 can run in parallel before T039.
- Polish: T040 and T041 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# TDD first (parallel)
Task: "T019 [US1] file-scanner unit tests in apps/cli/src/tests/scripts/convert-to-cbz/unit/file-scanner.test.ts"
Task: "T020 [US1] path-mapping unit tests in apps/cli/src/tests/scripts/convert-to-cbz/unit/path-mapping.test.ts"
Task: "T021 [US1] integration test in apps/cli/src/tests/scripts/convert-to-cbz/integration/batch-convert-success.test.ts"

# Implementation parallel block
Task: "T022 [US1] PDF converter in apps/cli/src/scripts/convert-to-cbz/infrastructure/converters/pdf-converter.ts"
Task: "T023 [US1] ePub renderer pool in apps/cli/src/scripts/convert-to-cbz/infrastructure/renderers/epub-renderer-pool.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Finish Phase 1 and Phase 2.
2. Complete all US1 tests and implementation tasks.
3. Validate independent US1 acceptance via mixed-directory conversion run.

### Incremental Delivery

1. Deliver US1 for core conversion value.
2. Add US2 for observability and operational feedback.
3. Add US3 for resilience and production-readiness.
4. Run Phase 6 cross-cutting checks before merge.

