# Persistent Task

用 PLAN.md 和 LOG.md 保存长期任务的计划、授权和执行证据。用户明确调用后启动，共享流程适用于分别安装后的 Codex 和 Hermes。

## 调用

```text
$cthu-codex:persistent-task 配置完整开发环境
$cthu-codex:persistent-task resume my-task
$cthu-codex:persistent-task status my-task
```

独立 Codex Skill 通常使用 `$persistent-task`，Hermes 通常使用 `/persistent-task`，以实际注册名为准。安装方式见 [Codex](references/codex-adapter.md) 和 [Hermes](references/hermes-adapter.md) 适配说明。仅输入调用名时显示用法。

任务文件位于目标 workspace：

```text
.agent/tasks/<task-id>/PLAN.md
.agent/tasks/<task-id>/LOG.md
```

## 工作方式

1. 先调查可查事实，前置确认用户取舍、范围、条件规则和完成标准。
2. 优先用一个完整阶段完成实施、纠错、恢复和验收。必须先执行才能形成的用户决策，才构成阶段边界。
3. 记录并沿用已有授权；缺少授权时，展示具体执行范围并确认一次。
4. 持续执行已授权工作，检查点保存进度后继续。普通错误先尝试范围内修复，局部冲突先保留并处理独立工作。
5. 剩余工作依赖用户决策、外部权限或前置条件时，带着证据、选项和建议请求输入。
6. 续接时核对文件和真实状态，沿用原授权范围。旧任务仅授权 P1 时，续接仍只覆盖 P1。

最终报告说明验证结果、实际修改、恢复状态和残留事项。

[主规则](SKILL.md) · [PLAN 模板](references/plan-template.md) · [LOG 模板](references/log-template.md) · [交互模板](references/interaction-templates.md) · [验收场景](references/examples-and-tests.md)
