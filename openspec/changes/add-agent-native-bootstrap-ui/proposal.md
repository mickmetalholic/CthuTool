## Why

新安装的 Agent 没有部署 Origin 时无法启动完整环境，也无法打开依赖 Origin 的 Web 设置页，导致首次配置存在闭环缺口。自用模式只需要一个部署 Origin，应该由本机原生界面完成首次配置，并在后续继续提供连接设置和状态查看入口。

## What Changes

- **BREAKING** 移除 self-use Agent 产物对环境 catalog 和预置 Web/Backend URL 的依赖；改为从用户目录读取单个部署 Origin。
- 新增跨 macOS/Windows 的原生 Agent 配置窗口，支持首次安装向导和已配置后的设置模式。
- 首次向导配置 Origin 和设备名称，校验并启动 Agent；配置取消时托盘保持“未配置”状态并可稍后重试。
- 后续可从托盘重新打开配置窗口，查看连接状态、修改 Origin/设备名并重新连接 Agent。
- 从 Origin 派生 `/agent` Web 地址、Backend HTTP 地址和 `/ws/agents` Agent WebSocket 地址。
- Agent 连接依赖部署的私网边界，不配置、生成或发布静态 Agent Secret；已有 legacy secret 文件保持原样但不再读取。
- 原生配置窗口不引入 WebView、本地 HTML 或第二套 Web 应用；已配置后的复杂 Profile、Chrome 和浏览器操作继续使用部署的 Web `/agent` 页面。
- 更新 tray/Agent IPC、用户配置持久化、安装包清单、发布校验、CLI 状态和跨平台 smoke tests。

## Capabilities

### New Capabilities

- `apps-agent-native-bootstrap-ui`: 原生首次配置向导、后续设置窗口、连接验证、错误恢复和托盘入口。

### Modified Capabilities

- `apps-agent-environment-routing`: 从受信发布 catalog 改为用户级单 Origin 配置、派生固定端点和未配置状态。
- `apps-agent-release-artifacts`: 允许随 Agent 发布原生配置 UI，移除 self-use 部署 catalog 和 URL 的产物绑定，同时禁止 WebView/本地 Web 应用 runtime。
- `apps-cli-agent-lifecycle`: 更新安装、启动、状态和 settings 行为，使未配置 Agent 进入原生配置流程并保留用户配置跨版本。

## Impact

- Rust workspace：`apps/agent-tray` 及新增的原生 setup UI crate/可执行文件，采用 Slint 窗口和现有本机 IPC/托盘生命周期。
- Agent runtime：单 Origin 配置模型、派生 Web/Backend 地址、未配置/已配置状态和安全重连流程。
- CLI 与安装器：用户配置路径、状态输出、首次配置入口和版本更新时的配置保留。
- Release layout/inventory/workflow：构建并打包原生 setup UI，移除部署 catalog 与静态 Secret 绑定。
- 测试：配置校验与原子持久化、首次启动/取消/重试、Origin 修改回滚、托盘 IPC、macOS/Windows UI smoke 和 Agent 重启连接验证。
