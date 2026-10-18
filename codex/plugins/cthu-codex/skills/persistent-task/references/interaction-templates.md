# Interaction templates

Use these shapes as needed, in the user's language. Omit empty or irrelevant fields. Execution rules are in [SKILL.md](../SKILL.md).

## Material question

```text
已查明：<facts and evidence>
需要确定：<unresolved choice>
建议：<recommended option and consequences>
```

## Execution preview requiring authorization

```text
目标与范围：<outcome, targets/actions/exclusions>
完成标准：<observable DoD>
完整阶段：<implementation, recovery, final checks>
风险与恢复：<impact limits, backup/recovery>
分支规则与暂停条件：<agreed policies and actual dependencies>

回复“继续”即可授权上述范围；我会连续执行、纠错和验证。
```

For existing authorization, state its source and scope, summarize the execution plan, and proceed.

## Progress checkpoint

```text
已完成并验证：<outcome, changes, evidence>
待处理：<remaining work or isolated blockers>
接下来继续：<next authorized action>
```

Update PLAN/LOG and carry out the next action.

## Required decision or prerequisite

Use when remaining work requires input:

```text
已完成并验证：<progress and evidence>
剩余受阻工作：<targets and dependency>
当前状态：<facts, partial changes, recovery>
需要决定或补齐：<choice or prerequisite>
建议与其他选项：<actions and consequences>
涉及范围：<changed targets/actions/impact/recovery, if applicable>
```

Record the answer and apply the [decision rules](../SKILL.md#decisions-and-blockers).

## Final report

```text
任务状态：<completed / completed_with_followups / blocked>
已完成并验证：<DoD outcomes and evidence>
实际修改：<targets>
错误与恢复：<attempts, backup/rollback, if any>
残留与延期决策：<unresolved, accepted deferred, or unknown items, or None>
```
