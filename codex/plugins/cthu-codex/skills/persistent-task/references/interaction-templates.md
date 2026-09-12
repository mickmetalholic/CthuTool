# Interaction Templates

Use concise, explicit messages. Adapt wording to the user's language.

## After creating a draft

```text
已创建持久任务：<path>
当前只进行澄清和只读检查，不修改目标。

未决问题：
Q1. <question>
Q2. <question>

回答后我会更新 PLAN.md；计划完善前不会执行目标变更。
```

## Plan approval

```text
PLAN.md 已完善，状态为 awaiting_plan_approval。

Goal: <goal>
Scope: <scope>
DoD: <short list>
Risk: <short list>
Plan: <phase list>

请确认计划：回复“确认计划，开始逐步执行”。
计划确认不等于任何具体步骤的执行确认。
```

## Step preview

```text
步骤 P<n>：<objective>

本步将：<exact action and scope>
目标：<paths/services/data>
预期结果：<observable result>
验证：<checks and evidence>
风险/回滚：<risk and rollback>

PLAN.md 已更新为 awaiting_step_approval。
请回复“执行 P<n>”。本次确认只授权上述步骤。
```

## Checkpoint

```text
P<n> 已执行并完成文档 checkpoint。

结果：<success / partial / failed>
验证：<PASS / FAIL / UNKNOWN + evidence>
PLAN.md：<current status>
LOG.md：已追加 <event>
残留问题：<None or list>

下一步预览：<next step or waiting reason>
当前暂停，等待你的确认。
```

## Decision required

```text
任务已暂停，状态为 blocked。

事实：<observed reality>
问题：<decision needed>
选项：
A. <consequence>
B. <consequence>
建议：<optional recommendation>

我已先更新 PLAN.md 和 LOG.md。请回复选项或给出明确决定；决定确认后仍会重新展示受影响的执行步骤。
```

## Final report

```text
任务状态：<completed / completed_with_followups / blocked>

已完成并验证：<DoD items + evidence>
实际修改：<targets>
错误/恢复：<summary>
回滚状态：<summary>
残留问题：<None or explicit list>
延期决策：<None or explicit list>
建议的后续任务：<None or list>
```
