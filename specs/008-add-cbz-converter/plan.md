# Implementation Plan: 批量 PDF/ePub 转 CBZ 工具

**Branch**: `008-add-cbz-converter` | **Date**: 2026-04-17 | **Spec**: `specs/008-add-cbz-converter/spec.md`  
**Input**: 功能规格来自 `specs/008-add-cbz-converter/spec.md`

## Summary

在 `@cthutool/cli` 新增可由 `scripts` 命令触发的批量转换能力：递归扫描目录中的 PDF/ePub，按相对路径映射输出 `.cbz` 到 `.output`。  
核心技术策略采用“转换器接口 + 格式专用实现 + 统一调度与日志层”，其中 PDF 默认且唯一采用 Poppler CLI（`pdfinfo` + `pdftoppm`）链路，ePub 采用“直接提取优先，浏览器渲染兜底”的混合策略，以平衡性能、质量和兼容性。

## Technical Context

**Language/Version**: TypeScript 5.9.x（Bun 运行时，Node 兼容 API）  
**Primary Dependencies**: `citty`, `@clack/prompts`, `neverthrow`, `valibot`, `cli-progress`, `picocolors/chalk`, `archiver`, `p-limit`, `fflate`（或同类 zip 读写库）, `puppeteer`（仅 ePub 兜底）, Node `child_process`（执行 `pdfinfo`/`pdftoppm`）  
**Storage**: N/A（仅本地文件系统，临时目录 + 输出目录）  
**Testing**: `bun test`（单元测试）+ CLI 集成测试（fixtures）  
**Target Platform**: Windows/macOS/Linux 桌面终端环境  
**Project Type**: CLI 子命令（`@cthutool/cli` 下 scripts 扩展）  
**Performance Goals**: 100 文件批处理可持续执行；单文件失败不阻塞全局；总体吞吐受控且可配置并发  
**Constraints**: 必须保留相对目录结构；输出页序稳定；并发模式下需同时展示多个活跃文件子进度；优先复用现有进度组件并保证日志不打断进度 UI；Puppeteer 作为重资源组件需限制实例数；程序启动前必须通过 Poppler 依赖检查（`pdfinfo`/`pdftoppm`）  
**Scale/Scope**: 面向本地离线批量转换，典型规模 10~1000 文件，PDF/ePub 混合输入

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP & modularity**: 通过“扫描/调度/转换/打包/日志”分层，核心业务函数保持纯函数输入输出，副作用集中在 I/O 适配层。  
- **Errors (neverthrow)**: 计划中业务流程统一返回 `Result`/`ResultAsync`；错误建模为领域错误值，不在业务层抛异常。  
- **Validation (valibot)**: CLI 参数、交互输入、配置对象全部使用 `valibot` 校验。  
- **TDD**: 先写失败用例覆盖扫描映射、页序命名、失败不中断、并发限制，再实现。  
- **TSDoc**: 对核心纯函数（页序归一、任务映射、策略决策）补充 `@param/@returns`。  
- **CI compatibility**: 设计不引入违背 Biome/tsc/knip/commitlint/test 的流程。

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
└── contracts/
    └── cli-convert-contract.md
```

### Source Code (repository root)

```text
apps/cli/src/
├── command/
│   └── run-scripts.command.ts
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
│       │   └── errors.ts
│       ├── infrastructure/
│       │   ├── dependencies/check-poppler.ts
│       │   ├── scanners/file-scanner.ts
│       │   ├── converters/pdf-converter.ts
│       │   ├── converters/epub-converter.ts
│       │   ├── renderers/epub-renderer-pool.ts
│       │   ├── packagers/cbz-archiver.ts
│       │   ├── logging/progress-logger.ts
│       │   └── logging/progress-view-model.ts
└── tests/
    └── scripts/
        └── convert-to-cbz/
        ├── unit/
        └── integration/
```

**Structure Decision**: 选择“脚本包”结构，统一放在 `apps/cli/src/scripts`。每个脚本包包含 `script.json`（元信息）与 `index.ts`（执行入口）；`scripts` 子命令仅负责脚本发现和分发，具体业务在 `scripts/convert-to-cbz` 内按 clean layering 组织（`application/domain/infrastructure`），满足 SRP 与可测试性要求。

## Phase 0 Research Focus (resolved)

1. PDF 技术路线：外部 CLI（Poppler）作为唯一方案的可行性与约束  
2. ePub 技术路线：章节截图 vs 原始图片提取 + 兜底渲染  
3. 并发与资源管理：普通任务并发池 + 重资源组件单例复用

## Phase 1 Design Decisions (key)

1. **PDF 最终建议**: 默认且唯一采用 Poppler CLI：`pdfinfo` 获取页数，`pdftoppm` 一次性批量转图；启动阶段必须做依赖预检，缺失时终止并给出分平台安装指引。  
2. **ePub 最终建议**: 采用“提取优先，渲染兜底”的两阶段策略；当章节可直接映射到有序图片资源时跳过截图。  
3. **架构建议**: 统一 `Converter` 接口，`PdfConverter` 与 `EpubConverter` 以相同契约接入调度器。  
4. **并发建议**: 全局文件并发默认 `min(cpuCount, 4)`；Puppeteer 全局单浏览器实例 + 页面池上限 1~2。  
5. **进度展示建议**: 使用 `MultiBar` 展示 1 条总体进度 + `fileConcurrency` 条动态子进度（仅显示当前活跃任务），任务完成后复用子进度槽位给后续文件。
6. **PDF 进度策略**: 每个 PDF 文件先调用 `pdfinfo` 设定总页数，再一次性调用 `pdftoppm` 执行转换；转换阶段保持稳定进度条可见（不使用 spinner），成功后将该文件进度条直接更新到总页数，避免逐页创建进程。
7. **命令安全策略**: 外部命令参数必须做安全处理；文件路径必须正确引用/转义，用户输入参数（如 `--dpi`）必须先做数值校验再传入命令。
8. **UI 稳定性策略**: 复用现有 `cli-progress`/`MultiBar` 组件，不新增自定义进度渲染器；运行期日志采用缓冲或统一输出通道，禁止直接 `console.log` 打断进度条重绘。

## Complexity Tracking

无宪章违规项，无需登记豁免。
