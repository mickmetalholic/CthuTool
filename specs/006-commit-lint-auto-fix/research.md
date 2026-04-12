# Phase 0 研究：lint-staged + Biome 提交门禁

## 1. 是否采用 lint-staged

- **决策**：采用 **lint-staged** 作为 pre-commit 的统一入口，由它调度对暂存文件的 Biome 写入式检查。
- **理由**：
  - 与 Husky 生态标准集成，减少手写 `git diff --cached` 脚本。
  - 对任务修改的文件 **自动重新加入暂存区**（lint-staged 默认行为），满足 spec FR-002「自动修复须进入同一提交」。
  - 仅对匹配的暂存路径运行命令，符合 FR-006「标准开发者工作流一致」的可复制安装方式（`pnpm install` + `prepare` 安装 husky）。
- **备选**：
  - 保留手写 shell：已存在但需自行维护 `git add`、跨平台引号与多语言扩展名列表。
  - Lefthook / pre-commit 框架：引入新配置体系，与当前 husky + pnpm 栈重复，迁移成本高。

## 2. Biome 调用方式：`--write` 与路径范围

- **决策**：在 lint-staged 任务中执行 **`pnpm exec biome check --write`**，匹配模式限定为 **`{apps,packages}/**/*`**（或与 `biome.jsonc` 一致的子路径），由 lint-staged 将**当前暂存文件列表**作为参数传入；不叠加 **`--unsafe`**，除非后续政策明确允许。
- **理由**：
  - `biome check --write` 会应用安全修复、格式化与 import 排序（与仓库 `lint:fix` 语义一致）。
  - 与当前 pre-commit 仅关注 `apps/`、`packages/` 的范围一致（见现有 `.husky/pre-commit`）。
- **备选**：
  - **`biome check --write --staged`**：由 Biome 直接读取 Git 暂存区；与 lint-staged 组合时需避免「重复传参/重复扫描」；若采用需保证 pre-commit 只运行一次且仍由 lint-staged 负责回写暂存区。当前推荐 **lint-staged 传文件列表 + `--write`**，语义更直观。
- **说明**：Biome CLI 提供 `--staged`（仅暂存文件），已在本地 `biome check --help` 中确认；详见 Phase 1 契约中的命令约束。

## 3. 与 CI 的一致性

- **决策**：CI 保持 **`pnpm run lint` → `biome check .`**（全仓库）；本地 pre-commit 为 **增量 + 写入**，合并前 PR 仍受全量检查约束。
- **理由**：spec 要求本地不削弱门禁；全量 CI 可捕获「未暂存但已修改」等边界问题；本地则以低摩擦修复为主。
- **备选**：在 CI 使用 `biome check --changed`（需配置默认分支）— 可作为后续优化，非本特性必选项。

## 4. Commitlint 与执行顺序

- **决策**：保留 **`.husky/commit-msg`** 调用 `commitlint`；**不在 pre-commit 中**运行 commitlint（Git 钩子阶段：pre-commit 先于 commit-msg）。
- **理由**：符合 spec User Story 3：消息校验在提交消息写入后执行，且与现有仓库一致。

## 5. 部分暂存（partial staging）与 spec 边界情况

- **决策**：在 `research.md` 中明确：**Biome 按文件级写入**；若使用 `git add -p` 导致同一文件既有暂存又有未暂存块，格式化可能影响整文件，可能将未暂存块一并变更。默认策略与 spec「默认仅修正参与提交尝试的路径」一致为**文件级**；进阶行为（仅格式化暂存块）超出本特性范围。
- **理由**：与多数 formatter/linter 行为一致；可通过文档在 `quickstart.md` 提示。

## 6. Context7 说明

- 本次会话中 Context7 MCP **未连接**，未拉取线上 lint-staged 文档；技术结论基于仓库内 Biome CLI 帮助信息、lint-staged 常见用法与当前 Husky 脚本。实施时建议在连接 Context7 或查阅 [lint-staged 官方文档](https://github.com/lint-staged/lint-staged) 后核对 `lint-staged` 主版本与 Node 兼容性。
