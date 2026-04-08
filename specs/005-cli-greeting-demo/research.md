# Phase 0 Research - CLI Welcome Greeting Demo

## 决策 1：运行时与包管理统一使用 Bun

- **Decision**: 在 `apps/cli` 统一使用 Bun 作为运行时、脚本执行器、测试与包管理工具。  
- **Rationale**: 与宪法脚本工具栈一致；单工具链可降低脚本分歧，`bun test` 可直接支持 TDD 工作流。  
- **Alternatives considered**:
  - Node.js + npm/pnpm：可行，但与本需求“运行时与包管理使用 Bun”不一致。
  - Node.js 运行 + Bun 仅包管理：工具链分裂，调试与 CI 复杂度更高。

## 决策 2：命令路由采用 Citty createMain + 子命令模式

- **Decision**: 使用 Citty 的主命令 + 子命令结构，当前实现 `greet` 主流程并预留后续扩展。  
- **Rationale**: Citty 的轻量参数解析与命令组合天然适配 CLI 演示与后续扩展，不引入多余框架复杂度。  
- **Alternatives considered**:
  - 手写 `process.argv`：可控但可维护性差，缺少声明式路由结构。
  - Commander/Yargs：生态成熟，但超出当前极简演示需求。

## 决策 3：输入采集使用 @clack/prompts，并在边界层做 valibot 校验

- **Decision**: 交互询问使用 `@clack/prompts`，对输入做 `trim` 后用 valibot 校验非空。  
- **Rationale**: 可直接提供交互式体验与反馈；valibot 满足宪法统一校验要求；失败时循环提示无需重启。  
- **Alternatives considered**:
  - Node readline：交互反馈弱，校验与 UI 反馈需自行搭建。
  - Inquirer：能力更全但重量更高，不符合演示项目轻量目标。

## 决策 4：静态与动态界面分离（boxen/picocolors + React/Ink/ink-spinner）

- **Decision**:  
  - 静态欢迎块：`boxen` + `picocolors`。  
  - 动态加载与最终界面：`React` + `Ink` + `ink-spinner`。  
- **Rationale**: 静态内容和动态渲染分离有助于保持 SRP；Ink 状态切换可自然承载 2 秒加载和最终保留欢迎块。  
- **Alternatives considered**:
  - 全程纯 ANSI 手写：实现成本高，状态管理和可维护性差。
  - 全程仅 Ink：可行，但前置面板样式与快速文本渲染可读性不如 boxen/picocolors 组合直接。

## 决策 5：流程编排采用“纯函数状态 + 副作用适配器”

- **Decision**: 将业务状态推进与消息构建设计为纯函数，提示输入、清屏、渲染等操作放在 `infra`/`flow` 边界层，并通过 neverthrow 组合错误。  
- **Rationale**: 满足 FP 宪法并便于单测覆盖；让演示流程更容易做回归测试。  
- **Alternatives considered**:
  - 在单文件中顺序执行全部逻辑：开发快，但测试与扩展成本高。
  - 直接抛异常控制流程：违反 neverthrow 约束。

## 调研说明（Context7）

- 已通过 Context7 成功解析关键库标识：`/oven-sh/bun`、`/unjs/citty`、`/vadimdemedes/ink`。  
- 尝试拉取文档细节时接口返回 `Not connected`，因此本轮以需求约束 + 既有规范先完成规划文档。  
- 在实现阶段若 Context7 可用，需补充对 API 细节（特别是 Ink 生命周期与 clack 交互中断处理）的二次核验。
