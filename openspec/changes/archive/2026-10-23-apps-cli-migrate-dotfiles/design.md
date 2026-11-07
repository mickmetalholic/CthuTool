## Context

动机和范围见 [proposal.md](proposal.md)。本设计依据下列已读源码和现场差异，而非本地旧 checkout：

| 来源 | 已确认事实 | 对方案的影响 |
| --- | --- | --- |
| dotfiles 远端 `main@8e59d3283eba2d99b8abcc327e694b23a2d4cc8e` | `internal/dotcli` 已包含严格 host/software 模型、安装调度、typed health、official release、k3s；本地仍为 `327945b` | 按远端固定提交迁移资产和行为，不能把 7 月 checkout 当最新版本 |
| 同一提交的 `internal/catalogdata/catalog.go`、`internal/notionsync` | Notion exporter 仍使用旧的 `check/doctor/install/package/guidance` 模型，缺少 runtime CLI 新增的 kind/health/owner/handler/release/service | 静态源码已显示模型不一致，不能宣称旧 sync 已通过最新数据；TS 必须共享一个模型 |
| 会话中的 Notion 只读盘点 | Git 有 5 个 canonical host；Notion 当时有 `win-desktop`、`macbook-pro`、`work-mac`、`linux-devbox` 4 个 active host；toolset、k9s 安装定义也有差异 | 首次导出前需要有针对性的数据对齐，不能用旧 Notion 方案覆盖最新 Git 行为 |
| CthuTool `root.command.ts`、`runtime/cli-context.ts` | 命令注册统一驱动帮助与补全；`json` 与 `interactive` 独立 | dotfiles 走统一注册；Token 提示还必须显式检查 `!json` |
| `install-chc.sh/.ps1`、`self-update-manager.ts` | 要求 Git/Node 24/npm，安装已提交 bundle；支持 local checkout；source 默认可更新实际 linked checkout | 新 bootstrap 在前面补齐 GitHub SSH/运行时，随后复用 local 安装，不另建隐藏 clone |
| root `package.json`、bundle/affected 脚本 | package files 尚不含 dotfiles；CI 未识别根 dotfiles 资产；Agent Node payload 不含 npm、目标矩阵也不同 | 补齐运行资产清单和 CI；机器 bootstrap 使用完整 Node/npm，不能拿 Agent 精简 payload 代替 |

