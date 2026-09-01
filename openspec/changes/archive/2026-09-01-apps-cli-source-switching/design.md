## Context

根包以本地文件系统路径执行 `npm install -g --ignore-scripts <source>`，因此 npm 会把全局 `cthutool` 包和 `chc` bin 链接回所选 checkout。运行中的 CLI 可以从模块路径恢复真实 package root；现有 `chc status` 和 `chc update` 已经使用这个事实判断当前来源。

当前来源模型只有两类：路径等于 `~/.cthutool/source/CthuTool` 时为 `remote`，其他路径全部为 `local`。这足以保护 local-linked checkout 不被默认 update 修改，但无法区分开发仓库的主 checkout 与 linked worktree。显式 `chc update --install-dir` 虽然最终也能重链接全局命令，却会执行远端检查、要求 checkout clean，并可能更新 Git 状态，不符合开发 worktree 切换的预期。

Git worktree 拓扑只能从同一仓库的 Git common dir 可靠枚举。若 CLI 当前运行在独立的 managed clone 中，它无法自动推断任意位置上的开发 clone，因此跨 remote/local 往返需要保存一个最小、可重新验证的开发仓库锚点。

## Goals / Non-Goals

**Goals:**

- 让用户从 CLI 查看当前来源以及可用的 main、worktree 和 managed 来源。
- 在不修改 Git 状态的前提下，把全局 `chc` 切到任意有效开发 worktree。
- 保持现有 `local | remote` mode 和 `chc update` 安全契约兼容。
- 从 managed 来源切回已登记开发仓库，并在 worktree 创建或删除后动态反映最新拓扑。
- 在交互、人类非交互、quiet 和 JSON 模式下提供确定的选择与结果行为。
- 对缺失 bundle、错误仓库、并发切换、npm 重链接失败和已删除 active worktree提供可恢复诊断。

**Non-Goals:**

- 自动 build、watch、fetch、pull、checkout、merge、rebase、stash、reset 或 clean 开发 checkout。
- 用 `source use` 替代 `chc update`、改变 update 的 dirty/diverged checkout 防护或隐式更新 managed checkout。
- 扫描整个文件系统寻找 CthuTool clone，或持久化每个 worktree 的易失效路径。
- 在本 change 中引入独立于 checkout 的稳定 launcher，或使 npm 全局链接切换完全事务化。
- 管理非 CthuTool 仓库、通用 Git worktree 或 `codex/plugins/cthu-codex`。

## Decisions

### 1. Model source identity separately from installation mode

保留公开字段 `mode: local | remote`：默认 managed 根目录仍为 `remote`，其余开发来源仍为 `local`。新增 `sourceKind`：

- `managed`：默认 `~/.cthutool/source/CthuTool` checkout；
- `main`：已登记开发 clone 的主 worktree；
- `worktree`：与该主 worktree 共享 Git common dir 的 linked worktree。

`chc status` 和 `chc source current` 输出 `sourceKind`、规范化 source root，并在适用时输出 worktree selector、branch 或 detached 状态。新增字段保持 JSON 向后兼容；不把 worktree 添加到现有 mode union。

将命令命名为 `source` 而不是 `mode`，因为实际被切换的是提供 runtime bundle 的目录，而不是远程执行环境。`local` 和 `remote` 仍作为 `source use` 的用户友好 selector 保留。

### 2. Treat the runtime link as truth and the registry as a discovery hint

当前运行模块解析出的 package root 继续作为 active source 的事实来源，不保存独立的 active 标记。新增用户级 source registry 只保存一个首选开发仓库锚点，包括规范化的主 worktree 路径和足以重新验证的 Git common-dir/repository identity。

以下显式动作可以更新锚点：

1. 从 local 来源切到 managed 前，记录当前开发仓库的主 worktree；
2. 成功执行 `source use .`、`source use <path>` 或 `source register <path>`；
3. 用户显式选择另一个有效开发 clone。

只执行 `source list` 或 shell completion 不写 registry。registry 路径缺失、移动或身份不匹配时标记为 unavailable，并给出重新 register 或使用显式路径的提示，不扫描 home 或其他目录。

### 3. Discover worktrees live from the Git common dir

对已验证的开发仓库运行 `git worktree list --porcelain`，解析 path、HEAD、branch、detached、locked 和 prunable metadata。主 worktree 和 linked worktree 每次动态生成，已删除或新建 worktree 不需要同步 registry。

每个候选包含稳定的机器字段：`id`、`kind`、规范路径、branch、commit、dirty、locked、prunable、bundle presence、availability 和 active。worktree id 由规范路径生成短且确定的 selector；命令始终同时接受显式路径，避免 branch 重名或 detached worktree 无法选择。

managed 候选来自已知默认路径，不与开发 clone 的 `git worktree list` 合并。即使 managed checkout 恰好使用 Git worktree 机制，其用户语义仍按默认路径识别为 `managed`。

### 4. Keep source switching free of implicit Git mutation

切到 main 或 worktree 时执行以下步骤：

1. 解析 selector 并规范化目标路径；
2. 验证目标是 CthuTool 根包、属于预期 Git 仓库，并包含 `apps/cli/dist/index.js`；
3. 读取并展示 branch、commit、dirty 和 bundle 状态，但允许 dirty checkout；
4. 获取用户级 CLI source switch lock；
5. 运行 `npm install -g --ignore-scripts <target>`；
6. 检查全局 `cthutool` 包的实际链接目标并报告结果；
7. 成功后更新开发仓库锚点。

