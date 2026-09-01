## Context

当前 Agent 由 Rust tray 监督 headless Node Agent。tray 已经拥有 macOS/Windows 的单实例、托盘菜单、本机 IPC 和 Agent 生命周期控制，但没有创建窗口；当前 `Open` 操作依赖已经存在的环境 catalog 和 Web bridge launch ticket。全新安装如果没有部署地址，就无法启动有效环境，也无法打开现有 Web `/agent` 设置页。

本 change 面向单用户 self-use 发布模式：每个安装只连接一个部署环境，用户配置一个 HTTPS Origin，Agent 从该 Origin 派生 Web `/agent`、Backend HTTP 和 `/ws/agents` 地址。配置必须位于用户目录并跨 Agent 版本更新保留；Agent 访问由部署私网边界授权，不再使用静态 Agent Secret。

## Goals / Non-Goals

**Goals:**

- 在 macOS/Windows tray 中提供首次安装向导和可重复打开的 Agent 设置窗口。
- 通过一个 Origin 配置完整 Web/Backend 路由，并在界面中以只读形式展示派生地址。
- 在配置保存前阻止 Agent 进入错误重启循环；配置成功后由 tray 启动或重启 Agent。
- 让 Origin、设备名和连接状态可在本机原生界面查看/修改。
- 保留部署 Web `/agent` 作为复杂 Profile、Chrome、浏览器操作和诊断界面。
- 保证配置原子写入、失败回滚和更新保留，并忽略且保留已有 legacy secret 文件。
- 发布一个不包含 WebView、HTML、JavaScript/CSS 应用 runtime 的原生配置 UI。

**Non-Goals:**

- 不把完整 Agent 管理控制台迁移到 Rust UI。
- 不在原生 UI 中实现 Profile 管理、浏览器自动化操作或 Web bridge bearer 流程。
- 不支持同一 self-use 安装同时切换多个生产环境；显式 development catalog 的行为不作为本 change 的用户体验目标。
- 不让部署 Web 页面修改 Origin，避免 Web 自行改变本机信任边界。
- 不引入 Electron、Tauri WebView 或本地 HTML 设置页。

## Decisions

### 1. Use a separate native setup executable

新增 `apps/agent-setup` Rust executable，使用 Slint 定义窗口和控件，由现有 `agent-tray` 在需要时启动。setup 进程通过受保护的本机 IPC 请求 tray 读取/保存配置、验证连接和启动/重启 Agent。

把 UI 放在独立进程而不是直接嵌入 tray 有三个原因：

- 当前 tray 已经拥有 `winit` 事件循环和托盘事件分发，独立事件循环不会改变现有托盘监督逻辑。
- UI 崩溃不会带走 Agent supervisor；窗口关闭也不会停止 tray 或 Agent。
- Slint 依赖只进入 setup executable，不会把渲染和控件依赖耦合到长期运行的 tray supervisor。

Slint 采用声明式 `.slint` UI、Rust backend callbacks 和固定版本锁定。Native window 使用系统标题栏，内容使用 CthuTool 的浅色/紫色视觉语言；不依赖 WebView。Slint 的授权选择和署名要求需要在实现时随 release inventory 一起确认。

替代方案：

- `egui/eframe` 上手更快，但当前 tray 的事件循环和渲染集成需要额外适配，且更偏自绘控件；可作为 spike fallback。
- `iced` 的状态模型适合大型 UI，但当前 change 只有一个小型配置窗口，额外运行时和学习成本不划算。
- macOS Cocoa/Windows Win32 原生控件会产生两套 UI 实现，长期维护成本过高。
- WebView 可以复用 Web 视觉，但会违背 Agent bundle 不携带本地 Web runtime 的边界。

### 2. Use one window with two modes

setup UI 由同一个窗口承载两个模式：

- `FirstRun`: 无 `deploymentOrigin` 时展示连接向导，自动填充设备名，Origin 必填，提供验证、保存、取消和错误重试。
- `Settings`: 已配置时展示当前状态、Origin、设备名、连接开关、派生地址、最近验证结果和“打开 Web 设置”入口。

首次启动时 tray 将窗口打开一次；用户取消后只显示 `Setup required` 托盘状态，不反复弹窗，直到用户从托盘选择 `Configure Agent` 或运行 `chc agent settings`。已配置状态下，托盘菜单同时提供 `Agent Settings` 和 `Open Web Console`。

窗口布局采用 520x600 左右的固定最小尺寸、系统标题栏、顶部状态区、分组卡片和底部操作区。危险/失败状态使用行内反馈，保存按钮根据校验状态显示 `Verify and connect`、`Reconnect` 或 `Save changes`，不使用连续阻塞式弹窗。

### 3. Derive all deployment endpoints from one Origin

用户配置保存为用户级 `deploymentOrigin`，必须是 exact Origin：生产 self-use 只接受 HTTPS，不能带路径、query 或 hash；开发模式可沿用显式 localhost 例外。

Agent 为当前唯一 profile 构造固定 `self-use` environment：

- `webOrigin = deploymentOrigin`
- `webAgentUrl = deploymentOrigin + '/agent'`
- `backendHttpUrl = deploymentOrigin`
- `backendAgentWsUrl = wss://<origin-host>/ws/agents`
- `environmentId = 'self-use'`
- `namespace = 'self-use'`

Web/Backend 是否真正共用同一 Origin 仍由部署反向代理保证：`/agent` 指向 Web，`/health` 和 Backend API 指向 Backend，`/ws/agents` 支持 WebSocket upgrade。派生规则和端点路径必须集中在 Agent runtime 中，Rust UI 只展示并提交 Origin，不复制路由逻辑。

