# Implementation Plan: 基于 Biome 的代码质量门禁

**Branch**: `003-biome-quality-gates` | **Date**: 2026-03-30 | **Spec**: `specs/003-biome-quality-gates/spec.md`  
**Input**: Feature specification from `specs/003-biome-quality-gates/spec.md`

## Summary

在 Turborepo 单仓中引入统一的 Biome 规则与执行入口，并将其接入三层质量门禁：编辑器（onType 检查 + onSave 格式化）、本地提交（仅检查暂存改动且失败阻断）、CI（所有分支 push 强制执行）。通过仓库级配置和文档化流程，确保本地体验与 CI 判定一致。

## Technical Context

**Language/Version**: Node.js >= 20（仓库 `engines`），TypeScript 5.9.x  
**Primary Dependencies**: `@biomejs/biome`（新增，作为格式化+lint 统一引擎）、`husky`（已存在）、`turbo`（已存在）  
**Storage**: N/A（仅仓库配置与工作流）  
**Testing**: Jest（现有测试框架）+ 命令级验证（`biome check`、`biome check --write`）  
**Target Platform**: 本地开发环境（Cursor/VS Code）+ GitHub Actions CI  
**Project Type**: Turborepo monorepo（Node.js 工具链）  
**Performance Goals**: 常规提交前检查在开发者可接受时间内完成；CI 单次门禁与当前检查任务并行执行  
**Constraints**:  
- 必须与现有 Commitlint 职责分离（提交信息 vs 源码质量）  
- 必须覆盖 monorepo 中受管源码路径，同时避免对无关文件过度扫描  
- 历史遗留问题采用“增量强制 + 基线分阶段收敛”  
**Scale/Scope**: 影响根目录配置、工作区脚本、`.vscode` 设置、husky 钩子与 CI 工作流

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP & modularity**: 通过配置与脚本分层（编辑器/本地提交/CI）落地，无新增业务逻辑层，不引入额外耦合。  
- **Errors / neverthrow**: 本特性主要为工程配置，不新增业务逻辑函数；无违例。  
- **Validation / valibot**: 无新增运行时数据边界校验代码；无违例。  
- **TDD**: 以门禁命令和示例违规样本作为验收；不替代既有测试策略。  
- **TSDoc**: 不涉及新增核心业务函数；无违例。  
- **Stack & repo**: 保持 Turborepo 结构与命名不变，仅增加质量门禁配置。  
- **CI**: 与宪章质量门禁一致，强化 Biome 在 CI 的强制执行。  

结论：通过，无需在 Complexity Tracking 中登记豁免。

## Project Structure

### Documentation (this feature)

```text
specs/003-biome-quality-gates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── biome-quality-gates.contract.md
└── tasks.md
```

### Source Code (repository root)

```text
.
├── package.json
├── biome.jsonc                     # 新增/更新：统一规则入口
├── .vscode/
│   └── settings.json               # 新增/更新：Cursor 默认行为
├── .husky/
│   └── pre-commit                  # 新增/更新：提交前增量检查
├── .github/workflows/
│   └── *.yml                       # 新增/更新：push 触发 Biome 门禁
├── packages/
│   └── */                          # 受管源码目录
└── apps/
    └── */                          # 受管源码目录
```

**Structure Decision**: 采用“根配置 + 三层执行入口”方案。根目录持有单一 Biome 规则源，各层仅复用同一命令能力并按场景约束范围（编辑器实时、提交增量、CI 全量）。

## Phase 0 Research Output

参见 `specs/003-biome-quality-gates/research.md`。所有初始不明确项已收敛为可执行决策：规则承载、增量策略、CI 触发范围、与 Commitlint 职责边界。

## Phase 1 Design Output

- 数据模型：`specs/003-biome-quality-gates/data-model.md`  
- 合同文档：`specs/003-biome-quality-gates/contracts/biome-quality-gates.contract.md`  
- 快速开始：`specs/003-biome-quality-gates/quickstart.md`

## Post-Design Constitution Check

- 设计产物未引入与宪章冲突的新技术或新流程。  
- 质量门禁顺序与职责满足宪章“Biome/TSC/Knip/Commitlint/Tests”的分工。  
- 文档与执行口径一致，支持“本地先发现、CI 兜底”的闭环。

结论：仍然通过，无额外复杂度豁免。

## Complexity Tracking

无（Constitution Check 全量通过）。