该流程不执行任何 fetch、checkout 或状态修复。目标 bundle 是否与 TypeScript 源码最新变更一致无法由切换器可靠推断，因此文档和 human output 提醒开发者先运行现有 watch/build 流程；缺失 bundle 则在 npm mutation 前直接阻止。

替代方案是复用 `chc update --install-dir`。由于 update 会访问 remote、要求 clean checkout 并可能推进分支，拒绝作为 worktree 切换实现。

### 5. Make managed selection predictable

`source use remote` 解析到默认 managed 根目录：

- 若 checkout 和 committed bundle 已存在，只进行本地校验和全局重链接，不 fetch、不改变 ref；
- 若 managed checkout 缺失，默认返回可操作的 `managed_source_missing` 错误；
- 用户显式提供 `--bootstrap` 时，复用现有 managed update/install 规划与安全 apply，创建来源后再确认链接结果。

这样日常切换不会意外升级版本，同时保留一条单命令首次创建 managed 来源的显式路径。managed checkout 已存在但 dirty 或 diverged 不影响纯重链接；只有 `--bootstrap`/update 流程继续应用现有 Git 安全检查。

### 6. Serialize and verify global relinks

来源切换修改用户级 npm 全局安装，因此使用 `~/.cthutool/locks/cli-source-switch.lock` 的跨进程独占锁避免两个终端同时切换。锁等待有界，超时返回稳定错误；不得删除无法证明已经过期且属于当前协议的锁。

npm 执行前完成所有只读校验。执行后解析 npm global root 下 `cthutool` 的真实目标并与目标 canonical path 比较。当前进程继续使用已经加载的旧模块直到正常退出，下一次 `chc` 调用使用新来源。npm mutation 失败时报告原来源、目标和 raw installer 恢复命令；本 change 不承诺跨 npm/文件系统失败的完全事务回滚。

### 7. Use shared discovery for list, prompt, completion, and selection

`chc source` 是 public command group：

- `chc source list`：列出所有当前可发现来源；
- `chc source current`：只显示 active 来源与恢复提示；
- `chc source use [selector]`：选择并切换来源；
- `chc source register <path>`：显式设置开发仓库锚点，不改变 active source。

交互式 TTY 中缺少 selector 时，`use` 使用同一 discovery provider 展示选择器；JSON、`--no-interactive` 或非 TTY 中缺少 selector 时返回 `missing_required_argument`。shell completion 只执行只读发现，失败时安静返回静态 selector 或空动态候选。

human list 显示 active 标记、kind、branch/detached、dirty、bundle 和 unavailable 原因。JSON 保持单 stdout value，并使用稳定的 candidate/result/error 字段。quiet 模式抑制列表细节和非必要提示，但不隐藏错误。

### 8. Document ephemeral worktree recovery instead of adding a launcher

当前 npm file-link 模型意味着：如果 active worktree 被删除，链接目标和 `chc` bin 可能一起失效，CLI 无法自行切回 remote。切换到 worktree 时 human output 必须警告这一生命周期边界；文档要求在删除 worktree 前运行 `chc source use remote` 或 `chc source use local`，并保留 public raw installer 作为命令已经失效时的恢复路径。

替代方案是在稳定用户目录安装一个 dispatcher launcher，通过配置选择 runtime bundle。它能在 active worktree 消失后回退，但会同时改变 installer、npm package ownership、PATH、update 和跨版本启动契约，超出本 change 的单一目标。若 source switching 成为高频长期功能，应另开 change 评估稳定 launcher。

## Risks / Trade-offs

- [Active worktree 被删除后全局命令失效] → 切换时警告、删除前提供 local/remote 切回命令，并文档化 public raw installer 恢复路径。
- [Registry 中的开发仓库被移动或删除] → registry 仅作 hint；每次重新验证，标记 unavailable，不扫描文件系统或静默选择另一个 clone。
- [Dirty worktree 的 bundle 可能过期] → 允许切换以支持开发测试，但显示 dirty/bundle 信息并提醒刷新 committed bundle；缺失 bundle 在 mutation 前阻止。
- [多个终端同时重链接 npm global package] → 使用用户级有界独占锁并在完成后验证真实链接目标。
- [npm global install 中途失败] → 预先完成目标校验，输出原/目标来源和 raw installer 恢复命令；不承诺完整事务回滚。
- [新增 JSON 字段影响严格 schema consumer] → 保留现有字段和值，新增 `sourceKind` 和 worktree metadata；在文档中声明 additive contract。
- [worktree selector 因路径移动而变化] → selector 只服务于当前动态目录；始终接受 `.` 和显式路径，移动后的目录重新发现新 selector。

## Migration Plan

1. 添加来源类型、registry schema、Git worktree discovery 和纯函数 selector resolution，并以当前 runtime source 保持既有 status 行为。
2. 添加目标校验、切换锁、npm relink 和 postcondition verification；先覆盖 main/worktree，再接入 managed existing/bootstrap 分支。
3. 注册 `source` 命令组和动态 completion，扩展 status/JSON 输出，但不改变 `chc update` 默认行为。
4. 更新 Bash/PowerShell、README 和 docs 的恢复指引；刷新 committed CLI bundle。
5. 运行 OpenSpec、targeted CLI lint/type/unit/integration/global-bin/completion/installer contract、bundle freshness 和 diff checks。

回滚移除 source command、registry 读取和新增 status 字段，恢复旧 committed bundle。已有 registry 文件作为无害用户数据保留；用户可继续使用本地/remote installer 进行来源切换。

## Open Questions

None. 稳定 launcher 被明确推迟到独立 change，本 change 使用现有 npm file-link 安装模型。
