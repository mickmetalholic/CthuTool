---

description: "Task list for Web Server Sub-Application (004)"
---

# Tasks: Web Server Sub-Application

**Input**: Design documents from `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\004-web-server-subapp\`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Per CthuTool Constitution, TDD is mandatory: failing tests before implementation for new logic. Use Jest e2e/unit under `apps/web/` per NestJS baseline (`apps/web/test/`, `apps/web/jest.config.cjs`).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo sub-app**: `apps/web/src/`, `apps/web/test/`, root `nest-cli.json`, root `turbo.json`, root `biome.jsonc`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the NestJS `web` sub-application with CLI only; remove scaffold ESLint; align with Turborepo and Biome.

- [X] T001 Create NestJS monorepo sub-application `web` by running `pnpm dlx @nestjs/cli@latest generate app web` from repository root so `apps/web/` and root `nest-cli.json` are tool-generated (no hand-written scaffold files)
- [X] T002 Remove ESLint config files, ESLint-related devDependencies, and ESLint npm scripts from `apps/web/package.json` and delete any `apps/web/.eslintrc.*` or `apps/web/eslint.config.*`
- [X] T003 [P] Align `apps/web/package.json` scripts with root quality workflow (`pnpm run biome:check`, `turbo run check` / `build` / `test` as applicable)
- [X] T004 [P] Extend `turbo.json` with `build`, `check`, and `test` task definitions for `apps/web` so CI and `pnpm exec turbo` include the new package

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared dependencies and repo-wide lint coverage before user story implementation.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T005 Add `valibot` and `neverthrow` to `apps/web/package.json` dependencies for boundary validation and service-layer `Result` patterns (per constitution and `data-model.md`)
- [X] T006 [P] Confirm root `biome.jsonc` includes `apps/web` sources and that no ESLint artifacts remain under `apps/web/`

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Access Basic Service Endpoints (Priority: P1) 🎯 MVP

**Goal**: Expose `GET /health` with contract-shaped JSON and a consistent `ErrorResponse` for undefined routes (FR-002, FR-003, FR-004).

**Independent Test**: From an external HTTP client, `GET /health` returns 200 with `status`, `service`, `timestamp`; an undefined path returns 404 with standardized error JSON.

### Tests for User Story 1 (required — TDD) ⚠️

> **NOTE: Write these tests FIRST; they MUST FAIL before implementation.**

- [X] T007 [P] [US1] Add failing e2e test for `GET /health` (status 200, body matches `specs/004-web-server-subapp/contracts/web-health.openapi.yaml`) in `apps/web/test/health.e2e-spec.ts`
- [X] T008 [P] [US1] Add failing e2e test for an undefined route returning 404 with `ErrorResponse` shape in `apps/web/test/not-found.e2e-spec.ts`

### Implementation for User Story 1

- [X] T009 [US1] Generate `health` module, service, and controller via Nest CLI (`g module health`, `g service health`, `g controller health` with `--project web`) under `apps/web/src/health/`
- [X] T010 [US1] Implement `HealthService` and `HealthController` in `apps/web/src/health/health.service.ts` and `apps/web/src/health/health.controller.ts` to return `HealthStatus` per `data-model.md` and OpenAPI
- [X] T011 [US1] Register `HealthModule` in `apps/web/src/app.module.ts`
- [X] T012 [US1] Implement consistent not-found / error JSON mapping (e.g. exception filter or `ExceptionFilter`) in `apps/web/src/filters/http-exception.filter.ts` and register in `apps/web/src/main.ts` so undefined routes match `ErrorResponse` (`code`, `message`, `timestamp`)

**Checkpoint**: User Story 1 is independently verifiable via e2e tests and manual curl per contract.

---

## Phase 4: User Story 2 — Operate with Environment-Aware Configuration (Priority: P2)

**Goal**: Validate required runtime configuration at startup (FR-005); fail fast with actionable messages; structured startup and error logging (FR-006).

**Independent Test**: Start once with complete env (success) and once with missing required values (process exits before serving traffic with clear configuration error output).

### Tests for User Story 2 (required — TDD) ⚠️

- [X] T013 [P] [US2] Add failing unit tests for valid vs invalid/missing `ServiceConfiguration` parsing in `apps/web/src/config/service-configuration.spec.ts`

### Implementation for User Story 2

- [X] T014 [US2] Implement valibot schema and parser for `ServiceConfiguration` (`port`, `nodeEnv`, optional `logLevel`) in `apps/web/src/config/service-configuration.schema.ts` aligned with `data-model.md`
- [X] T015 [US2] Load environment variables, parse with the schema, and abort bootstrap before listening when invalid in `apps/web/src/main.ts` (or dedicated `apps/web/src/bootstrap.ts`)
- [X] T016 [US2] Add structured, human-readable startup success and configuration-failure logs in `apps/web/src/main.ts` (use Nest `Logger` or a small `apps/web/src/logger/` helper); ensure no sensitive stack leakage in API responses

**Checkpoint**: User Story 2 independently testable via unit tests and two startup scenarios.

---

## Phase 5: User Story 3 — Support Team Onboarding and Handoff (Priority: P3)

**Goal**: Document local run and verification so a new developer can run and check endpoints without extra guidance (FR-007).

**Independent Test**: A teammate follows docs only and completes start + health + not-found checks within the success criterion window.

### Implementation for User Story 3

- [X] T017 [US3] Update `specs/004-web-server-subapp/quickstart.md` with final env variable names, default port, Nest CLI commands, and curl examples matching implemented behavior
- [X] T018 [P] [US3] Add `apps/web/README.md` with prerequisites, install, start, and verification steps pointing to `specs/004-web-server-subapp/quickstart.md` and `contracts/web-health.openapi.yaml`

**Checkpoint**: Onboarding path validated against quickstart.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and cross-cutting validation.

- [X] T019 [P] Run `pnpm run biome:check` and `pnpm exec turbo run check` from repository root; fix any `apps/web` issues in `apps/web/src/`, `apps/web/test/`, and `apps/web/package.json`
- [X] T020 [P] Execute verification steps in `specs/004-web-server-subapp/quickstart.md` (start, `curl` health, undefined route) and adjust docs if behavior differs
- [X] T021 [P] Add TSDoc (`@param` / `@returns`) to pure configuration parsing functions in `apps/web/src/config/service-configuration.schema.ts` per constitution

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories
- **Phase 3–5 (User Stories)**: Depend on Phase 2; implement in priority order P1 → P2 → P3, or P2 after P1 if serializing
- **Phase 6 (Polish)**: Depends on completion of desired user stories (minimum MVP: through Phase 3)

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no other stories required
- **US2 (P2)**: Depends on Phase 2; builds on running app from US1 but remains independently testable via config tests and startup scenarios
- **US3 (P3)**: Depends on stable behavior from US1/US2 — doc tasks last

### Within Each User Story

- Tests before implementation (red-green)
- US1: e2e before controllers/filters
- US2: unit tests before `main.ts` bootstrap changes
- Implementation before documentation (US3)

### Parallel Opportunities

- **Phase 1**: T003 and T004 in parallel after T001–T002 complete
- **Phase 2**: T006 parallel with finishing T005
- **US1**: T007 and T008 in parallel; after green implementation, unrelated files minimal
- **US2**: T013 parallel with prep work after US1
- **US3**: T018 parallel with T017 after content is stable
- **Polish**: T019–T021 parallel where no merge conflicts

---

## Parallel Example: User Story 1

```bash
# TDD — write failing tests first (parallel):
# Task T007 → apps/web/test/health.e2e-spec.ts
# Task T008 → apps/web/test/not-found.e2e-spec.ts

