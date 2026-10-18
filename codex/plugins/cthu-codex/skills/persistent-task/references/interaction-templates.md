# Interaction Templates

Use concise messages adapted to the user's language. These are optional output shapes, not a mandatory sequence. Omit empty fields and unnecessary prompts.

## Discovery and material questions

Perform available read-only investigation first. Ask only unresolved user choices that affect execution, and confirm conditional policies before forming phases when possible.

```text
已查明：<relevant facts and evidence>
执行前需要确定：<material choice, recommendation, and consequences>
<When useful: an upfront conditional policy that would avoid a later interruption>
```

## Execution preview when authorization is missing

```text
目标与范围：<outcome, concrete targets/actions/exclusions>
完成标准：<observable DoD>
执行阶段：<one complete phase, including implementation, recovery, and final checks>
风险与恢复：<impact limits, backup/recovery>
已约定的分支处理：<conditional policies>
需要暂停的条件：<actual decisions or external prerequisites>

回复“继续”即可授权上述完整执行范围；我会连续执行、纠错和验证。
```

Describe another phase only when an actual decision depends on evidence unavailable until execution; explain the evidence, dependent choice, and why it cannot be settled now. Do not ask the user to approve discovery already possible read-only.

## Existing authorization

```text
已记录你的执行授权：<source and concrete bounds>
计划用一个完整阶段完成 <outcome>，包含 <implementation/recovery/verification>。
现在继续执行。
```

Use this only when the previous explicit instruction actually covers the work. A vague goal does not supply missing high-impact targets or permission for external actions.

## Progress checkpoint with automatic continuation

```text
已完成并验证：<outcome, actual changes, evidence>
待处理：<remaining work and isolated blockers, if any>
接下来继续：<next safe authorized action>
```

Report completed results before next work. Update PLAN/LOG and proceed without waiting for `继续`. A phase boundary or final checks alone never require another approval.

## Genuine decision or external prerequisite

First preserve the affected targets and finish safe independent work. When remaining work needs input:

```text
已完成并验证：<progress and evidence>
剩余受阻工作：<affected targets and dependency>
已知事实与当前状态：<evidence, partial changes, recovery>
需要决定或补齐：<exact choice or external prerequisite>
建议：<preferred option and concrete action>
其他选项及影响：<alternatives and consequences>
本次选择涉及的执行范围：<changed targets/actions/impact/recovery, when applicable>
```

A bare `继续` does not choose among ambiguous options. Record a clear answer and continue existing covered work. If the answer explicitly authorizes the concrete revised scope, do not ask for a second identical confirmation; otherwise obtain the genuinely missing authorization.

## Final report

```text
任务状态：<completed / completed_with_followups / blocked>
已完成并验证：<DoD outcomes and evidence>
实际修改：<targets>
错误与恢复：<material attempts and backup/rollback state, if any>
残留与延期决策：<required unresolved, accepted deferred, or unknown items, or None>
```

Report `in_progress` when safe authorized work or reasonable recovery remains; keep executing rather than using the final report to hand back an unfinished task.
