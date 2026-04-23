# Tasks: Obsidian Enhancer Package

**Input**: Design documents from `/specs/009-obsidian-enhancer/`  
**Prerequisites**: `plan.md`（required）, `spec.md`（required）, `research.md`, `data-model.md`, `contracts/obsidian-enhancer.contract.md`, `quickstart.md`

**Tests**: 按宪章要求执行 TDD。每个用户故事均先写失败测试，再实现。

**Organization**: 按用户故事分组，确保每个故事可独立实现与验证。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立包基础结构与构建脚手架。

- [ ] T001 创建 `packages/obsidian-enhancer` 包基础文件结构（`package.json/tsconfig.json/README.md`）
- [ ] T002 配置 `esbuild.config.mjs` 打包入口与外部依赖白名单
- [ ] T003 建立插件元数据文件 `manifest.json`、`versions.json`、`styles.css`
- [ ] T004 建立版本同步脚本 `version-bump.mjs`
- [ ] T005 [P] 配置 `pnpm` 工作区过滤构建验证命令

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 搭建所有用户故事共用的核心模块与约束。

- [ ] T006 创建插件入口骨架 `packages/obsidian-enhancer/src/main.ts`
- [ ] T007 创建设置模型与解析函数 `packages/obsidian-enhancer/src/settings.ts`
- [ ] T008 [P] 创建标签标准化工具 `packages/obsidian-enhancer/src/utils/tags.ts`
- [ ] T009 创建设置面板实现 `packages/obsidian-enhancer/src/setting-tab.ts`
- [ ] T010 定义构建产物同步插件逻辑（build hook）于 `packages/obsidian-enhancer/esbuild.config.mjs`
- [ ] T011 建立 quickstart 验证流程并补齐文档 `specs/009-obsidian-enhancer/quickstart.md`

**Checkpoint**: 基础层完成后再进入各用户故事实现。

---

## Phase 3: User Story 1 - 在 Monorepo 内使用增强插件 (Priority: P1) 🎯 MVP

**Goal**: 新包可在 monorepo 中被识别并成功构建。  
**Independent Test**: 运行包构建后得到完整插件产物集合。

### Tests for User Story 1 (TDD)

- [ ] T012 [P] [US1] 新增包结构验证测试（文件存在性）到 `packages/obsidian-enhancer/tests/unit/package-layout.test.ts`
- [ ] T013 [P] [US1] 新增构建产物集合验证测试到 `packages/obsidian-enhancer/tests/integration/build-artifacts.test.ts`

### Implementation for User Story 1

- [ ] T014 [US1] 迁移并拆分插件主逻辑到 `packages/obsidian-enhancer/src/main.ts`
- [ ] T015 [US1] 补齐包脚本与构建命令至 `packages/obsidian-enhancer/package.json`
- [ ] T016 [US1] 验证默认输出目录 `dist` 产物完整性并修复缺失项

**Checkpoint**: US1 完成后应可独立完成构建与加载。

---

## Phase 4: User Story 2 - 保持行为一致并修复已知问题 (Priority: P2)

**Goal**: 功能保持一致，且已知问题被修复。  
**Independent Test**: 4 个 ribbon 功能回归通过，问题场景复现转通过。

### Tests for User Story 2 (TDD)

- [ ] T017 [P] [US2] 新增标签标准化与匹配单元测试到 `packages/obsidian-enhancer/tests/unit/tags.test.ts`
- [ ] T018 [P] [US2] 新增自动移动匹配行为单元测试到 `packages/obsidian-enhancer/tests/unit/auto-move.test.ts`
- [ ] T019 [P] [US2] 新增状态升级链路单元测试到 `packages/obsidian-enhancer/tests/unit/mark-easier.test.ts`

### Implementation for User Story 2

- [ ] T020 [US2] 实现 Eudic 打开功能到 `packages/obsidian-enhancer/src/features/open-in-eudic.ts`
- [ ] T021 [US2] 实现并修复自动移动匹配逻辑到 `packages/obsidian-enhancer/src/features/auto-move.ts`
- [ ] T022 [US2] 实现复习打卡功能到 `packages/obsidian-enhancer/src/features/mark-reviewed.ts`
- [ ] T023 [US2] 实现状态升级功能到 `packages/obsidian-enhancer/src/features/mark-easier.ts`
- [ ] T024 [US2] 统一用户反馈 Notice，移除调试噪音日志

**Checkpoint**: US2 完成后应保证行为一致且关键问题已修复。

---

## Phase 5: User Story 3 - 一步将构建产物部署到 Obsidian 插件目录 (Priority: P3)

**Goal**: 构建命令可直接投递到指定插件目录。  
**Independent Test**: 设置 `OBSIDIAN_PLUGIN_DIR` 后构建，目标目录可直接加载插件。

### Tests for User Story 3 (TDD)

- [ ] T025 [P] [US3] 新增输出目录优先级单元测试到 `packages/obsidian-enhancer/tests/unit/build-target.test.ts`
- [ ] T026 [P] [US3] 新增指定目录产物同步集成测试到 `packages/obsidian-enhancer/tests/integration/plugin-dir-output.test.ts`

### Implementation for User Story 3

- [ ] T027 [US3] 实现 `--outdir`/`OBSIDIAN_PLUGIN_DIR`/默认 `dist` 解析逻辑于 `packages/obsidian-enhancer/esbuild.config.mjs`
- [ ] T028 [US3] 实现构建后资产同步（`manifest/styles/versions`）于 `packages/obsidian-enhancer/esbuild.config.mjs`
- [ ] T029 [US3] 更新构建使用说明至 `packages/obsidian-enhancer/README.md`

**Checkpoint**: US3 完成后应实现“构建即部署”。

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T030 [P] 补齐关键纯函数 TSDoc 到 `packages/obsidian-enhancer/src/**/*.ts`
- [ ] T031 运行并记录质量门禁结果（`biome/tsc/test/build`）到 `specs/009-obsidian-enhancer/research.md`
- [ ] T032 对齐规范文档引用与验收步骤到 `specs/009-obsidian-enhancer/quickstart.md`

---

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> (US1, US2, US3) -> Phase 6  
- US1 为 MVP；US2 依赖基础模块；US3 依赖构建链路稳定。

## Parallel Opportunities

- T005, T008, T012, T013, T017, T018, T019, T025, T026, T030 可并行。  
- 仅在不修改同一文件时并行执行。

## Implementation Strategy

1. 先完成 US1（可构建、可加载）  
2. 再完成 US2（行为一致 + 问题修复）  
3. 最后完成 US3（产物直出指定目录）  
4. 收尾执行 Phase 6 质量与文档闭环