# After tests exist and fail, run Nest CLI and implement:
# Task T009 → nest g module/service/controller health --project web
# Task T010–T012 → health module + app.module + exception filter
```

---

## Parallel Example: User Story 2

```bash
# Failing tests first:
# Task T013 → apps/web/src/config/service-configuration.spec.ts

# Then schema + bootstrap:
# Task T014 → apps/web/src/config/service-configuration.schema.ts
# Task T015–T016 → apps/web/src/main.ts (and logger helper if split)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (health + not-found)
4. **STOP and VALIDATE**: e2e green + manual curl
5. Demo or integrate downstream

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → independent e2e verification (MVP)
3. Add US2 → config validation + logging verification
4. Add US3 → documentation handoff
5. Polish phase → repo-wide checks

### Parallel Team Strategy

1. Team completes Phase 1–2 together
2. Developer A: US1 (tests + HTTP surface)
3. Developer B: prepare US2 schema/tests after US1 bootstrap exists, or pair on US2 after US1 merge
4. Developer C: US3 docs after behavior stabilizes

---

## Notes

- All scaffold and Nest resource files MUST be created via Nest CLI per `research.md` and `quickstart.md`
- Do not add domain business APIs beyond baseline (FR-008)
- `[P]` tasks touch different files or are independent verification steps
- Commit after each task or logical group; stop at checkpoints to validate stories independently
