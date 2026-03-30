# Tasks: 基于 Biome 的代码质量门禁

**Input**: 设计文档来自 `/specs/003-biome-quality-gates/`  
**Prerequisites**: `plan.md`（必需）, `spec.md`（必需）, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 本特性以“命令级验收 + 门禁行为验证”为主；按规格中的独立测试标准为每个用户故事提供可单独执行的验证任务。

**Organization**: 任务按用户故事分组，确保每个故事可独立实现与验证。

## Phase 1: Setup（共享初始化）

**Purpose**: 安装 Biome 并建立仓库级统一入口

- [ ] T001 Add Biome dependency and root scripts in `package.json`
- [ ] T002 Create root Biome policy file in `biome.jsonc`
- [ ] T003 [P] Add Biome include/exclude scope for `apps/**` and `packages/**` in `biome.jsonc`
- [ ] T004 [P] Document baseline Biome commands in `specs/003-biome-quality-gates/quickstart.md`

---

## Phase 2: Foundational（阻塞前置）

**Purpose**: 建立三层门禁共享的执行基线与职责边界

**⚠️ CRITICAL**: 本阶段完成前，不进入任一用户故事实现

- [ ] T005 Align monorepo check pipeline to include Biome in root `package.json`
- [ ] T006 [P] Update CI trigger strategy for all-branch push in `.github/workflows/ci.yml`
- [ ] T007 [P] Keep Commitlint/Biome responsibility boundary documented in `specs/003-biome-quality-gates/contracts/biome-quality-gates.contract.md`
- [ ] T008 Define staged-only gate command contract in `specs/003-biome-quality-gates/contracts/biome-quality-gates.contract.md`

**Checkpoint**: 统一规则源、触发范围、职责边界全部落地，可进入用户故事阶段

---

## Phase 3: User Story 1 - 在编辑器中编写时获得与仓库一致的规范反馈 (Priority: P1) 🎯 MVP

**Goal**: 在 Cursor/VS Code 默认获得 onType 检查与 onSave 格式化，且与仓库规则一致

**Independent Test**: 仅依赖编辑器配置与 Biome 规则，在受管源码文件中注入违规写法后可观察到提示或自动修复

### Implementation for User Story 1

- [ ] T009 [US1] Create repository editor defaults for Biome in `.vscode/settings.json`
- [ ] T010 [US1] Configure onType lint and formatOnSave behavior in `.vscode/settings.json`
- [ ] T011 [US1] Document editor onboarding and expected feedback in `README.md`
- [ ] T012 [US1] Add editor-side validation steps in `specs/003-biome-quality-gates/quickstart.md`

**Checkpoint**: US1 可独立验证，不依赖 pre-commit 和 CI

---

## Phase 4: User Story 2 - 在提交前拦截或提示不符合规范的变更 (Priority: P2)

**Goal**: 在本地提交前只检查 staged 受管改动，失败时阻断并给出修复指引

**Independent Test**: 构造一次含违规 staged 改动的提交并确认被阻断，再构造一次合规提交并确认可通过

### Implementation for User Story 2

- [ ] T013 [US2] Create pre-commit hook entry in `.husky/pre-commit`
- [ ] T014 [US2] Implement staged-file Biome check command in `.husky/pre-commit`
- [ ] T015 [US2] Add actionable fix hints for hook failure in `.husky/pre-commit`
- [ ] T016 [US2] Document local pre-commit gate workflow in `README.md`
- [ ] T017 [US2] Add staged gate validation procedure in `specs/003-biome-quality-gates/quickstart.md`

**Checkpoint**: US2 可独立验证，不依赖 CI 结果

---

## Phase 5: User Story 3 - 所有分支推送均需通过自动化检查 (Priority: P3)

**Goal**: 所有分支 push 都执行与本地一致的 Biome 检查并在失败时标红流水线

**Independent Test**: 分别推送违规样本与修复样本，确认 CI 中对应 Biome 结果失败/通过

### Implementation for User Story 3

- [ ] T018 [US3] Add Biome check step using root policy in `.github/workflows/ci.yml`
- [ ] T019 [US3] Ensure CI Biome command parity with local docs in `specs/003-biome-quality-gates/quickstart.md`
- [ ] T020 [US3] Scope CI checks to managed source paths via `biome.jsonc`
- [ ] T021 [US3] Document CI quality gate behavior and failure semantics in `README.md`

**Checkpoint**: US3 可独立验证，形成远程最终防线

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事一致性、回归验证与交付完善

- [ ] T022 [P] Add incremental-baseline rollout guidance in `specs/003-biome-quality-gates/quickstart.md`
- [ ] T023 Run end-to-end gate walkthrough and record outcomes in `specs/003-biome-quality-gates/quickstart.md`
- [ ] T024 [P] Cross-check wording consistency across `specs/003-biome-quality-gates/spec.md` and `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成，阻塞所有用户故事
- **Phase 3-5 (US1/US2/US3)**: 依赖 Phase 2 完成；建议按 P1 → P2 → P3 交付
- **Phase 6 (Polish)**: 依赖至少一个用户故事完成，建议在全部故事完成后收尾

### User Story Dependencies

- **US1 (P1)**: 仅依赖 Foundational，可先形成 MVP
- **US2 (P2)**: 依赖 Foundational；可在 US1 完成后推进以形成本地阻断闭环
- **US3 (P3)**: 依赖 Foundational；建议在 US2 后完成以保证本地与 CI 行为一致

### Within Each User Story

- 先更新配置/脚本，再补齐文档与验证步骤
- 独立测试应只依赖该故事最小闭环

### Parallel Opportunities

- Setup 中 `T003` 与 `T004` 可并行
- Foundational 中 `T006` 与 `T007` 可并行
- Polish 中 `T022` 与 `T024` 可并行

---

## Parallel Example: User Story 2

```bash
# 并行准备提交门禁实现与文档
Task: "Create pre-commit hook entry in .husky/pre-commit"
Task: "Document local pre-commit gate workflow in README.md"

# 然后串行完成命令与验收
Task: "Implement staged-file Biome check command in .husky/pre-commit"
Task: "Add staged gate validation procedure in specs/003-biome-quality-gates/quickstart.md"
```

---

## Implementation Strategy

### MVP First（仅 User Story 1）

1. 完成 Phase 1 与 Phase 2
2. 完成 US1（Phase 3）
3. 按独立测试标准验证编辑器反馈闭环
4. 通过后再进入 US2/US3

### Incremental Delivery

1. Setup + Foundational 建立统一规则与触发基础
2. 交付 US1（编辑器体验）
3. 交付 US2（本地提交阻断）
4. 交付 US3（CI 最终防线）
5. 用 Polish 统一文档与收敛策略

### Parallel Team Strategy

1. 全员先完成 Setup + Foundational
2. 开发者 A 负责 US1，开发者 B 负责 US2，开发者 C 负责 US3（在依赖满足后并行）
3. 最后统一进行跨故事回归与文档一致性校验

---

## Notes

- 所有任务均采用严格 checklist 格式：`- [ ] Txxx [P?] [US?] 描述 + 文件路径`
- `[P]` 仅用于文件互不冲突且无前置依赖的任务
- 用户故事任务必须带 `[USx]` 标签；Setup/Foundational/Polish 不带故事标签
