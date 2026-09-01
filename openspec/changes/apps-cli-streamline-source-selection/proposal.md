## Why

`chc source` 已经能够发现和切换 main、worktree 与 managed 来源，但当前命令面仍暴露重复的 `current` 操作，交互选择会静默隐藏尚未安装的 remote，而 `list` 的默认输出又突出内部可用性字段和冗长绝对路径，导致用户难以快速理解当前来源以及下一步操作。

来源选择应围绕“查看候选并切换”形成一个一致、可预期的体验：用户明确选择 remote 时，如果 managed checkout 尚不存在，CLI 应安全创建后完成切换；如果目标已经存在，则仍不得借切换之名隐式更新或覆盖异常目录。

## What Changes

- **BREAKING** 从公开 `chc source` 命令组移除 `current`；human 和 JSON 调用方统一从 `source list` 的 active 标记或顶层 `active` 字段读取当前来源，安装诊断继续使用 `chc status`。
- 让交互式 `chc source use` 始终展示 remote 候选；managed checkout 不存在时明确标记为尚未安装，而不是把候选静默过滤掉。
- 改为由 `chc source use remote` 在 managed checkout 真正缺失时自动复用安全的 managed install 流程，安装成功并验证 committed bundle 后再切换全局命令。
- 保持已有 managed checkout 的切换为纯本地重链接，不 fetch、不更新 ref；路径已存在但不是有效 checkout、缺少 bundle 或处于其他异常状态时，不自动覆盖或修复。
- **BREAKING** 移除 `source use --bootstrap` 的公开刷新语义；managed source 的已有 checkout 更新继续由专门的 `chc update` 流程承担。
- 保留现有顶层 `chc status` 与 `chc update` 生命周期入口；将二者迁入 `chc source`、定义顶层兼容别名并调整相关 JSON 命令标识属于后续独立变更，不与本次已完成的 source 选择行为混合交付。
- 重做 `source list` 与交互式 `source use` 的共享 human 候选展示：突出 selector、active/ready/not-installed 状态和 source kind，使用 `~` 缩短 home 路径，避免重复或泄漏内部判断，并为不可直接使用的状态提供下一步提示。
- 保留 `source list --json` 的完整结构化 candidate 信息，包括顶层 active source、规范路径、bundle 与可用性字段；同步更新帮助、completion、文档与测试。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-source-switching`: 精简 source 命令面，定义缺失 managed source 的选择即安装行为，并统一 list 与交互选择的候选展示和安全边界。

## Impact

- `apps/cli/src/command/source.command.ts`：移除 `current` 注册和输出，统一 list/use human renderer，并调整 remote 的交互候选行为。
- `apps/cli/src/domain/cli-source-manager.ts` 及 self-update 复用边界：仅对真正不存在的 managed checkout 执行安全安装，保留已有或异常目录的非覆盖约束。
- CLI command discovery、shell completion、source/status 单元与集成测试、committed `apps/cli/dist/index.js` bundle。
- 根 README、CLI README 与 docs-site CLI/reference 页面中的 source 命令、managed 安装和恢复说明。
- 不修改 OpenSpec-generated adapter trees 或受保护的 `codex/plugins/cthu-codex`。
