# Implementation Plan: CLI Welcome Greeting Demo

**Branch**: `005-cli-greeting-demo` | **Date**: 2026-04-09 | **Spec**: `specs/005-cli-greeting-demo/spec.md`  
**Input**: Feature specification from `specs/005-cli-greeting-demo/spec.md`

## Summary

在 `apps/cli` 新增 Bun 驱动的演示型命令行应用，使用 Citty 组织命令入口与路由，`@clack/prompts` 完成姓名收集与校验，`boxen` + `picocolors` 负责静态欢迎面板，`React` + `Ink` + `ink-spinner` 负责 2 秒动态加载与最终界面保留渲染，满足完整交互链路与模块拆分要求。

## Technical Context

**Language/Version**: TypeScript 5.9.x（运行时 Bun）  
**Primary Dependencies**: Bun、citty、@clack/prompts、boxen、picocolors、react、ink、ink-spinner、valibot、neverthrow  
**Storage**: N/A（单次 CLI 会话，无持久化）  
**Testing**: bun test（单元测试 + 交互流程级测试）  
**Target Platform**: 交互式终端（Windows/macOS/Linux，支持 TTY）  
**Project Type**: CLI 子应用（Turborepo monorepo 下 `apps/cli`）  
**Performance Goals**: 加载态稳定 2.0s +/- 0.2s；冷启动后可在 1s 内进入首屏欢迎面板  
**Constraints**: 必须无命令参数启动主流程；空白输入必须阻止继续；低色彩终端需可读退化  
**Scale/Scope**: 单命令演示闭环（欢迎 -> 输入 -> 清屏/加载 -> 结果）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP & modularity**: 通过 `render`/`domain`/`flow` 分层与纯函数优先设计通过；副作用集中在 CLI 适配层。  
- **Errors (neverthrow)**: 输入校验、流程状态推进、渲染前数据构建均返回 `Result`；通过。  
- **Validation (valibot)**: 用户输入边界统一用 valibot schema；通过。  
- **TDD**: 先写失败测试（空输入、trim、状态顺序、2 秒加载），再实现；通过。  
- **TSDoc**: 纯函数与核心业务函数补齐 `@param` / `@returns`；通过。  
- **Stack constraints**: Bun 脚本与测试符合宪法脚本工具栈要求；通过。  
- **CI compatibility**: 设计保持 Biome / tsc / Knip / Commitlint / bun test 可执行；通过。  

## Project Structure

### Documentation (this feature)

```text
specs/005-cli-greeting-demo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-flow.contract.md
└── tasks.md  # 由 /speckit.tasks 生成
```

### Source Code (repository root)

```text
apps/
└── cli/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts                  # 入口，仅做启动与退出码映射
    │   ├── command/
    │   │   └── greet.command.ts      # Citty 命令定义与路由
    │   ├── flow/
    │   │   └── run-greeting-flow.ts  # 编排流程（副作用边界）
    │   ├── domain/
    │   │   ├── name-schema.ts        # valibot 校验
    │   │   └── greeting-message.ts   # 纯函数
    │   ├── ui/
    │   │   ├── welcome-panel.ts      # boxen + picocolors 静态面板
    │   │   └── app.tsx               # Ink 结果界面
    │   └── infra/
    │       ├── prompt-name.ts        # @clack/prompts 适配
    │       └── loading-screen.tsx    # Ink + ink-spinner 2 秒加载
    └── tests/
        ├── unit/
        └── integration/
```

**Structure Decision**: 选择 `apps/cli` 单应用分层结构，确保入口、命令路由、业务逻辑、终端适配、UI 渲染职责解耦，满足 FR-009 与宪法 SRP 要求。

## Phase 0 Research Focus

- Bun 在 monorepo CLI 的执行、测试、脚本约定  
- Citty 命令路由组织与参数策略（本特性无必需参数）  
- Ink 渲染循环与加载态并存策略（保留欢迎面板到最终界面）  
- `@clack/prompts` 输入反馈文案与重试体验  
- `boxen` + `picocolors` 在低色彩终端的降级策略

## Post-Design Constitution Check

- 设计产物（数据模型、契约、快速开始）均保持函数式与模块边界约束。  
- 无需引入违反宪法的例外项。  
- **结论**: 通过，无需 Complexity Tracking 记录。

## Complexity Tracking

无宪法违规项。
