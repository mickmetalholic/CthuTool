# Phase 0 Research - CLI 脚本发现与执行

## 决策 1：脚本包目录与固定文件名

- **Decision**: 在 `apps/cli/src/scripts/<script-id>/` 下固定使用 `script.json`（元数据）与 `index.ts`（入口）。`<script-id>` 与元数据中的稳定标识符一致，采用 **kebab-case**（与常见 CLI 标识一致）。  
- **Rationale**: 用户明确要求「每文件夹一脚本、入口 index.ts、单独 JSON 元数据」；固定文件名降低发现逻辑分支，便于文档与测试。  
- **Alternatives considered**:
  - 自由命名 JSON：发现成本高，易出错。  
  - 元数据放在包外集中管理：与「每包自描述」及贡献者故事不一致。

## 决策 2：元数据字段与校验

- **Decision**: `script.json` 至少包含：`id`（与目录名相同）、`title`、`description`（可选字段在 schema 中显式列出默认值规则）。全部经 valibot 解析，失败时收集路径级错误信息（不崩溃静默）。  
- **Rationale**: 满足 FR-003、FR-006；与宪法 valibot 一致。  
- **Alternatives considered**:
  - 仅依赖文件夹名无 JSON：无法满足「机器可读元信息」与列表展示需求。

## 决策 3：入口模块契约

- **Decision**: `index.ts` 必须提供**默认导出**，类型为 `() => Promise<void>` 或 `() => void`（异步优先）。运行器在动态加载后调用默认导出。  
- **Rationale**: 单一约定便于动态 import，无需猜测命名导出。  
- **Alternatives considered**:
  - 仅命名导出 `run`：可行但需约定导出名，默认导出更直观。  
  - 子进程执行 `bun index.ts`：进程开销大，且与「CLI 统一调度」重复。

## 决策 4：CLI 子命令行为

- **Decision**: 新增子命令（名称实现阶段最终确定，例如 `scripts` 或 `run-script`）：  
  - 提供可选参数指定脚本 `id`（例如 `--script <id>` 或位置参数，二选一在实现契约中锁定）。  
  - 未指定且 stdin 为 TTY 时，使用 `@clack/prompts` 的 `select` 列出合法脚本。  
  - 未指定且非 TTY：返回明确错误与用法，提示必须指定脚本标识。  
- **Rationale**: 满足 FR-004 与 Edge Cases；与现有 `@clack/prompts` 依赖一致。  
- **Alternatives considered**:
  - 始终交互：非 TTY CI 场景不可用。  
  - 始终要求参数：牺牲「从列表选择」的易用性。

## 决策 5：错误与退出码

- **Decision**: 业务链使用 neverthrow；CLI 顶层将 `Err` 映射为 `stderr` 消息与非零 `process.exitCode`；脚本入口若返回 rejected Promise，视为执行失败并传递非零退出码。  
- **Rationale**: 符合宪法 II；满足 FR-006。  
- **Alternatives considered**:
  - 抛异常贯穿：违反项目规范。

## 决策 6：用户直接用 Bun 执行入口

- **Decision**: 文档中说明：`bun run path/to/apps/cli/src/scripts/<id>/index.ts`（或从仓库根/包根的等价路径），不强制经过 CLI 子命令。  
- **Rationale**: 用户明确要求「可通过 bun 直接跑某个脚本」。  
- **Alternatives considered**:
  - 仅允许通过 CLI 调用：与需求冲突。

## 调研说明（Context7）

- 已尝试通过 Context7 MCP 解析 **citty**、**bun** 相关文档；当前环境返回 `fetch failed` / `Not connected`，未能拉取在线文档片段。  
- 技术选型基于仓库既有依赖（`apps/cli/package.json`）、宪法与 `005-cli-greeting-demo` 实践；实现阶段建议在 Context7 可用时复核 Citty 子命令参数 API 与 Bun 动态 import 路径解析细节。
