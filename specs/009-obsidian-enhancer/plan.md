# Implementation Plan: Obsidian Enhancer Package

**Branch**: `009-obsidian-enhancer` | **Date**: 2026-04-24 | **Spec**: `specs/009-obsidian-enhancer/spec.md`  
**Input**: Feature specification from `specs/009-obsidian-enhancer/spec.md`

## Summary

在 `packages` 下新增 `@cthutool/obsidian-enhancer` 包，基于 `.references/obsidian-enhancer` 做迁移重构：  
保持原有增强功能可见行为一致，修复已知逻辑问题（目录匹配与日志污染等），并实现构建产物可直接输出到指定 Obsidian 插件目录（`OBSIDIAN_PLUGIN_DIR`）。

## Technical Context

**Language/Version**: TypeScript 5.9.x + Node.js 24.x  
**Primary Dependencies**: `obsidian`, `dayjs`, `esbuild`, `builtin-modules`  
**Storage**: N/A（仅文件系统中的插件产物）  
**Testing**: `tsc --noEmit`、构建产物验证（后续补充单元/集成测试）  
**Target Platform**: Obsidian Desktop 插件运行环境（Windows/macOS/Linux）  
**Project Type**: Monorepo package（desktop plugin package）  
**Performance Goals**: 本地构建在可接受开发时延内完成，构建后可直接加载插件  
**Constraints**: 需保留功能一致性；产物必须包含 `main.js/manifest.json/styles.css/versions.json`；支持可配置输出目录  
**Scale/Scope**: 单插件包迁移重构，涉及构建链、功能模块拆分、文档与任务补全

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP & modularity**: 采用 `src/features/*` + `src/utils/*` + `src/main.ts` 拆分，责任边界清晰，满足模块化原则。  
- **Errors / neverthrow**: 插件当前逻辑主要是 Obsidian API 事件回调与边界副作用，不构成独立业务域流水线；错误处理保持在边界层（Notice/回调）并未引入业务层异常控制流。  
- **Validation / valibot**: 本次迁移未新增外部输入协议层；后续如扩展 CLI/外部配置输入，需补 valibot。  
- **TDD**: 当前代码已完成迁移实现；在任务阶段补充“先测试后增量重构”的落地任务。  
- **TSDoc**: 关键纯函数可在后续 polish 阶段补齐 TSDoc。  
- **Stack & repo**: 遵循 Turborepo 与 `@cthutool/*` 命名约束。  
- **CI compatibility**: 产物链路可执行；`tsc` 依赖环境完整性受本地安装状态影响，不属于功能设计冲突。

**结论（Phase 0 前）**: 通过。  
**结论（Phase 1 后复检）**: 通过，无需宪章豁免。

## Project Structure

### Documentation (this feature)

```text
specs/009-obsidian-enhancer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── obsidian-enhancer.contract.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/obsidian-enhancer/
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── manifest.json
├── styles.css
├── versions.json
├── version-bump.mjs
├── README.md
└── src/
    ├── main.ts
    ├── setting-tab.ts
    ├── settings.ts
    ├── features/
    │   ├── open-in-eudic.ts
    │   ├── auto-move.ts
    │   ├── mark-reviewed.ts
    │   └── mark-easier.ts
    └── utils/
        └── tags.ts
```

**Structure Decision**: 采用单包分层（插件入口、功能模块、工具函数、构建脚本）结构，优先满足可维护性与功能可追踪性，同时与 monorepo 约定保持一致。

## Phase 0 Research Focus

1. 参考实现迁移时如何保持用户可见行为一致。  
2. 构建产物同步到指定 Obsidian 插件目录的稳定策略。  
3. 已知问题修复边界：目录匹配、标签健壮性、日志输出干扰。

## Phase 1 Design Outputs

1. **data-model.md**：定义设置、目录匹配、状态升级、产物集等核心实体。  
2. **contracts/obsidian-enhancer.contract.md**：定义插件行为与构建输出契约。  
3. **quickstart.md**：提供默认构建与指定目录直出验证步骤。  
4. **AGENTS.md 上下文同步**：将当前 plan 引用更新至 `specs/009-obsidian-enhancer/plan.md`。

## Complexity Tracking

无宪章违规项，无需豁免登记。
