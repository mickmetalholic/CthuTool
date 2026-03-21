---

description: "Task list for 001-init-turborepo (Turborepo monorepo init)"
---

# Tasks: 空仓库 Turborepo 初始化

**Input**: Design documents from `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\001-init-turborepo\`  
**Prerequisites**: plan.md（required）, spec.md（required）, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 按 CthuTool Constitution 与 tasks 模板，**TDD**：为契约与可自动化验收项先写失败测试再补齐实现；根级契约测试使用 **Jest**（与 constitution 中 Next/Nest 栈一致；当前无 Next 包时在仓库根配置最小 Jest 仅用于契约/集成测试）。

**Organization**: 按用户故事（spec.md 优先级）分组，便于独立实现与验收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、互不依赖未完成任务）
- **[Story]**: 对应 spec.md 用户故事 US1、US2、US3
- 描述中须含**确切文件路径**（仓库根相对路径）

## Path Conventions

- **Monorepo 根**: 仓库根目录下的 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`apps/`、`packages/`、`README.md`
- **规格与契约**: `specs/001-init-turborepo/*.md`、`specs/001-init-turborepo/contracts/*.md`
- **测试**: 仓库根 `tests/contract/`、`tests/integration/`（若 scaffold 无此目录则创建）

---

## Phase 1: Setup（共享基础设施）

**Purpose**: 官方脚手架产出合并入仓库、清理示例、可安装依赖

- [x] T001 在**仓库外空临时目录**按 `specs/001-init-turborepo/plan.md` Phase 0 执行 `pnpm dlx create-turbo@latest .` 并选择 pnpm（勿在含 `.specify/` 的仓库根执行）；产出将合并至仓库根 `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\`
- [x] T002 将脚手架生成目录中的文件合并至仓库根 `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\`，**不得**覆盖 `.specify/`，遵循 `specs/001-init-turborepo/research.md` 合并策略
- [x] T003 [P] 手工合并根目录 `package.json`（保留既有根字段并与 scaffold 字段合并）
- [x] T004 [P] 手工合并根目录 `turbo.json`
- [x] T005 [P] 手工合并根目录 `pnpm-workspace.yaml`
- [x] T006 删除模板示例应用目录（以实际生成为准，常见为 `apps/docs`、`apps/web`）并清理其对根 `package.json` / `pnpm-workspace.yaml` 的引用，见 `specs/001-init-turborepo/plan.md`
- [x] T007 [P] 在空目录 `apps/`、`packages/` 按需添加 `apps/.gitkeep`、`packages/.gitkeep`，见 `specs/001-init-turborepo/research.md`
- [x] T008 在仓库根 `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\` 执行 `pnpm install`，网络失败时按 `specs/001-init-turborepo/plan.md` / `research.md` 做**有限次数重试**，不得用手写根布局替代脚手架

---

## Phase 2: Foundational（阻塞所有用户故事）

**Purpose**: 工作区至少有一个可编排成员、任务图与根脚本可运行；完成前不得开始用户故事文档/CI 收尾

**⚠️ CRITICAL**: 未完成本阶段前不得将 US1–US3 视为交付

- [x] T009 若删除示例后 workspace glob 下无有效包，则新增占位包 `packages/placeholder/package.json`（`name`: `@cthutool/placeholder`，`private`: true，含无操作或可缓存的 `build`/`check` 脚本），见 `specs/001-init-turborepo/research.md`
- [x] T010 [P] 校正根目录 `pnpm-workspace.yaml` 的 `packages` glob，使其仅匹配存在的 `apps/*`、`packages/*` 成员，见 `specs/001-init-turborepo/data-model.md`
- [x] T011 在根目录 `turbo.json` 为所有工作区成员注册 `build` 与 `check`（或与模板 `lint` 对齐后统一对外为 `check`），见 `specs/001-init-turborepo/data-model.md` 与 `specs/001-init-turborepo/contracts/root-package-scripts.md`
- [x] T012 在根目录 `package.json` 的 `scripts` 中提供 `build`、`check`，且 `build` MUST 委托 turbo 编排全工作区 `build`（`pnpm exec turbo run build` 或等价），`check` MUST 为文档与后续 CI 共用入口，见 `specs/001-init-turborepo/contracts/root-package-scripts.md`
- [x] T013 [P] 在根目录 `package.json` 设置 `engines.node` 与 `packageManager`（与 `specs/001-init-turborepo/quickstart.md` 一致）
- [x] T014 在仓库根执行 `pnpm run build` 与 `pnpm run check`，确认退出码为 0 且 turbo 输出可识别包级任务（满足 SC-003 可定位性基础）

**Checkpoint**: 根级 `pnpm install` 后 `pnpm run check` 可成功；可进入 US1

---

## Phase 3: User Story 1 — 克隆后即可从根目录驱动工作区 (Priority: P1) 🎯 MVP

**Goal**: 新贡献者按文档在仓库根即可完成安装与全工作区校验入口（FR-001–FR-003、FR-005、SC-001）

**Independent Test**: 在仅满足 `quickstart.md` 前置条件的干净环境中，于仓库根执行文档所列命令，`pnpm run check`（及文档规定的相关命令）成功结束且输出体现已覆盖当前工作区成员

### Tests for User Story 1（TDD）⚠️

> **NOTE**: 先写测试锁定契约；若实现已满足，测试应能在回归时失败于故意破坏脚本时显现

- [x] T015 [P] [US1] 在仓库根添加/对齐 Jest 配置 `jest.config.cjs` 与根 `package.json` 中 `scripts.test`（若 create-turbo 未提供根级 Jest，则最小引入 `jest` 为根 devDependency）
- [x] T016 [P] [US1] 在 `tests/contract/root-package-scripts.test.ts` 编写契约测试：断言根 `package.json` 存在 `scripts.build`、`scripts.check` 且语义符合 `specs/001-init-turborepo/contracts/root-package-scripts.md`（含 turbo 委托约束）
- [x] T017 [US1] 在 `tests/integration/root-workspace-check.test.ts` 编写集成测试：在仓库根通过子进程执行 `pnpm run check`（可设合理超时）；若 CI 环境限制无法稳定跑 pnpm，则在该测试文件内用明确 `describe.skip` 与环境变量门控并同时在 `specs/001-init-turborepo/quickstart.md` 写明手工等价步骤

### Implementation for User Story 1

- [x] T018 [US1] 若 T016/T017 未绿：调整根 `package.json` 与 `turbo.json` 直至契约与（可运行的）集成测试通过
- [x] T019 [P] [US1] 更新根目录 `README.md`：前置条件、安装、`pnpm run build` / `pnpm run check`、布局速览（5 分钟内可找到入口，FR-003）
- [x] T020 [P] [US1] 同步 `specs/001-init-turborepo/quickstart.md` 与根 `package.json` 中脚本名、`engines`、`packageManager` 及二次运行缓存说明（FR-004、SC-002）

**Checkpoint**: US1 可独立验收；可作为 MVP 发布

---

## Phase 4: User Story 2 — 工作区边界清晰、可扩展 (Priority: P2)

**Goal**: 目录与 `@cthutool/*` 命名约定清晰；按文档新增成员后根级入口自动纳入（FR-002、FR-005、SC-003）

**Independent Test**: 按文档在 `packages/` 下新增一个符合约定的空包并登记到 `pnpm-workspace.yaml` 后，不修改根脚本即可使 `pnpm run check` 覆盖新成员

### Tests for User Story 2（TDD）⚠️

- [x] T021 [P] [US2] 在 `tests/contract/workspace-members.test.ts` 编写测试：解析 `pnpm-workspace.yaml` 与文件系统，断言 `packages/example-lib/package.json` 存在且 `name` 为 `@cthutool/example-lib`（先写测试时预期 RED，直至 T023 完成）

### Implementation for User Story 2

- [x] T022 [P] [US2] 在根目录 `README.md` 增加「命名与目录约定」小节，明确 `apps/*`、`packages/*` 与 `@cthutool/*`
- [x] T023 [US2] 新增示范库包：创建 `packages/example-lib/package.json`（`@cthutool/example-lib`，`private`: true）、最小 `build`/`check` 脚本，并确保根 `turbo.json` 任务图包含该包且无悬空引用
- [x] T024 [US2] 在 `specs/001-init-turborepo/quickstart.md` 写入「如何新增工作区成员」的分步说明（仅改 workspace 清单与目录，不复制根脚本，FR-002）

**Checkpoint**: US2 在 US1 基础上可独立验证扩展性

---

## Phase 5: User Story 3 — 自动化可复用同一入口 (Priority: P3)

**Goal**: CI 使用与本地文档一致的根级校验入口（FR-006）

**Independent Test**: 推送触发流水线，工作流执行与 `quickstart.md` 一致的 `pnpm run check`（或文档声明的等价封装）；人为破坏某一成员校验时日志可区分失败包

### Tests for User Story 3

- [x] T025 [P] [US3] 在 `tests/contract/ci-workflow.test.ts` 断言 `.github/workflows/ci.yml` 存在且包含在仓库根执行 `pnpm install` 与 `pnpm run check`（或对 `pnpm run check` 的明确调用），与 `specs/001-init-turborepo/contracts/root-package-scripts.md` 一致（先写测试时若尚无工作流则 RED）

### Implementation for User Story 3

- [x] T026 [US3] 新增 `.github/workflows/ci.yml`：检出仓库、安装 pnpm（建议 `packageManager`/`pnpm/action-setup`）、缓存依赖、`pnpm install`、`pnpm run check` 于仓库根
- [x] T027 [US3] 在根目录 `README.md` 或 `specs/001-init-turborepo/quickstart.md` 增加 CI 与本地命令对齐说明（FR-006）

**Checkpoint**: US3 完成；本地与 CI 入口一致

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事一致性与交付物清理

- [x] T028 [P] 按 `specs/001-init-turborepo/quickstart.md` 全文在仓库根逐步执行一遍，修正文档与实现不一致处
- [x] T029 [P] 核对根目录 `.gitignore` 与 Turborepo/pnpm 产物忽略项（如 `node_modules`、`.turbo` 等，以 scaffold 为准）
- [x] T030 [P] 全仓库运行根 `pnpm run check` 与 `pnpm test`（若已配置），确认无示例包残留引用

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1（Setup）**: 无前置，立即开始
- **Phase 2（Foundational）**: 依赖 Phase 1；**阻塞** US1–US3
- **Phase 3–5（US1→US2→US3）**: 均依赖 Phase 2；US2、US3 依赖 US1 的文档/测试基线（US2/US3 的实现不应破坏 US1 契约测试）
- **Phase 6（Polish）**: 依赖拟交付的用户故事全部完成（至少 MVP 需完成 US1）

### User Story Dependencies

- **US1（P1）**: Phase 2 完成后即可；不依赖 US2/US3
- **US2（P2）**: 依赖 US1 的根文档与 `pnpm run check` 基线；示范包 `packages/example-lib/` 为 US2 专属增量
- **US3（P3）**: 依赖 US1 的稳定根脚本名；可与 US2 并行若人力充足，但建议 US2 合并后再接 CI 以减少 workspace 变更冲突

### Within Each User Story

- 契约/集成测试（T015–T017、T021、T025）优先于或紧随于对应实现调整
- 修改 `package.json` 与 `pnpm-workspace.yaml` 时注意与 `turbo.json` 同步，避免悬空任务

### Parallel Opportunities

- T003、T004、T005、T007 可并行（不同文件）
- T010 与 T013 可并行（`pnpm-workspace.yaml` vs 根 `package.json` 不同文件，但注意最终需一次 `pnpm install` 收敛锁文件）
- US1 中 T015 与 T016、T019 与 T020 可并行
- US2 中 T021 与 T022 可并行（不同文件）
- US3 中 T025 与后续工作流实现需先后（测试先 RED）
- Phase 6 中 T028、T029、T030 大多可并行

---

## Parallel Example: User Story 1

```bash
# 可并行启动（TDD）：
Task: "jest.config.cjs 与 package.json scripts.test"
Task: "tests/contract/root-package-scripts.test.ts 契约测试"

# 可并行启动（文档）：
Task: "README.md 贡献者说明"
Task: "specs/001-init-turborepo/quickstart.md 与脚本对齐"
```

---

## Parallel Example: User Story 2

```bash
# 可并行：
Task: "tests/contract/workspace-members.test.ts"
Task: "README.md 命名与目录约定小节"

# 随后串行：创建 packages/example-lib/package.json 并更新 turbo.json
```

---

## Implementation Strategy

### MVP First（仅 User Story 1）

1. 完成 Phase 1、Phase 2  
2. 完成 Phase 3（US1），含契约测试与 README/quickstart  
3. **停止并验收**：干净机器按 `quickstart.md` 复现根级 `pnpm run check`  
4. 再决定是否合并 US2/US3

### Incremental Delivery

1. Setup + Foundational → 根级命令可跑通  
2. +US1 → 文档化 + 契约/集成测试 → **MVP**  
3. +US2 → 示范包与扩展文档  
4. +US3 → GitHub Actions 与入口对齐说明  
5. Polish → quickstart 实测与忽略项核对

### Parallel Team Strategy

1. 共同完成 Phase 1–2  
2. Foundational 完成后：  
   - 开发者 A：US1 测试 + README  
   - 开发者 B：US2 示范包 + quickstart 扩展章节  
   - 开发者 C：US3 workflow + 契约测试 T025  
3. 合并前统一跑根 `pnpm run check` 与 `pnpm test`

---

## Notes

- `[P]` 表示不同文件、无未完成依赖时可并行  
- `[USn]` 仅标在用户故事阶段任务上；Setup / Foundational / Polish 不标 Story  
- 所有任务行格式校验：**`- [ ] Tnnn ...` + 描述内含明确路径**  
- 禁止在未运行 `create-turbo` 的前提下手写根级 monorepo 布局冒充交付物（见 plan.md）
