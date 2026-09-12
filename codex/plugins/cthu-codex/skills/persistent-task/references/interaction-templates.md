# Interaction Templates

Use concise, explicit messages. Adapt wording to the user's language. These are output shapes, not scripts to repeat verbatim.

## After creating a draft

```text
已创建持久任务：<path>
当前进行澄清和只读检查，尚未修改目标。

未决问题：
Q1. <question>
Q2. <question>

回答后我会更新 PLAN.md，并展示计划及首阶段。
```

## Initial plan and first phase preview

```text
PLAN.md 已完善，状态为 awaiting_plan_approval。

目标与范围：<goal, targets, exclusions>
完成标准：<observable DoD>
主要风险：<risks>
阶段安排：<short phase list>

首阶段 P1：<objective>
包含的工作：<related actions and bounded batch>
目标及排除项：<exact targets/exclusions>
预期结果与验证：<result and evidence>
风险、备份与回滚：<risk and recovery>

回复“继续”即可批准计划并启动上述 P1；P1 中列出的工作会连续执行并验证。
```

## Later phase preview

```text
下一阶段 P<n>：<objective>
包含的工作：<related actions and bounded batch>
目标及排除项：<exact targets/exclusions>
预期结果与验证：<result and evidence>
风险、备份与回滚：<risk and recovery>

PLAN.md 状态：awaiting_phase_approval。
回复“继续”即批准上述 P<n>；范围变化时我会重新展示，不沿用本次确认。
```

## Phase checkpoint

```text
P<n> 阶段结果：<success / partial / failed>
已完成的工作：<actual actions and targets>
验证：<PASS / FAIL / UNKNOWN + evidence>
问题与恢复：<residuals, rollback, or None>
PLAN.md / LOG.md：<current status and checkpoint event>

下一阶段计划 P<n+1>：<objective, included work, exact scope>
预期结果与验证：<result and checks>
风险、备份与回滚：<risk and recovery>

回复“继续”即可启动上面展示的下一阶段。
```

If there is no next phase, use the final report instead of asking to continue. Do not put the next-phase plan ahead of the completed-phase result.

## Decision required mid-phase

```text
P<n> 已暂停，状态为 blocked。

已完成及验证：<actual progress>
阻塞事实：<observed reality>
需要你的决定：<exact question>
选项及后果：<options and consequences>
当前目标状态：<partial changes and rollback status>

PLAN.md 和 LOG.md 已记录。请明确选择；单独回复“继续”不会替你作决定。
```

After a clear decision, finish the previously approved phase if its scope is unchanged. If the decision changes scope or risk materially, show a revised preview before acting.

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
