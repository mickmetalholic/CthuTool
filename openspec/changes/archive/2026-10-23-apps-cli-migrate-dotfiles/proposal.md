## Why

将 dotfiles 的机器初始化、配置管理和 Notion 同步合并到 CthuTool，统一为 `chc dotfiles` 和 TypeScript 实现，避免长期维护独立 Go CLI、bootstrap 仓库和发布链。迁移以远端最新版本为基准，并修复最新软件模型与旧 Notion 导出模型不一致的问题，使 Notion 中维护的方案可以完整、可审查地发布到机器。

## What Changes

- 将 dotfiles 数据、chezmoi 模板和自定义 Go 逻辑迁入 CthuTool；保留 chezmoi、mise 作为执行工具。`chc dotfiles` 根层只保留首次接入 `init`，以及 `env`（软件环境）、`config`（配置文件）、`notion`（Notion 方案与发布快照）三个职责组，避免把安装、文件操作和数据同步平铺在同一层。
- 统一版本化软件模型，覆盖当前平台安装归属、health、固定版本 release、service 和 CTHULHU/k3s 行为；先对齐 Notion 与最新 Git 快照中的主机、toolset、软件差异，再允许首次导出。
- 新增独立 POSIX/PowerShell bootstrap：通过 HTTPS 下载脚本，准备 Git/OpenSSH/Node 24/npm，配置并验证 GitHub SSH，随后通过 SSH 克隆 CthuTool，默认路径为 `~/Documents/GitHub/CthuTool`；从已提交的 CLI bundle 安装 `chc`，无需目标机器构建。
- init 的主机选择只绑定已发布快照中的 Notion Host ID；软件、toolset、shell、terminal 等方案全部在 Notion 维护。绑定和固定 chezmoi sourceDir 保存在本机，不回写 Notion。init 可在首次引导中衔接文件接入，后续只需在调整绑定时重跑。
- env 提供 setup（含 dry-run）和 doctor；config 提供 add、diff、apply。config add 备份后复用 chezmoi add/merge，生成可审查的仓库改动，不维护影子收据或冲突状态。config apply 只负责仓库到本机，复用原生逐文件冲突提示；非交互先做原生 dry-run，接入完成后可独立运行，无需先 env setup。
- **BREAKING**：方案访问命令统一为 `chc dotfiles notion`：auth 管理 Token，diff 比较 Notion 与快照，pull 直连 Notion API 生成本地快照，validate 离线校验快照（高级/CI 用途）。pull 内置失败回滚及下次重试前的安全恢复。快照再经 Git 审查发布；不保留连接器导入、`--snapshot` 或双模式开关，不触发安装、配置应用、提交或推送。
- bootstrap 与需要 Notion 访问的 notion 操作共用 Token 获取流程：`NOTION_TOKEN` → 本地缓存 → 交互式隐藏输入；验证 Token 和三个数据源的读权限后缓存。缓存位于 `~/.cthutool/credentials/notion.json`，不进入仓库或 chezmoi；无 TTY、`--no-interactive`、`--json` 时缺少凭据直接报错。notion validate 无需 Token。
- Git 姓名、邮箱仅只读展示；迁移保留现有 Git 配置，不因移除旧模板中的身份字段而清空用户配置。模板与现有 `chc` shell completion 共存。
- 扩展 CLI 资产分发与 CI，确保新 checkout、npm 安装、离线快照和提交 bundle 的一致性。验收后再人工停用旧 dotfiles/dotfiles-bootstrap 入口和 Go 发布链，不在本变更中自动归档外部仓库。

## Capabilities

### New Capabilities

- `apps-cli-dotfiles-runtime`: TypeScript 配置模型、三类命令的职责、env 软件管理、config 文件接入与应用、离线数据校验、chezmoi/mise 边界和配置迁移兼容性。
- `apps-cli-dotfiles-host-binding`: init 的本地主机绑定、OS/WSL 校验、稳定源目录及旧绑定迁移。
- `apps-cli-dotfiles-notion-sync`: Notion API 直连、模型无损映射、状态与页面身份校验、差异检查和原子快照导出。
- `apps-cli-dotfiles-notion-credentials`: Token 查找、隐藏输入、读权限验证、受限权限缓存、凭据更新和非交互错误契约。
- `apps-cli-machine-bootstrap`: 无 Git/Node/chc 时的独立启动入口、GitHub SSH、SSH 克隆、CLI 安装与可恢复的首次引导。

### Modified Capabilities

- `apps-cli-distribution-ci`: 将 dotfiles 运行资产、chezmoi 根声明及 bootstrap 纳入 CLI 分发输入、资产一致性和离线校验。

## Impact

- 基准：`mickmetalholic/dotfiles` 远端 `main@8e59d3283eba2d99b8abcc327e694b23a2d4cc8e`（2026-09-15 UTC；北京时间 09-16），而非本地停在 7 月的 checkout；旧 bootstrap 基准为 `44d274e592f1c640ab523f958e68453f0bb121de`。
- 预计影响 `apps/cli/src/{command,domain,infra,runtime}`、CLI 依赖与已提交 bundle、新增 `dotfiles/` 资产、根 `.chezmoiroot`/版本要求、`scripts/bootstrap.sh`/`.ps1`、安装衔接、文档和 CLI CI。现有安装器及 source 管理的兼容默认值保留，新 bootstrap 显式使用所选 checkout。
- 外部依赖：Notion API 和三个现有数据源、GitHub SSH、Node 24/npm、chezmoi、mise、平台包管理器。普通配置操作使用 Git 快照，不需要 Notion Token 或实时查询 Notion。
- 迁移需要一次经过审查的 Notion 数据/字段对齐，尤其是主机 ID、toolset 及新版安装信息；API 同步功能保持只读，不负责修改这些 Notion 定义。
- 不包含云端 connector、Notion 双向同步、本地完整方案编辑器、Git 身份托管、自动安装 Kubernetes workloads/GitOps，或自动删除/归档旧仓库。
