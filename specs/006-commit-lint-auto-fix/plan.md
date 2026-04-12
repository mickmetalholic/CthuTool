# Implementation Plan: 基于 lint-staged 的提交时 lint 门禁增强

**Branch**: `006-commit-lint-auto-fix` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)  
**Input**: 功能规格见 `/specs/006-commit-lint-auto-fix/spec.md`；用户补充方向为通过 **lint-staged** 增强本地 lint 门禁并与 Husky 集成。

**说明**: 本文件由 `/speckit.plan` 生成；执行流程见 `.specify/templates/plan-template.md`。

## Summary

在保留 **Commitlint**（`commit-msg` 钩子）的前提下，将当前 **pre-commit** 中手写 `git diff` + `biome check`（仅检查、无写入）替换为 **`lint-staged` 编排**：对暂存区中 `apps/`、`packages/` 下受 Biome 管理的文件执行 **`biome check --write`**，利用 lint-staged 对任务修改过的文件 **自动再次 `git add`**，使可自动修复的问题在同一提交中完成，无法修复的问题仍阻断提交。CI 继续执行全仓库 `pnpm run lint`（`biome check .`），与本地「仅针对本次变更路径」的写入式检查形成互补，符合宪章中的质量门禁与 CI 一致性要求。

## Technical Context

**Language/Version**: Node.js（仓库 `engines`：`>=24.0.0 <25`，Volta 锁定 24.14.1）；包管理 pnpm 9.x  
**Primary Dependencies**: `husky`（已有）、`@biomejs/biome`（已有）、**`lint-staged`（新增）**、`@commitlint/cli`（已有）  
**Storage**: N/A（仅 Git 暂存区与工作区文件）  
**Testing**: 根目录 `jest` + `turbo run test`；本特性以「钩子行为与文档」验证为主，无需新增业务单测（配置级变更）  
**Target Platform**: 贡献者本地开发机（Windows / macOS / Linux），与 CI `ubuntu-latest` 行为对齐策略见 `research.md`  
**Project Type**: Turborepo 单体仓库，门禁为仓库级工具配置  
**Performance Goals**: pre-commit 仅处理本次暂存相关文件，避免全仓库 `biome check` 拖慢日常提交  
**Constraints**: 须满足 spec FR-001～FR-006；提交信息规则不变；不削弱 Commitlint；与 `biome.jsonc` 的 `files.includes`（`apps/**`、`packages/**`）一致  
**Scale/Scope**: 根目录 `package.json` 增加 `lint-staged` 配置与依赖；`.husky/pre-commit` 简化为调用 `lint-staged`；可选独立 `lint-staged` 配置文件

## Constitution Check

*GATE：Phase 0 研究前必须通过；Phase 1 设计后再次核对。*

依据 `.specify/memory/constitution.md`（CthuTool）：

- **FP 与模块化**：本特性为 Husky/lint-staged/Biome 配置与 shell 钩子，不涉及业务 `neverthrow`/`valibot` 代码路径；钩子脚本保持单一职责（pre-commit 仅委托 lint-staged）。
- **错误处理**：不适用业务层；钩子以非零退出表示失败。
- **验证**：不适用运行时边界验证。
- **TDD**：无新增可单测业务逻辑；可通过「暂存违规文件 → 提交」做手动/脚本验收（见 `quickstart.md`）。
- **TSDoc**：不适用。
- **栈与仓库**：Turborepo、`@cthutool/*` 命名不变。
- **CI**：变更后仍须通过 Biome、测试、Commitlint 等流水线；本地 pre-commit 使用 `--write` 仅影响开发者工作区与即将提交的快照，合并后 CI 全量检查仍为准绳。

**Phase 1 后复核**：无宪章冲突；无需填写 Complexity Tracking。

## Project Structure

### 文档（本特性）

```text
specs/006-commit-lint-auto-fix/
├── plan.md              # 本文件（/speckit.plan）
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── commit-hook.contract.md
└── tasks.md             # Phase 2（/speckit.tasks，非本命令生成）
```

### 源码（仓库根目录，本特性将触碰的路径）

```text
package.json                 # 新增 devDependency lint-staged；新增 "lint-staged" 配置
pnpm-lock.yaml               # 锁文件随依赖更新
.husky/pre-commit            # 改为执行 pnpm exec lint-staged（或 npx/pnpm 等价调用）
biome.jsonc                  # 一般不修改；Biome 仍管理 apps/**、packages/**
```

**结构说明**：不新增 `apps/` 或 `packages/` 下业务代码；仅根目录工具链与 Git 钩子。

## Complexity Tracking

本实现不引入宪章违背项；无需登记豁免。

---

## Phase 0 & 1 产出与后置核对

| 产出 | 路径 | 状态 |
|------|------|------|
| 研究结论 | [research.md](./research.md) | 已解决「lint-staged + Biome --write + CI 对齐」等要点 |
| 数据与状态模型 | [data-model.md](./data-model.md) | 提交门禁实体与状态迁移 |
| 契约 | [contracts/commit-hook.contract.md](./contracts/commit-hook.contract.md) | pre-commit / commit-msg 行为契约 |
| 快速验证 | [quickstart.md](./quickstart.md) | 本地验证步骤 |
| Agent 上下文 | `.cursor/rules/specify-rules.mdc` | 由 `update-agent-context.ps1` 更新 |

**后置 Constitution Check**：仍为通过；CI 清单（Biome、TSC、Knip、Commitlint、Tests）未被削弱。

## 后续步骤

使用 `/speckit.tasks` 将本计划拆分为可执行 task（依赖安装、配置、钩子替换、文档与回归检查）。
