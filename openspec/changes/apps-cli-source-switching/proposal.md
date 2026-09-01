## Why

`chc` 已经可以通过本地安装脚本或显式 `chc update --install-dir` 把全局命令重新链接到某个 checkout，但这些入口承担的是安装或更新语义，不适合在日常开发中频繁切换源码来源。当前 `chc status` 也只按路径把默认托管 checkout 标记为 `remote`，把主 checkout 和所有 Git worktree 都合并为 `local`，用户无法从 CLI 发现或选择具体 worktree。

这个仓库经常同时存在主 checkout、多个 Codex worktree 和默认托管 checkout。开发者需要一个不 fetch、不 checkout、不要求 worktree clean 的来源切换入口，以便直接测试某个 worktree 已生成的 `apps/cli/dist/index.js`，并能明确切回主 checkout 或 remote managed 来源。

## What Changes

- 新增公开的 `chc source` 命令组，提供 `list`、`current` 和 `use` 操作，并在交互式终端中支持目标选择。
- 建立兼容的来源分类：继续保留 `mode: local | remote`，同时增加 `sourceKind: main | worktree | managed`，不把 worktree 提升为破坏兼容性的第三种 mode。
- 从当前运行来源、当前工作目录和一个轻量的开发仓库锚点发现 CthuTool 主 checkout；使用 `git worktree list --porcelain` 动态枚举当前有效的 worktree，而不持久化易失效的 worktree 列表。
- 支持通过 `local`、`remote`、`.`、稳定 worktree selector 或显式路径选择目标；`local` 表示已登记开发仓库的主 checkout，`remote` 表示默认 managed checkout。
- 将来源切换与更新语义分离：切到 main 或 worktree 时只做本地校验和全局 npm 重链接，不 fetch、不切分支、不修改 worktree，也不因 dirty 状态阻塞。
- 切到已存在的 managed checkout 时只重链接，不隐式更新；managed checkout 缺失时仅在显式 `--bootstrap` 下复用安全的 managed install/update 流程。
- 为目标校验、跨进程切换锁、npm 重链接结果、失效 worktree 和 raw installer 恢复路径增加稳定的人类与 JSON 输出。
- 更新顶层帮助、动态 shell completion、CLI 状态、README 和 docs-site CLI 文档，并补充相应单元、集成和安装链接测试。

## Capabilities

### New Capabilities

- `apps-cli-source-switching`: 定义 CLI 来源发现、main/worktree/managed 分类、显式切换、安全边界、结构化输出和恢复行为。

### Modified Capabilities

- None. 现有 self-installation、update、command-discovery 和 shell-completion 契约保持兼容；本 change 以新增能力补充来源切换与状态细分，不改变既有更新语义。

## Impact

- `apps/cli/src/command`：新增 source 命令组并注册到顶层命令树。
- `apps/cli/src/domain` 和 `apps/cli/src/infra`：来源模型、Git worktree 发现、开发仓库锚点、切换锁、npm 重链接与校验。
- `apps/cli/src/domain/self-update-manager.ts`：抽取或复用运行来源、managed 根目录和全局安装边界；保持 `chc update` 的现有安全语义。
- `apps/cli/src/runtime`、command discovery 和 completion：新增稳定错误、JSON 结果、动态 source selector 候选。
- `apps/cli/tests`、installer/global-bin contract tests 和 committed `apps/cli/dist/index.js` bundle。
- 根 README、CLI README 和 docs-site CLI/reference 文档。
- 不修改 `codex/plugins/cthu-codex`，不修改或提交 OpenSpec-generated adapter trees。