### 4. Persist mutable configuration outside version contents

保留现有用户数据根目录和 atomic write 机制，新增/调整的用户级配置包含：

- `config.json`：schema version、`deploymentOrigin`、设备名、连接开关、稳定 Agent id、浏览器可执行文件覆盖。
- 旧版本可能留下的环境 namespace `agent-secret` 文件不读取、不复制、不删除，避免迁移或更新意外破坏用户数据。
- `environments/self-use/` 下的 profiles、logs 和 runtime 状态，保持版本更新之外。

旧版仅有一个 catalog profile 时，安装/启动迁移可以把当前选中的 profile 映射到 `self-use`；无法安全判断的多环境数据保持原文件并报告迁移提示，不自动合并或删除。

### 5. Keep the trust boundary in tray/Agent IPC

setup UI 不通过命令行参数或 Web bridge 保存 Origin。它连接已存在的 tray local socket，并使用 tray instance nonce 进行同用户认证；新增 typed setup requests：读取安全配置状态、保存候选配置、验证、取消和打开 Web console。

tray 负责：

1. 校验 setup request 和 Origin；
2. 原子写入用户配置；
3. 在候选配置验证成功后通知 supervisor 启动/重启 Agent；
4. 只返回脱敏状态和错误 category；
5. 在 Origin 变化后使旧的 Agent bridge ticket/session 失效。

### 6. Add an explicit unconfigured lifecycle state

tray 启动时先读取用户级配置：

```text
missing/invalid origin
        │
        ▼
 SetupRequired ── configure saved ──▶ Starting ──▶ Ready/BackendOffline
        │                                      │
        └── cancel/retry ◀── setup error ◀─────┘
```

`SetupRequired` 状态不启动 Node Agent，也不进入 crash-loop；tray/CLI status 明确报告需要本地配置。配置保存并通过本地 schema 校验后，supervisor 才启动 Agent，等待 Agent control readiness 和 Backend 状态。修改已配置 Origin 时先验证候选配置，失败保留旧配置和旧连接，成功后再执行有界重启/重连。

### 7. Preserve the Web console boundary

原生窗口的成功页提供 `Open Web Console`。它通过现有 tray `bridge.launch` 生成一次性 ticket 后打开部署的 `/agent` 页面；Web 页面继续使用 Fetch loopback bridge，并只获得脱敏资源和安全运行设置。

原生 UI 和 Web UI 的职责边界如下：

| 功能 | Native setup | Web `/agent` |
| --- | --- | --- |
| 首次 Origin 配置 | ✓ | — |
| Origin 修改 | ✓ | — |
| 连接验证与 Agent 重启 | ✓ | 只显示状态 |
| 设备名、Chrome 路径、连接开关 | ✓ | ✓ |
| Profile 管理 | — | ✓ |
| 浏览器操作/挑战 | — | ✓ |
| 诊断与详细运行状态 | 摘要 | ✓ |

## Risks / Trade-offs

- **[新增 native UI 构建和发布复杂度]** → 把 setup UI 作为独立 target，增加 macOS/Windows 构建、inventory 和 smoke 检查；tray 本身保持现有生命周期逻辑。
- **[Slint 授权和署名要求]** → 在锁定依赖前确认 self-use 发布方式对应的许可证，打包许可证文本和署名信息；若无法接受，切换到 MIT/Apache 兼容的 egui fallback。
- **[Native UI 与 Web UI 视觉可能漂移]** → 固定颜色、间距、状态语义和文案 token；原生 UI 只做小范围配置，不复制 Web 控制台组件。
- **[配置修改可能让 Agent 离线]** → 候选配置先验证，成功后才提交；失败保留旧配置，首次配置失败则保持 SetupRequired。
- **[私网边界或 Origin 配置错误]** → 保存前执行候选连接验证，返回有界且可操作的错误，并保留上一份可用配置。
- **[旧 catalog 数据迁移不确定]** → 只自动迁移唯一明确的 active profile；多环境或异常数据保持原状并提供 CLI remediation。
- **[高 DPI、键盘和辅助功能差异]** → UI smoke 覆盖 macOS/Windows 高 DPI、键盘导航、密码框、窗口关闭/重开和系统深色模式；将无障碍支持作为验收项。

## Migration Plan

1. 先实现 Origin/派生端点和用户配置存储，同时保留旧 catalog 读取作为迁移输入。
2. 添加 setup UI、tray setup IPC 和 `SetupRequired` 状态；验证成功后再切换到单 profile runtime。
3. 更新 CLI 的 install/start/status/settings/doctor，使未配置状态可操作且 settings 能打开原生窗口。
4. 修改 release layout、inventory、bundle action 和 self-use manifest，打包原生 setup executable，不再绑定部署 catalog。
5. 在 macOS/Windows clean-host 上验证：安装 → 首次向导 → 取消 → 重开 → 验证失败保留旧配置 → 成功启动 → 打开 Web console → 更新后配置保留。
6. 若新版本启动或迁移失败，保留旧 immutable Agent version，并恢复旧用户配置/active pointer；不删除旧 profiles 或 secrets。

## Open Questions

- Slint community/royalty-free license 的署名和发布文本是否接受；若不接受，是否锁定 egui fallback。
- setup UI 是否允许用户覆盖固定的 `/agent`、`/health`、`/ws/agents` 路径；默认不允许，只有出现实际反向代理需求时再扩展。
- 旧版多环境 catalog 的 profiles 是否需要提供显式 `chc agent migrate`，还是仅保留目录并提示用户重新配置 self-use。
