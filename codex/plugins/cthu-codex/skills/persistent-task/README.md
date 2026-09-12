# Persistent Task

一个仅在用户明确调用时启动的持久任务 Skill，用文件系统保存长时间、多步骤任务的状态。共享流程可供 Codex 和 Hermes 使用；本目录随 CthuCodex 插件发布。

## 调用

Codex 插件使用：

```text
$cthu-codex:persistent-task 配置完整开发环境
$cthu-codex:persistent-task resume my-task
$cthu-codex:persistent-task status my-task
```

独立安装的 Codex 用户 Skill 可能使用 `$persistent-task`。Hermes 用户 Skill 使用 `/persistent-task`；如果安装时指定了命名空间，应使用实际注册名。调用差异见 `references/codex-adapter.md` 和 `references/hermes-adapter.md`。将本 Skill 纳入 Codex 插件不会自动安装到 Hermes。

Codex 的 `agents/openai.yaml` 禁止隐式调用：

```yaml
policy:
  allow_implicit_invocation: false
```

Skill 会在目标 workspace 下创建：

```text
.agent/tasks/<task-id>/PLAN.md
.agent/tasks/<task-id>/LOG.md
```

执行顺序是：

```text
创建计划
→ 澄清问题
→ 展示计划和首阶段
→ 用户输入“继续”批准计划及首阶段
→ 连续执行阶段内工作并验证
→ 更新 PLAN.md 与 LOG.md
→ 先总结本阶段结果，再概述下一阶段
→ 用户输入“继续”启动下一阶段
```

只输入 Skill 调用名时仅显示用法，不读取目标、不创建文件、不执行命令。

## 核心规则

- 每个有明确范围的阶段只需一次确认；阶段内已展示的工作自主执行，无需逐项确认。
- 每个阶段结束、阻塞或中断时更新文档状态；用户只需对下一阶段回复“继续”。
- 中途只有需要用户决策、范围或风险发生实质变化、出现未纳入阶段的外部操作时才暂停。
- 命令成功不等于任务完成，必须验证真实状态。
- 现实状态优先于旧计划；不一致时先修复计划。
- 问题、部分成功、失败、延期和用户决策都要记录。
- 最终报告必须列出残留问题、未知状态和延期事项。

详细模板和验收场景见 `references/`。
