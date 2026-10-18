# Persistent Task

仅在用户明确调用时启动的持久任务 Skill，用文件保存长期任务的计划、授权和执行证据。共享流程适用于分别安装后的 Codex 和 Hermes；本目录随 CthuCodex 插件发布。

## 调用

Codex 插件使用：

```text
$cthu-codex:persistent-task 配置完整开发环境
$cthu-codex:persistent-task resume my-task
$cthu-codex:persistent-task status my-task
```

独立安装的 Codex 用户 Skill 可能使用 `$persistent-task`；Hermes 通常使用 `/persistent-task`，以实际注册名为准。调用差异见 `references/codex-adapter.md` 和 `references/hermes-adapter.md`。安装 Codex 插件不会自动安装 Hermes Skill。

`agents/openai.yaml` 保留 `allow_implicit_invocation: false`。只输入调用名时仅显示用法，不读取目标、不创建文件、不执行命令。

任务状态保存在目标 workspace：

```text
.agent/tasks/<task-id>/PLAN.md
.agent/tasks/<task-id>/LOG.md
```

## 执行方式

1. 先自行完成可用的只读调查，把需要用户决定的范围、取舍、风险、恢复方式和完成标准尽量前置确认。
2. 优先制定一个完整执行阶段，涵盖预检、实施、纠错、恢复和最终验证。能提前约定的条件分支，在同一阶段内处理。
3. 已有明确授权就记录并沿用；尚未授权的具体执行范围，展示后确认一次。
4. 连续执行所有当前可执行的已授权工作。检查点保存进度并继续，不要求每个步骤或阶段结束后回复“继续”。
5. 只有必须由用户决定、且需要先执行才能取得证据、无法通过前置调查或条件规则解决的依赖，才拆分阶段。

阶段数量不固定。多种工具、大量批次和验收检查都可以属于同一个完整阶段。

## 决策、恢复与续接

- 普通报错或验证失败时，先检查真实状态，在授权范围内尝试合理修复并重新验证。
- 有冲突或待决事项时，保留相关目标、暂停依赖工作，先完成不会影响该决策的独立工作。
- 剩余工作确实需要用户决策、缺少外部权限或前置条件时，记录证据、具体选项和建议后再停下。
- 范围或影响实质扩大、未授权的外部操作需要明确授权；用户已明确批准的具体变更无需再重复确认。
- 恢复任务时核对 PLAN、LOG 和真实状态，继续已授权的剩余工作，不盲目重放操作。
- 旧任务只批准了 P1，就仍只覆盖 P1；升级 Skill 不会扩大历史授权。

最终结果必须有真实验证证据，并说明残留、未知和延期事项。详细模板和行为验收场景见 `references/`。