源码基准：[dotfiles 计划](https://github.com/mickmetalholic/dotfiles/blob/8e59d3283eba2d99b8abcc327e694b23a2d4cc8e/docs/notion-managed-software-plan.md)、[runtime 模型](https://github.com/mickmetalholic/dotfiles/blob/8e59d3283eba2d99b8abcc327e694b23a2d4cc8e/internal/dotcli/catalog_model.go)、[旧 exporter 模型](https://github.com/mickmetalholic/dotfiles/blob/8e59d3283eba2d99b8abcc327e694b23a2d4cc8e/internal/catalogdata/catalog.go)。Notion 盘点是会话时点证据，实施时重新读取并保存不含秘密的对齐报告，不将这些数量当成永久约束。

## Goals / Non-Goals

**Goals:**

- 把模型、命令、模板、Notion 导出连接成同一个可版本化的数据契约；先用旧版本的行为 fixtures 验证 TS，再切换入口。
- 将本地身份与远端方案分开，并让 bootstrap 在没有项目运行时的情况下也能逐阶段恢复。
- 将配置应用、软件安装、Notion 发布设计成可单独审查的操作，失败时不留下可被误用的半份配置。

**Non-Goals:**

- 不复制旧仓库历史、生成式 OpenSpec adapters 或整个 skill 树；不修改 `codex/plugins/cthu-codex`。
- 不将迁移决策写进生成的 `openspec-*` skills。长期操作契约进入正式规格、CLI 文档及受版本控制的数据 schema。
- 不把 CthuTool 变成新的包管理器、运行时管理器、Notion 编辑器或 Kubernetes workloads 管理器。

## Decisions

### 1. 以 CLI 内独立 domain/infra 模块迁移，共享一份严格模型

在 `apps/cli/src/command` 增加 dotfiles 命令组，内部按 env、config、notion 三类对象分组，根层只保留跨组接入 init。domain 承载 schema、host 解析、plan、health、sync normalize/diff；infra 承载 Notion HTTP、chezmoi/mise、文件事务、私有凭据和子进程。优先使用现有 Valibot、Node 24 fetch 和 prompts；将 YAML parser 声明为 CLI 实际依赖，避免依赖 root devDependency 的偶然提升。

自定义 Go 业务逻辑全部迁为 TS，不通过子进程继续包装 `dot` 或为 Notion 再维护另一套简化模型。Go baseline 的 parity、host、doctor、setup-dispatch、CTHULHU fixtures 是行为参考；保留关键输出/计划语义，命令文案和 JSON 外壳服从 chc 的共享契约。

模型包含两种独立维度：Notion `Kind=package|runtime` 继续表达条目分类；软件 `kind=command|desktop|framework|service` 表达执行语义，二者不得复用同一个字段。平台 owner、method、handler、release 和 service 均为受限类型；禁止从 Notion 文本执行任意 shell 安装命令。统一 schema 版本写入导出 manifest，解析时先验证整组文件和引用，再生成计划。

备选是逐文件翻译 Go、让旧 exporter 保持原样；它会固化目前已观察到的字段丢失/严格解析失败，因此不采用。

### 2. 资产位于 CthuTool 的 `dotfiles/`，本地状态不进资产目录

建议布局：

```text
dotfiles/
  data/packages.yaml
  data/runtime-tools.yaml
  data/toolsets.yaml
  home/.chezmoidata/defaults.yaml
  home/.chezmoidata/hosts.yaml
  home/...                        # 原有跨平台 chezmoi 模板
  notion/sources.json             # API 版本、三个 data_source_id、字段映射版本
  notion/manifest.json            # schema 版本、page ID 连续性、内容摘要
.chezmoiroot                      # dotfiles/home
.chezmoiversion                   # 2.73.3：原生 less-interactive/error-on-conflict 契约
```

以 CthuTool checkout 根作为 chezmoi source，`.chezmoiroot` 选择其子树，不另维护一份镜像模板树。数据在 `data/` 与 `.chezmoidata/` 的职责沿用基准；必要的 template include 路径按新根重定位并做真实 render 验证。

源的解析规则：未绑定时由当前 CLI 的安装根定位资产；绑定后所有 home/plan 命令使用 chezmoi 配置中的固定 sourceDir。`notion diff/pull` 默认也使用该绑定源，允许显式 `--source <checkout>` 在开发 checkout 检查/发布；pull 要求可写 Git checkout。`notion validate` 可显式指定 source，供 CI 无绑定运行。不得以 cwd 猜测路径。

安装 package 的 files 和运行资产 inventory 包含上述目录、根声明及必要非秘密 metadata；通过安装根定位，Node bundle 不必内嵌每个 YAML。现有 `chc source use` 的 relink 语义不变，不暗改 chezmoi sourceDir。若绑定源版本与 CLI 不兼容，报 schema/version 错误并提示更新，不回退到另一个 worktree。

备选是每次跟随 chc 当前 checkout，或把全部数据塞进 JS；前者会把调试切源变成配置切源，后者使 chezmoi 维护和 Git diff 更困难。

### 3. init 统一接入和绑定，Notion 负责主机方案

| 信息 | 权威位置 | 变更入口 |
| --- | --- | --- |
| 软件、toolset、host 的 OS/shell/terminal/Tools/Exclude | Notion，发布后为 Git 快照 | Notion 编辑，随后 notion diff/pull + Git 审查 |
| 当前机器选择哪个 canonical Host ID | 本地 chezmoi `[data.local].host` | `chc dotfiles init --host <id>` 或交互选择 |
| 使用哪个配置 checkout | 本地 chezmoi `sourceDir` | init 显式选择或迁移 |
| home 文件模板及公共配置片段 | Git 中的 `dotfiles/home/` | config add 接入已有文件，再审查模板改动；init 可衔接首次接入 |
| Token | `NOTION_TOKEN` 或用户凭据文件 | 共享 auth 流程 |
| Git 姓名/邮箱 | Git 自身配置 | 用户的 Git 操作；chc 只读展示 |

init 包含准备工具、选择源、绑定主机和接入已有文件的一个交互流程，不单独暴露主机选择子命令。主机候选集是当前已发布快照，无须实时访问 Notion。按 OS/WSL 过滤并展示最终 toolset/shell/terminal 摘要；保存 canonical ID，不复制完整 host 对象。无匹配时输出“Notion 定义 → 发布快照 → 更新 checkout → init”的路径。

基准 host：`windows-desktop`、`darwin-macbook-pro`、`darwin-mac-mini`、`linux-wsl`、`linux-ubuntu-server`。旧 `DOTFILES_HOST`、hostname、别名仅用于提示迁移候选；常规安装以持久绑定或显式 `--host` 为准，环境变量不能悄悄覆盖持久绑定。只有 init 保存 Host ID；setup、doctor、diff、apply 的 `--host` 只选择本次执行方案，不持久化。未知/未绑定状态不回落到通用安装清单。

init 在准备前输出 OS/架构/WSL 和当前 Node 版本，并逐项报告 chezmoi/mise 的检查、发现路径/可读版本、复用或所选安装方式。版本探测仅作展示，不自动升级已有工具；兼容性继续由源的 .chezmoiversion 原生约束。JSON 结果包含 environment/tools 且不混入进度，quiet 抑制进度。init 负责确保 chezmoi/mise 可用和配置源接入；已有有效绑定时默认保留，交互可调整主机，或用 `init --host <id>` 显式切换。`init --source <checkout> --host <id>` 支持明确接入；非交互初次接入必须指定 host；已有 home 文件留到显式 config add/apply 处理，不把尚未应用文件视为绑定失败。init 不执行软件 setup、chezmoi apply 或 mise install。现有别的 sourceDir 默认报冲突；通过 `init --migrate-from <path>` 显式迁移，核对旧路径，先保存可恢复配置备份，再验证/写入新 sourceDir 和 canonical host。旧源、旧仓库、本机 home 文件均保留。

重复 init 可调整绑定，已有前置条件不重新安装。日常文件接入独立使用 `chc dotfiles config add <path...>`，不再把导入选项塞进 init 参数。init 可在首次交互中衔接同一文件接入服务；config add 只使用已保存绑定，不重新选择主机。导入仅涉及文件内容，不允许用本机数据覆盖 Notion 发布的 host/toolset/software。具体冲突、备份和 config apply 规则见第 8 节。

备选是完整本地主机方案编辑及 Notion 双向同步；这违背已确定的统一编辑来源，也会引入冲突合并问题。

### 4. 扩展 Notion 字段以无损表达最新模型，先做一次对齐

继续使用三个现有数据源，不新增一组影子数据库：

| 数据源 | `data_source_id` |
| --- | --- |
| software | `3daafcec-eb90-8027-a1b7-000b9131dc8a` |
| toolsets | `b47c81dc-5987-448b-837d-19f909a1e03c` |
| hosts | `ccb101a7-9114-4010-95fe-8db68102d794` |

这些 ID 和 API 版本不是秘密，可随 sources.json 发布；Token 不在其中。当前既有 API 版本 `2026-03-11` 与[官方认证文档](https://developers.notion.com/reference/authentication)一致，先固定此版本，用契约 fixtures 升级。

字段映射设计：保留现有 `Name`、`Kind`、`State`、`Homepage`、`GitHub`、`Checks`、`Doctor`、各 OS Install/Package/Guidance、关系和顺序字段。新增 `Software Kind`；新增 `Health Config` 以及各 OS `Owner`、`Handler`、`Config`。简单常用值继续是可读列；`Health Config` 和平台 `Config` 使用有版本约束的 JSON rich_text，承载结构化 health checks、release/version/artifacts/checksums、service/kubeconfig 等高级对象，附 schema、示例和明确报错位置。API rich_text 多段拼接后再解析。Owner/Handler 等独立列不得在 Config 内重复声明；旧 Checks/Doctor 与新 Health 同时出现时必须语义相符，否则拒绝。新 active 导出必须完整；旧字段转换仅用于明确的 schema 升级和迁移报告，不能猜测服务参数或丢弃新版字段。与导出无关的 Notion 备注列不进入模型；模型字段和结构化 JSON 严格校验。

首次对齐报告必须逐项记录 page ID、现有稳定键、目标键、缺失字段和 runtime plan 差异：

- `win-desktop` → `windows-desktop`、`macbook-pro` → `darwin-macbook-pro` 作为明确审查映射；保留页面连续性。
- 不假定 `work-mac` 等于 Mac mini，也不假定 `linux-devbox` 等于 WSL；旧条目保留 draft/retired 决策记录，缺少的目标 host 先在 Notion 建 draft，经审查 active 后发布。
- 对齐 Notion 的 `base/shell-fish/shell-nushell/desktop/devops` 等旧 toolset 与最新 Git 的具体 shell/terminal/operations 拆分，逐 host 比较最终展开清单，不能只改名称。
- 对齐 k9s Linux 的旧 brew 定义与 Git `official-release` 固定版本/校验信息，以及 k3s health/service/kubeconfig 的完整信息。

本变更规划不修改 Notion。实施时先交付映射表、字段操作说明和候选 diff；数据库字段/记录的实际编辑是独立、显式的数据迁移动作，普通 sync 命令永远只读。首次 pull 在对齐审查完成前不得覆盖基准快照。

备选是把新参数仍藏在 Git 中、Notion 只维护软件名；那会使 Notion 无法成为完整方案来源，因此不采用。

### 5. 同步是 API 读取、校验、发布本地快照的单向管线

```mermaid
flowchart LR
  N[Notion 编辑及 active 审查] --> A[API 完整分页读取]
  A --> V[统一模型及页面身份校验]
  V --> C[notion diff 差异报告]
  C --> P[显式 pull 本地事务导出]
  P --> G[Git 审查及发布]
  G --> U[机器更新绑定的 checkout]
  U --> W[init 绑定或检查现有绑定]
  W --> S[显式 env setup 或 config diff/apply]
```

Node fetch 客户端固定 base URL、API 版本和 Authorization header，设置超时与可取消请求。完整读取三个 source schema、分页查询与 relation property 分页，不把初始 relation 子集当完整结果。按 [data source query](https://developers.notion.com/reference/query-a-data-source) 和[限流规则](https://developers.notion.com/reference/request-limits)处理 cursor 与 Retry-After；429/临时过载最多重试 3 次，若服务要求等待超过本次预算则报告稍后重试，不提前绕过限流。401、403/404 的权限或不可见错误不做无限重试。

`notion diff` 对有效差异返回成功并在结果中标记 `hasChanges`；验证、权限和读取失败走稳定 CLI error。`pull` 共享同一读取/normalize/diff 逻辑，写入范围仅为 packages/runtime-tools/toolsets、hosts 和 manifest；defaults、模板、sources 配置不由同步覆盖。没有 `--snapshot`、连接器导入和 `--direct-api`。

manifest 保留 page ID → stable key、source ID、schema 版本、显式 identity migrations、retired tombstone 和生成文件摘要。active 导出，draft 的内容不要求达到 active 完整性；一个已发布项意外改成 draft 仍是消失冲突，不得借 draft 静默删除。删除必须源行明确 retired，并用 `pull --allow-retire <stable-key>` 逐项确认；已发布行消失、读权限不足、稳定键重命名没有经审查 mapping 都失败。

关系按集合比较，保留已有导出顺序，新成员按 stable key 排序；不以 API 返回顺序制造重排。notion diff 报差异不写仓库；首次认证成功可以写本机 credential，这个例外在帮助中说明。

pull 的恢复并入内部事务流程，不新增恢复子命令。开始时获取源操作锁；若有前次中断 journal，先确认没有仍存活的写进程，校验备份路径/摘要和中断后的用户编辑，再安全恢复上一代。这一局部恢复不需要 API 或 Token；遇到文件冲突则保留材料并输出人工处理位置，不猜测覆盖。

旧事务清理后才进行本次认证、读取和候选校验，记录基线摘要并检测并发编辑。全部候选在同文件系统暂存并保存上一代备份，建立持久 journal，逐项替换，最后发布 manifest 后清理事务。失败立即回滚；进程中断则下次再运行同一个 `notion pull` 完成安全恢复。env setup 和 config apply 检查 journal/摘要，拒绝使用未恢复的半份快照。notion diff/validate 只报告中断状态，不暗中写文件。故障注入覆盖每个替换点及下次重试；单次 rename 的原子性不能代替多文件事务。

备选是逐文件直接 writeFile；在 hosts 和软件清单不同步时会产生错误安装计划，因此不采用。

### 6. Token 使用统一 auth 流程和本地权限受限文件

凭据解析顺序固定为 `NOTION_TOKEN` → `~/.cthutool/credentials/notion.json` → 允许交互时的隐藏输入。缓存 JSON 包含 `version`、`token`，不收集 Notion 内容；这是本机文件缓存，不宣称加密存储。缓存不受 sourceDir、chezmoi、Git 或 CLI worktree 影响。

命令只保留 `notion auth` 一个入口，不增加更换/清除模式 flags。没有凭据时直接隐藏输入；已有凭据时展示不含秘密的来源状态，交互选择“继续使用并验证”“更换 Token”“清除本机缓存”。更换时先验证新 Token 再保存；清除可以在旧 Token 无效或 source 不可用时执行，不访问 API。环境 Token 生效时明确提示其优先级，更换动作引导先移除环境变量；清除缓存不会改变环境变量。无 TTY、`--no-interactive` 或 `--json` 时 auth 只验证当前解析到的凭据，不更换或清除。

notion diff/pull 在 API 操作前复用 ensure-auth：有效凭据直接复用，缺失时隐藏输入，不弹完整管理菜单。bootstrap 调用同一 auth 入口，已有凭据时默认操作为继续使用；用户手动运行 auth 即可管理或更换，不需要记另一套参数。notion validate 是本地快照校验，明确绕过 ensure-auth；裸 notion/help/补全也不触发认证。

输入 Token 后先确认认证有效并能读取三个 source 的 metadata，再保存；schema 内容验证在 sync 阶段进行。提示说明如何创建可读取目标表的 Notion Token、给三个数据源授权；不通过聊天收集 Token。缓存目录 POSIX 0700、文件 0600；Windows 对目录、临时文件和目标文件建立当前用户 ACL，检查继承及残留授权，失败不降级为普通文件。缓存路径及其父级不得重定向到仓库/chezmoi，拒绝不安全符号链接。抽取/复用现有私有存储约定时需补齐失败保护，不能直接复制 Agent helper 中 Windows 删除旧文件再 rename 的回退。

允许提示的条件是 `isTty && interactive && !json`。无 TTY、`--no-interactive`、`--json` 缺凭据返回稳定 auth error 和设置 `NOTION_TOKEN`/运行 auth 的引导；JSON stdout 只输出一个共享结构化结果。环境 Token 无效直接失败；缓存明确 401 可提示一次替换；403/404、schema、网络/限流失败都不删缓存或循环输入。替换失败/取消保留旧缓存。

不接受 `--token`，不将 Token 放进子进程 argv。对 Authorization、请求/响应异常和调试文本进行秘密值脱敏，不能只依赖日志 key 名匹配。缓存写入使用私有临时文件、校验权限与安全替换，失败保留原文件；clear 后环境变量仍生效，不远程 revoke。

备选包括 Keychain-only 和项目 `.env`：前者增加跨平台凭据依赖且偏离已选本地缓存流程，后者可能进入公开仓库或 chezmoi，因此首版采用上述独立私有文件。

### 7. 独立 bootstrap 先完成 GitHub SSH，再克隆并移交 TS

顺序：

```text
HTTPS 下载 scripts/bootstrap.sh 或 bootstrap.ps1
  → 检查 OS/arch、现有工具和可用权限
  → 准备 Git / OpenSSH / Node 24 + npm
  → 复用或生成 SSH key → 引导 GitHub 注册公钥
  → 验证 SSH 身份及 git ls-remote 的目标仓库访问
  → SSH clone 到 ~/Documents/GitHub/CthuTool（可指定其他目录）
  → 以 local 模式安装已提交 bundle，验证 chc
  → chc dotfiles notion auth
  → chc dotfiles init（主机绑定及已有文件接入）
  → 展示 env setup --dry-run、env setup、config diff/apply 和 mise install 的独立下一步
```

POSIX 与 PowerShell 实现 Node 运行之前的必要平台逻辑，后续业务流程复用 TS。支持 macOS、Windows、Linux 的 x64/arm64；WSL 使用 Linux 路径/运行时。Linux 以官方 Node 可支持的环境为边界，unsupported libc/架构需明确报错，不承诺所有发行版。Git/SSH 可通过平台可信安装设施准备，提权只用于系统先决条件；使用提升权限后必须回到原用户执行 checkout/npm/Token/home 操作，无法做到则停止并给出下一条命令。

Node 下载采用独立、两脚本共同读取的版本/平台/URL/SHA256 锁定表，例如 `scripts/bootstrap-node-runtime.tsv`，首个版本与项目固定 Node 24 版本一致。复用兼容 Node 24/npm；否则把官方完整发行包（含 npm）安装到用户 `~/.cthutool/runtime/node/<version>/<target>`，不能使用 Agent 只有 node 可执行文件的 payload。以可从绝对 Node 路径启动的用户 launcher 固定 chc 的 Node 24；launcher 为子进程前置所选 Node/npm 路径，避免 mise 切换 runtime 破坏 chc 自身。

npm 安装采用独立用户 prefix（`~/.cthutool/npm`），稳定入口位于 `~/.cthutool/bin`。launcher 继承该 prefix 给后续 `chc source use/update`，并执行 prefix 中由 npm 管理的 CLI 入口，因此 relink 后仍使用实际新入口。只在没有冲突的受管入口写入 launcher，用户自有同名文件报冲突。把稳定 bin 路径写入平台支持的用户 PATH/带标记 profile 片段，并让迁移模板保留该片段；验证新 shell 和子进程找到相同 Node/npm/chc。现有低层安装器默认行为继续兼容，新 bootstrap 用 scoped 环境变量和 local mode 衔接，无需更改原 managed source 的历史默认目录。

GitHub SSH 复用用户明确选择/已有可用 key，处理 agent 与带 passphrase 的 key；不得覆盖私钥、关闭 host key 校验、盲信 ssh-keyscan 或泄露私钥。`ssh -T` 的退出码不能单独代表失败，结合 GitHub 响应及目标 `git ls-remote` 验证。必要时引导用户在 GitHub 页面添加公钥并继续检查。自动化模式必须已有可用 SSH 与明确 host/Token，否则阶段性失败；不会等待浏览器操作，也不改用 HTTPS clone。

默认目标目录展开为当前用户的 `~/Documents/GitHub/CthuTool`，支持 `--dir`/PowerShell `-Directory`。正确已有 checkout 原样复用；若已有 HTTPS origin，明确显示并要求显式 `--configure-ssh-remote` 后才改为对应 SSH origin，不在后台改 remote。非仓库/其他仓库冲突拒绝；dirty checkout 不 reset、不 pull，验证 bundle/schema 后可安装已有内容并提示状态，后续更新另行显式执行。

每个阶段验证真实状态而不只依赖“已完成”标记。Token 失败或取消时保留 Git/Node/clone/chc，退出为引导未完成并提供 auth/init 的恢复命令；不为失败 auth 重新克隆。替代方案“先 HTTPS 克隆、安装后再配置 SSH”已被用户明确排除。

### 8. 接入已有文件，保护 Git 身份、completion 和最新服务语义

config apply 负责 source → home；config add 负责本机已有文件 → 可审查 source 改动。仓库刚初始化时不会自动吸收本机配置；没有对应受管目标也不表示要删除本机文件。chezmoi 的 [apply](https://www.chezmoi.io/reference/commands/apply/) 按目标状态更新文件，[add](https://www.chezmoi.io/reference/commands/add/) 把本机内容纳入源，[merge](https://www.chezmoi.io/reference/commands/merge/) 提供合并能力。chc 在 config 组呈现这两个方向；init 的首次引导可委托同一文件接入流程。

配置文件管理采用 chezmoi 薄封装：

1. `config add <path...>` 仅接收显式常规 home 文件，先验证整个输入集合并私有备份；排除凭据、Git 身份和整个 SSH 配置目录。普通文件直接 `chezmoi add --recursive=false --secrets=error`，路径属性由 chezmoi 处理，不自行生成 `dot_` 路径。禁止 force 替换模板。
2. 已有 `.tmpl` 直接调用 `chezmoi merge`，保留用户 `merge.command/args` 并继承真实终端。使用者在原生工具中把保留内容合入源模板；不再自建候选编辑器、三选一决策、收据或 source/target 审查摘要。非交互/JSON 选中模板时，整个输入批次在改源前失败。明确导入的普通文件可非交互处理。
3. chezmoi 的 Git autoAdd/autoCommit/autoPush 开启时拒绝导入，先由用户关闭，确保源改动留待 Git 审查。config add 不执行 apply；外部 merge 工具的编辑行为遵从用户配置。
4. `config apply` 仅保留私有内容/权限/链接备份和链接路径保护。交互模式用 `--less-interactive --force=false` 交给原生逐文件 diff/overwrite/skip/quit；取消或后续失败时，之前明确确认的文件可能已写入，不再承诺交互式整批原子性。非交互/JSON 先跑原生 `apply --dry-run --error-on-conflict --less-interactive --no-tty`，存在需确认的覆盖时整批停止；真正 apply 继续启用冲突检查，禁止强制覆盖。
5. 受管目标查询使用原生 managed，不重复 dump/render 整组内容并逐文件重算；状态与冲突完全由 chezmoi 维护。运行时有 chezmoi 时用 dump-config/execute-template 读取其有效配置和配置路径；未安装时只为离线快照/计划提供只读解析，不保存影子绑定。
6. SSH 配置使用 `private_dot_ssh/create_config` 的原生 create-only 属性：已有 bootstrap key 选择和主机映射保留；缺失时才创建默认配置，不再用模板反读本地文件。

私有备份仍位于 `~/.cthutool/state/dotfiles/<source-id>/`，旧 receipts.json 可保留作历史材料，但不再读取或作为 apply 的权威。Host ID/sourceDir 仍以 chezmoi 配置为唯一绑定；init 完成绑定后仅提供未应用文件的下一步，不因选择跳过文件而失败。config apply 无需先 env setup。

重复封装审查同时核对 env、notion 和 bootstrap：包管理器仍执行真实包安装，mise 保有运行时管理职责；Notion HTTP 的分页/认证/重试及 allowlist 多文件事务是本项目发布契约，chezmoi 不处理该 YAML/manifest 代次，因此保留；固定 Node 24 launcher/完整 npm 运行时保证 chc 与用户 mise 版本独立，保留现有安装器衔接。模型校验和秘密权限策略不作为工具已有合并能力而删除。

旧 `home/dot_gitconfig.tmpl` 包含身份字段，直接删掉字段后 apply 会清空现有 `[user]`。迁移时先备份并将现有 `.gitconfig` 从强制整文件托管移出，身份继续由 Git 自身读取；可选通用 Git 设置写到独立 include 文件，由显式接入动作添加一次 include，不能重写 Git 身份。`env doctor` 显示只读值和来源，缺失时提示 Git 原生命令。

shell/PowerShell 模板接入 chc 已有补全机制及 bootstrap PATH 片段；迁移前后的 `completion enable` 和多次 apply 不能互相擦除或累加初始化。所有平台模板用 fixture home 渲染验证，排查旧仓库绝对路径、`dot` 命令、个人信息和旧 bootstrap URL。

服务迁移按新版 dispatcher 和 health 语义验证，尤其 CTHULHU 的 bash、terminal=none、operations、k3s/k9s。保留 fresh-install 限制、已有集群不覆盖、kubeconfig 组/权限、安全可诊断的 readiness 及固定版本校验；不趁迁移扩大为 workloads/GitOps 部署。

### 9. 分发校验与旧仓库退役分阶段推进

扩展 package files、runtime asset inventory、构建检查、precommit affected 检测及 `.github/workflows/cli.yml` 输入，纳入 `dotfiles/**`、根 chezmoi 声明和 bootstrap 脚本/锁定表。保留稳定 `cli-dist` job 与无关改动成功 skip。资产改动需要快照/schema/render 检查；JS 输入才需要生成不同 bundle 字节，不能把资产测试等同于强制嵌入 JS。

Node 24 独立环境从 committed bundle 运行，安装包移到另一个 cwd 验证资产定位；测试不依赖 Go、开发依赖、Notion Token 或真实软件安装。API 测试使用分页/限流/权限/身份迁移 fixtures；bootstrap 用假命令和临时 home 验证状态机，最终另做可回滚测试机验收，不能在开发者机器偷偷安装服务。

旧仓库只在新链路通过跨平台验收后进入人工退役清单：切换 README/外部入口、标注旧 dot/Go release 停用、停止旧 bootstrap 发布，保留回滚信息。实际修改或归档两个外部仓库不由本次 CthuTool apply 隐式执行。

### 10. 按三类对象组织命令

以下是本变更的命令接口。`chc dotfiles` 根层只显示 init 和 env/config/notion 三个组；按操作对象选择分组后再选择动作，避免在根层混排安装、模板应用和数据同步。三个组均沿用项目共享的 bare-group help 行为，不因查看帮助触发初始化。

```text
chc dotfiles
├── init                         首次接入、选择源、绑定主机
├── env                          软件环境
│   ├── setup [--dry-run]         预览或安装主机所需软件
│   └── doctor                   检查实际工具、服务和运行时状态
├── config                       本机配置文件
│   ├── add <path...>            接入或合并本机文件到仓库
│   ├── diff                     预览模板与本机文件的差异
│   └── apply                    应用仓库模板到本机
└── notion                       Notion 方案与发布快照
    ├── auth                     输入、验证、更换或清除 Token
    ├── diff                     比较 Notion 与本地快照
    ├── pull                     导出 Notion 方案到本地快照
    └── validate                 离线快照校验（高级/CI）
```

| 分组 | 管理对象 | 典型流程 | 写入边界 |
| --- | --- | --- | --- |
| env | 安装的软件、工具、服务健康 | setup --dry-run → setup → doctor | 显式安装软件；不应用 home 配置、不同步 Notion |
| config | shell、终端等配置文件的实际内容 | add → diff → apply | add 写可审查模板，apply 写本机；不修改 Notion 主机方案 |
| notion | 软件目录、toolset、主机定义等方案数据 | auth → diff → pull | API 只读，pull 生成本地 YAML/manifest；不安装软件或应用文件 |

notion 组直接访问 Notion API，管理方案数据与发布快照；`NOTION_TOKEN`、credential 文件名和 `dotfiles/notion/` 目录保持原有命名。它不提供本地主机方案编辑或 Notion 写回。validate 放在 notion 组，用于离线验证方案快照，没有 Token/联网要求；各操作也自动复用同一前置校验，普通用户无需每次手动运行。

init 是跨组的首次接入编排：准备 chezmoi/mise、选择源、绑定已发布 Host ID，并可衔接 config add 的首次文件接入。它不自动执行 env setup、config apply 或 notion pull。之后只调整绑定才重跑 init，日常文件导入直接 config add。初次与主机绑定相关的参数归 init，文件路径归 config add，不把所有日常操作塞进 init 的模式 flags。

帮助只保留上述正式入口，不提供旧平铺操作别名。曾考虑将三个组提升到 chc 根层；当前保留 dotfiles 共同前缀，因为三者共用同一主机绑定和配置源，且能保持本次迁移的清晰边界。

参数适用范围：

- `init --source <checkout>` 指定配置源，`--migrate-from <old-source>` 保护既有 chezmoi 源迁移；`init --host <id>` 保存或切换绑定。
- `env setup`、`env doctor`、`config diff`、`config apply` 的 `--host <id>` 只影响本次操作，仍进行 OS/WSL 校验。
- `config add <path...>` 使用已保存的绑定和固定源，接收一个或多个显式 home 路径，不重新选主机；缺路径报用法，不批量扫描导入整个 home。
- `notion auth/diff/pull/validate --source <checkout>` 可明确定位源，不依赖 cwd；auth 的本地清除动作无须有效源。
- `notion pull --allow-retire <stable-key>` 逐项确认 Notion 中已 retired 的发布项，不绕过 schema/身份校验。
- 共享 `--help`、`--json`、`--quiet`、`--no-interactive`；需要凭据的操作在非交互/JSON 缺 Token 时直接报错。env、config 和 notion validate 不要求 Notion Token。

首次接入：独立 `bootstrap.sh`/`bootstrap.ps1` 准备 Git/OpenSSH/Node 24/npm，完成 GitHub SSH，再克隆到默认 `~/Documents/GitHub/CthuTool`，安装 chc 并执行 notion auth/init。已有 chc 的机器只需先 init；有旧 chezmoi 源时指定迁移选项。bootstrap 和 init 成功均不代表主机软件已安装或配置已应用。

软件环境：

```bash
chc dotfiles env setup --dry-run
chc dotfiles env setup
chc dotfiles env doctor
```

mise 继续管理运行时版本，需要时单独执行外部 `mise install`；env setup 和 config apply 不隐式安装 mise runtimes。

本机已有配置、仓库刚初始化，或日后想把本机改动接入仓库：

```bash
chc dotfiles init
chc dotfiles config add ~/.zshrc
git -C ~/Documents/GitHub/CthuTool diff -- dotfiles/home
chc dotfiles config diff
chc dotfiles config apply
```

init 已完成时省略第一步。config add 先备份和审查，保留已有模板的跨平台变量；未处理冲突时 config apply 拒绝覆盖。已经纳管且接入完成的机器，日常只需 config diff → config apply，不用再次安装软件。示例 Git 路径使用默认源；自定义安装或绑定源时使用实际 sourceDir。

Notion 方案编辑并审查 active 后：

```bash
chc dotfiles notion diff
chc dotfiles notion pull
git -C ~/Documents/GitHub/CthuTool diff
```

之后走正常 Git 审查和发布。CI 或主动检查快照时使用 `chc dotfiles notion validate --source <checkout>`。其他机器显式更新绑定源，再按变更类型选择 env setup 或 config diff/apply；并非每次 pull 都要执行所有步骤。CLI 当前源与配置源相同时可用现有 `chc source update`；开发 worktree 已切源时应分别核对 CLI 源和固定 sourceDir。

两个 diff 的对象在分组帮助中直接说明：config diff 比较模板与本机文件，notion diff 比较 Notion 与仓库快照；notion pull 生成数据文件，Git pull/source update 获取仓库提交。auth 一个入口处理凭据管理；pull 内部处理失败回滚和下次安全恢复，不额外增加恢复命令。

## Risks / Trade-offs

- [Notion 与最新 Git 已有模型/内容漂移] → 首次对齐先输出逐记录映射及五主机展开方案 diff；无损 round-trip 和审查通过前禁止首个 pull 覆盖基准。
- [高级 Notion JSON 字段降低表格编辑便利性] → 只用于嵌套 health/release/service；常用字段保留列，提供 schema/示例和字段位置诊断，不接受任意脚本。
- [Token 是本机明文缓存] → 独立路径、严格权限、秘密值脱敏、可清除；不将其包装成加密存储，也不进入模板与发布物。
- [多文件写入、Windows 文件锁和断电] → 暂存/备份/journal、操作互斥及 generation 校验；中断时阻止运行，下次 pull 内部恢复，冲突保留备份并报告人工处理路径。
- [已有机器配置被新模板覆盖或本机值污染跨平台模板] → 原生 add/merge、less-interactive 冲突提示与私有备份；非交互原生 dry-run，导入结果进入 Git 审查。
- [Node/npm/PATH、sudo、PowerShell profile 的平台差异] → 用户 prefix + 固定 Node launcher、保留 PATH 片段、原用户执行；新终端和 source relink/update 单独验证。
- [安装 service 的副作用] → fixture/parity 为主，真实 k3s 仅在隔离测试机显式验收；不重置已有集群。
- [公开仓库带入旧个人信息] → 迁移资产审查清除 Git 身份默认值与主机私密地址；保留必要的非秘密 schema/page 身份，不复制凭据或用户本地状态。

## Migration Plan

1. 固定并记录上述上游提交，导入必要资产和 parity fixtures，先建立完整统一模型与离线 validate；不切换现有机器源。
2. 交付 Notion schema/主机/toolset 对齐报告及操作说明，在独立明确的数据迁移中完成编辑和审查，保留 page ID/mapping，再验证候选完整 round-trip。
3. 完成 TS runtime、绑定迁移、API sync、共享 auth 和 bootstrap；实现所有无副作用测试及分发检查。
4. 先在临时 home/测试机验收新安装，再在已有 dotfiles 机器验证 sourceDir 迁移、文件导入/合并、未处理冲突保护、Git 身份与 completion。host-neutral 检查和五个 host 的 plan/doctor parity 必须通过。
5. 发布 CthuTool 入口和文档。每台旧机器显式迁移 source/binding，先 diff，再分别 setup/apply/mise install；Token 在本机首次 auth，普通日常操作不依赖实时 Notion。
6. 稳定验收后，按外部退役清单另行停用旧仓库入口与 Go release；本变更不自动归档仓库。

回滚：切回受审查的旧 CthuTool/快照提交，恢复备份的 chezmoi sourceDir/binding，先 diff 再决定配置恢复；Notion 对齐保留迁移映射和变更记录。包安装/服务变更不自动卸载或重置，已安装的 Git/Node/chc 和 Token 不因引导取消而回滚。旧源与配置备份在跨平台验收前保留，API sync 的事务失败只恢复快照代次，不修改 Notion。
