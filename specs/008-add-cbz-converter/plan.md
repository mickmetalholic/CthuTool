# Implementation Plan: 批量 PDF/ePub 转 CBZ 工具

**Branch**: `008-add-cbz-converter` | **Date**: 2026-04-22 | **Spec**: `specs/008-add-cbz-converter/spec.md`  
**Input**: Feature specification from `specs/008-add-cbz-converter/spec.md`

## Summary

在 `@cthutool/cli` 新增可由 `scripts` 命令触发的批量转换能力：递归扫描目录中的 PDF/ePub，输出保留相对路径结构的 `.cbz`。  
本次规划重点补强终端可观测性与展示一致性：活跃文件进度条可复用、全局/当前进度条颜色区分、进度显示不被日志打断，以及英文且美观的彩色总结报告。

## Technical Context

**Language/Version**: TypeScript 5.9.x（Bun 运行时，Node 兼容 API）  
**Primary Dependencies**: `citty`, `@clack/prompts`, `neverthrow`, `valibot`, `cli-progress`, `picocolors/chalk`, `archiver`, `p-limit`, `puppeteer`, Node `child_process`  
**Storage**: N/A（仅本地文件系统，临时目录 + 输出目录）  
**Testing**: `bun test`（单元 + 集成）  
**Target Platform**: Windows/macOS/Linux 桌面终端  
**Project Type**: CLI 脚本子包（`apps/cli/src/scripts/convert-to-cbz`）  
**Performance Goals**: 100 文件批次在 60 秒内完成扫描并启动首个转换（SC-001）  
**Constraints**: 进度条不可被日志打断；全局与当前进度条颜色不同；当前进度条显示相对路径且仅显示活跃任务；总结为英文、结构化、可带 emoji 且多色状态  
**Scale/Scope**: 本地离线批量处理，典型 10~1000 文件，混合 PDF/ePub

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP & modularity**: 采用 `application/domain/infrastructure` 分层，纯函数（路径映射、策略决策、进度视图映射）与副作用适配器分离。  
- **Errors (neverthrow)**: 业务流程保持 `Result/ResultAsync` 组合，避免在业务层抛异常。  
- **Validation (valibot)**: CLI 参数与输入边界校验统一走 `valibot`。  
- **TDD**: 先测试后实现，覆盖扫描、映射、进度显示、失败不中断、总结输出。  
- **TSDoc**: 纯函数与核心流程函数补齐 `@param/@returns`。  
- **CI compatibility**: 设计不引入与 Biome/tsc/Knip/Commitlint/test 冲突的流程。  

**结论（Phase 0 前）**: 通过，无需豁免。  
**结论（Phase 1 后复检）**: 通过，无新增宪章冲突。

## Project Structure

### Documentation (this feature)

```text
specs/008-add-cbz-converter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-convert-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/cli/src/
├── scripts/
│   ├── index.ts
│   └── convert-to-cbz/
│       ├── script.json
│       ├── index.ts
│       ├── application/
│       │   ├── run-conversion-job.ts
│       │   └── schedule-tasks.ts
│       ├── domain/
│       │   ├── converter.ts
│       │   ├── conversion-types.ts
│       │   ├── errors.ts
│       │   ├── option-schema.ts
│       │   ├── path-mapping.ts
│       │   └── strategy.ts
│       └── infrastructure/
│           ├── dependencies/check-poppler.ts
│           ├── scanners/file-scanner.ts
│           ├── converters/pdf-converter.ts
│           ├── converters/epub-converter.ts
│           ├── renderers/epub-renderer-pool.ts
│           ├── packagers/cbz-archiver.ts
│           └── logging/
│               ├── progress-view-model.ts
│               └── progress-logger.ts
└── tests/
    └── scripts/convert-to-cbz/
        ├── unit/
        └── integration/
```

**Structure Decision**: 选择脚本包内分层架构，`application` 负责编排，`domain` 保持纯业务规则，`infrastructure` 承担 I/O 与终端输出副作用；该结构满足 SRP、FP 与可测试性，并便于持续扩展格式转换器。

## Phase 0 Research Focus

1. 终端输出通道如何做到“进度条不被打断”并兼容并发任务。  
2. 彩色语义映射策略：全局进度、当前进度、info/success/warn/error 与英文总结风格一致性。  
3. 在不同终端宽度与颜色支持能力下，如何保证相对路径显示可读与可访问。

## Phase 1 Design Outputs

1. **data-model.md**：补充进度显示与总结展示相关实体约束（ProgressSlot、FailureRecord、ConversionJob）。  
2. **contracts/cli-convert-contract.md**：补充输出合同，明确“单一渲染通道、不混用 `console.log`、全局/当前进度条颜色区分、英文彩色总结格式”。  
3. **quickstart.md**：补充验证步骤，验证相对路径展示、活跃槽位复用、英文多色总结与日志不打断。  

## Complexity Tracking

无宪章违规项，无需登记豁免。
