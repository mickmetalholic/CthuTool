---

description: "Task list for commit-time lint gate with lint-staged (006-commit-lint-auto-fix)"
---

# Tasks: Commit-time lint gate with auto-fix (lint-staged)

**Input**: Design documents from `/specs/006-commit-lint-auto-fix/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: plan.md 将本特性标为配置级变更，验收以 `quickstart.md` 手动场景与钩子行为为主；不设 Jest/业务单测任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and verification of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- 仓库根目录：`package.json`、`pnpm-lock.yaml`、`.husky/pre-commit`、`.husky/commit-msg`、`biome.jsonc`
- 本特性不新增 `apps/`、`packages/` 业务代码；验证时可在上述目录选用临时文件

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 引入 lint-staged 依赖，为后续钩子与配置做准备

- [x] T001 Add `lint-staged` to `devDependencies` in `package.json` and run `pnpm install` at repository root to update `pnpm-lock.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事共用的 pre-commit 管线（lint-staged + Biome `--write`）；完成前不得宣称任一用户故事已交付

**⚠️ CRITICAL**: No user story verification should be treated as complete until this phase is complete

- [x] T002 Configure `lint-staged` in `package.json` (or add a dedicated config file at repository root if preferred) so staged files under `apps/` and `packages/` run `pnpm exec biome check --write` with no default `--unsafe`, matching `biome.jsonc` `files.includes` and `specs/006-commit-lint-auto-fix/contracts/commit-hook.contract.md`
- [x] T003 Replace `.husky/pre-commit` to invoke `pnpm exec lint-staged` per `specs/006-commit-lint-auto-fix/contracts/commit-hook.contract.md`, removing the legacy `git diff` + read-only `biome check` script

**Checkpoint**: Foundation ready — user story manual verification can begin

---

## Phase 3: User Story 1 - One-shot commit with auto-fixed style (Priority: P1) 🎯 MVP

**Goal**: 暂存变更在提交过程中由 Biome 自动修复可修复项，修复进入同一提交，提交成功（spec US1）

**Independent Test**: `specs/006-commit-lint-auto-fix/quickstart.md` §1 — 仅可自动修复违规时一次提交成功且 `git show` 可见修复

### Verification for User Story 1

- [x] T004 [US1] Execute manual acceptance in `specs/006-commit-lint-auto-fix/quickstart.md` §1 using a file under `apps/` or `packages/`, confirming a single successful commit contains both original intent and Biome corrections (FR-001, FR-002, FR-005a)

**Checkpoint**: User Story 1 satisfied independently

---

## Phase 4: User Story 2 - Blocked commit with clear next steps (Priority: P2)

**Goal**: 无法自动修复的问题仍阻断提交，终端可见 Biome 诊断，修复后可再次提交（spec US2）

**Independent Test**: `specs/006-commit-lint-auto-fix/quickstart.md` §2

### Verification for User Story 2

- [x] T005 [US2] Execute `specs/006-commit-lint-auto-fix/quickstart.md` §2: introduce a Biome error that `--write` cannot clear, confirm commit fails with visible diagnostics, then fix only remaining issues and confirm the next commit succeeds (FR-003, FR-005b)

**Checkpoint**: User Story 2 satisfied independently

---

## Phase 5: User Story 3 - Commit message rules remain enforced (Priority: P3)

**Goal**: Commitlint 仍在 commit-msg 阶段生效；代码自动修复不削弱消息规则（spec US3）

**Independent Test**: `specs/006-commit-lint-auto-fix/quickstart.md` §3

### Implementation / verification for User Story 3

- [x] T006 [US3] Confirm `.husky/commit-msg` still runs `pnpm exec commitlint --edit "$1"` unchanged per `specs/006-commit-lint-auto-fix/contracts/commit-hook.contract.md` (FR-004)
- [x] T007 [US3] Execute `specs/006-commit-lint-auto-fix/quickstart.md` §3 with valid staged code and an invalid message, confirm failure at commit-msg stage; retry with a valid conventional message and confirm success (FR-004, FR-005)

**Checkpoint**: User Story 3 satisfied independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: CI 对齐、Agent 上下文与文档化收尾

- [x] T008 [P] Run `pnpm run lint` at repository root and follow `specs/006-commit-lint-auto-fix/quickstart.md` §4 for CI parity expectations
- [x] T009 [P] Run `.specify/scripts/powershell/update-agent-context.ps1` from repository root to refresh `.cursor/rules/specify-rules.mdc` per `specs/006-commit-lint-auto-fix/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start with T001
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user story verification
- **User Stories (Phases 3–5)**: Depend on Foundational (Phase 2); proceed P1 → P2 → P3 for lowest risk, or verify in any order after Phase 2 if time-boxed
- **Polish (Phase 6)**: Depends on desired user stories being verified

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only
- **User Story 2 (P2)**: Depends on Phase 2 only; independent of US1 except shared git state discipline
- **User Story 3 (P3)**: Depends on Phase 2 only; independent of US1/US2 for message-only failure path

### Within Each User Story

- Verification tasks assume Phase 2 hook behavior is already correct
- Re-run `pnpm install` / husky if hooks not executable after edits

### Parallel Opportunities

- **T008** and **T009** (Phase 6) may run in parallel by different owners (lint vs agent-context script)
- Phase 2 tasks **T002** and **T003** are sequential (config before hook calls `lint-staged`)

---

## Parallel Example: User Story 1

After Phase 2 completes, the US1 verification is a single sequential git workflow:

```bash
# Single task T004: follow quickstart §1 in specs/006-commit-lint-auto-fix/quickstart.md
```

---

## Parallel Example: Polish (Phase 6)

```bash
# Terminal A — repo lint (T008)
pnpm run lint

# Terminal B — agent context update (T009)
powershell -NoProfile -ExecutionPolicy Bypass -File .specify/scripts/powershell/update-agent-context.ps1
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001  
2. Complete Phase 2: T002, T003  
3. Complete Phase 3: T004 (US1 verification)  
4. **STOP and VALIDATE**: US1 acceptance passes  

### Incremental Delivery

1. Setup + Foundational → hook behavior ready  
2. Add US1 verification → demo MVP  
3. Add US2 verification → blocked-commit clarity  
4. Add US3 verification → message gate unchanged  
5. Polish: CI alignment + agent context  

### Parallel Team Strategy

- Developer A: Phase 1–2 implementation  
- After Phase 2: Developer B runs US1 manual path while Developer C prepares US2/US3 scenarios on separate branches (avoid concurrent commits on one working tree)  

---

## Notes

- Do not use `git commit --no-verify` for acceptance unless documenting the escape hatch in `specs/006-commit-lint-auto-fix/quickstart.md`  
- Partial staging caveats: see `specs/006-commit-lint-auto-fix/research.md`  
- All tasks use checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
