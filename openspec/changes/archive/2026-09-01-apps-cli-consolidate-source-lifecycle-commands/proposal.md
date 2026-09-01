## Why

`chc source` 已经负责来源发现、选择和切换，但当前来源诊断与更新仍以顶层 `chc status`、`chc update` 暴露，导致同一生命周期分散在两个命令入口，用户也不容易理解 `source list` 与 `status` 的职责差异。

来源相关操作应集中在一个可发现的命令组中，同时为已有脚本保留稳定迁移路径，并且不借命令重组改变既有更新安全语义。

## What Changes

- **BREAKING** 将公开、规范的安装诊断与更新入口迁移为 `chc source status` 和 `chc source update`；顶层 help、shell completion 与文档不再把 `status`、`update` 作为规范入口。
- 将公开 `source` 命令组统一为 `list`、`status`、`use`、`update`、`register`：`list` 展示所有候选及 active 标记，`status` 深入诊断当前或显式指定的安装目录。
- 保留顶层 `chc status` 与 `chc update` 作为不可发现的兼容别名，在迁移期继续接受原有参数、执行相同行为，并维持原有 human、quiet、错误和退出码契约。
- 让规范路径的 JSON 成功对象使用 `command: "source status"` 与 `command: "source update"`，兼容别名继续使用 `command: "status"` 与 `command: "update"`，避免破坏已有机器调用方。
- `source update` 只迁移命令入口：继续复用既有 managed update 预检、锁、Git 目标解析、bundle 验证、全局安装、no-op 检测与显式 override 语义，不引入 selector 定向更新或隐式切换。
- 同步更新 root/source help、静态和动态 shell completion、安装与 source 文档、单元/集成测试以及 committed CLI bundle。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-source-switching`: 将安装诊断与更新纳入公开 source 命令组，明确 list/status 分工、命令发现、completion 与 route-specific JSON 契约。
- `apps-cli-self-installation`: 将规范 lifecycle 入口迁移到 `source status` 和 `source update`，保留顶层兼容别名并维持既有诊断、更新与安全行为。

## Impact

- `apps/cli/src/command/root.command.ts`、`source.command.ts` 与 self-update/status 命令注册：调整命令所有权并复用既有 handler，不复制业务逻辑。
- CLI 输出上下文与 JSON response envelope：根据实际调用路径生成稳定的 `command` 值，同时保持兼容别名原值。
- root/source help、shell completion、命令发现与相关 CLI 单元、集成测试。
- 根 README、CLI README、docs-site CLI/source/install/reference 页面及 committed `apps/cli/dist/index.js` bundle。
- 不改变 update 的 Git、bundle、锁、全局安装安全边界，不修改 OpenSpec-generated adapter trees 或受保护的 `codex/plugins/cthu-codex`。
