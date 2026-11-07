## 1. 固定迁移基准

- [x] 1.1 记录 dotfiles `8e59d3283eba2d99b8abcc327e694b23a2d4cc8e` 和 dotfiles-bootstrap `44d274e592f1c640ab523f958e68453f0bb121de` 的来源、资产与行为迁移表；核对远端 SHA，交付不依赖本地旧 checkout 的清单。
- [x] 1.2 导入五个 canonical host 的 inventory/doctor/setup-dry-run 基准 fixtures 及 CTHULHU、hostconfig、setup-dispatch 关键案例；核对 fixture 数量、来源和脱敏结果，目标机器无需 Go 即可使用这些参考数据。
- [x] 1.3 建立受影响区域的测试边界与副作用替身（进程、文件系统、HTTP、平台探测）；用一个临时 home 的 smoke case 验证不会调用真实包安装器、写用户配置或启动服务。

## 2. 统一模型和运行资产

- [x] 2.1 在 CLI domain 定义版本化 schema，区分 package/runtime 与 command/desktop/framework/service，并覆盖 owner/method/handler、health、release、service、host/toolset；用最新基准数据验证全部字段可解析，未知字段与错误引用会失败。
- [x] 2.2 将 YAML parser 声明为 CLI 直接依赖并更新 lockfile；验证 CLI typecheck 和独立 bundle 不依赖 root devDependency 的提升。
- [x] 2.3 按 design 布局迁移数据和 home 模板到 `dotfiles/`，添加根 `.chezmoiroot`/版本声明并重定位 include；用临时 home 对三类 OS 渲染，核对无旧绝对路径或误落入 home 的仓库文件。
- [x] 2.4 实现与 cwd 无关的 source/资产解析及 manifest 版本、摘要、引用验证；在另一个 cwd 验证数据读取，缺失资产、未知 schema 和中断 generation 必须在计划生成前失败。
- [x] 2.5 根层只注册 init 和 env/config/notion 三组，分别接入 env setup/doctor、config add/diff/apply、notion auth/diff/pull/validate 及共享 flags/JSON/错误/help/completion；验证没有平铺操作别名，裸组无 Token/绑定时只显示职责帮助且零副作用，两个 diff 的帮助明确比较对象。

## 3. Notion 字段与首次数据对齐方案

- [x] 3.1 交付 sources.json 和版本化字段映射/schema 文档，保留 Kind 分类并定义 Software Kind、Health Config、各 OS Owner/Handler/Config；用 k9s 和 k3s 完整 fixture 验证 JSON rich_text 可无损表达最新模型。
- [x] 3.2 交付逐记录迁移报告格式与已知漂移案例，覆盖 page ID、stable key、缺字段及展开计划差异；验证旧 exporter 模型无法表达的字段均有明确目标映射，无静默丢弃路径。
- [x] 3.3 交付五主机、旧 Notion 四主机与 toolset 的对齐操作表，明确两个已知重命名及 work-mac/linux-devbox 不可自动映射；审查表逐项标明保留、补建、重命名或 retirement 的数据动作及验证方式。

## 4. env 软件计划、安装和诊断

- [x] 4.1 实现 host/toolset 展开、合并去重、显式 tools/exclude、平台 owner 和 runtime 边界；用五主机 fixtures 对比最终清单，并验证未知 host 不产生默认安装计划。
- [x] 4.2 实现 `env setup --dry-run` 及可解释的人类/JSON 计划，复用共享模型校验；用进程调用记录验证 dry-run 不触发安装、Notion、config apply 或 mise install。
- [x] 4.3 迁移 apt/brew/cask/winget/powershell-gallery/system 等平台调度，保留 manual/fallback 与外部 owner 语义；通过模拟安装结果验证选择、跳过、失败诊断及重跑幂等行为。
- [x] 4.4 迁移 docker-engine、official-release、oh-my-zsh、codex-cli、claude-code 等 handler；用架构、checksum、版本和已安装案例验证分派及错误行为，不执行 Notion 中的任意 shell 文本。
- [x] 4.5 迁移 k3s fresh-install/service handler 和 kubeconfig 策略；用 CTHULHU 案例验证固定版本、已有集群不覆盖、readiness/权限及无 workloads/GitOps 副作用。
- [x] 4.6 实现 `env doctor` 的 command/path/systemd/kubernetes-api/kubeconfig 与 blocking/optional/manual 结果；通过五主机诊断 parity 和无绑定 host-neutral 场景验证，无需 Notion 凭据。
- [x] 4.7 接入 config diff/apply 的 chezmoi 适配与 mise 使用引导；验证 env setup 与文件操作边界，接入完成后可独立 config apply，config diff 不改 home，config apply 不导入本机内容或安装软件。

## 5. init 主机接入与 config 文件管理

- [x] 5.1 在 init 内实现本地已发布主机候选集、OS/WSL 过滤、计划预览及 `--host` 非交互绑定；测试无网络选择、OS 错配、别名歧义、unknown host 和重跑 init 调整绑定，不新增独立主机引导命令。
- [x] 5.2 在 chezmoi 配置中只保存 canonical `[data.local].host` 和固定 sourceDir，只有 init 保存选择；env setup/doctor 和 config diff/apply 的 `--host` 只影响本次执行，config add 使用已保存绑定；用配置 diff 验证没有复制完整主机方案或本地软件覆盖。
- [x] 5.3 实现 init 的 chezmoi/mise 准备、`--source/--host` 和幂等源接入，已有绑定默认保留、仍可继续本机文件接入；测试新安装、已有同源、不同源冲突及非交互缺 host，确认不执行 package setup/home apply/mise install。
- [x] 5.4 实现 `init --migrate-from` 的旧配置备份、路径核对、legacy hint 提示和成功后绑定替换；测试取消、错误 host、保存失败和恢复备份，旧 checkout/home 文件不被覆盖。
- [x] 5.5 验证 `chc source use` 切换 CLI worktree 后保留固定 dotfiles source；补充跨源集成测试，源缺失或版本不兼容必须报错而非静默回退。
- [x] 5.6 将 Git 身份改为只读诊断并迁移旧整文件 Git 模板；用包含 user/include/自定义项的现有 `.gitconfig` 验证身份及无关配置保留，可选通用设置只接入一次 include。
- [x] 5.7 让 shell/PowerShell 模板保留现有 completion 与 bootstrap PATH 片段；验证 enable → apply → apply 后补全有效、PATH 仍能找到 chc、初始化块不重复。
- [x] 5.8 config add 对显式常规 home 路径做整批验证与私有备份，复用 chezmoi add 管理源路径/属性；排除身份、凭据和 SSH 配置，旧审查收据不再参与运行。
- [x] 5.9 已有模板复用 chezmoi merge 和用户 merge.command/args，继承真实终端；非交互/JSON 不启动模板编辑器，源改动保留 Git 审查，不自动提交/推送。
- [x] 5.10 config apply 复用原生状态和 less-interactive 冲突提示，备份后应用；非交互先原生 dry-run/error-on-conflict，真正应用禁止 force，交互明确采用原生逐文件语义，可独立于 env setup。

## 6. notion auth、Notion HTTP 与私有凭据

- [x] 6.1 实现固定 API 版本的 HTTP adapter、认证/source metadata 读取、超时和错误分类；用 HTTP fixtures 验证 401、403/404、429/过载 Retry-After、网络失败和最多三次重试，禁止泄露 Authorization。
- [x] 6.2 实现 Token cache 的版本化读取和权限受限写入：POSIX 目录 0700/文件 0600，Windows 当前用户 ACL，拒绝不安全链接；通过权限检查和故障注入验证保存失败不丢旧缓存、不遗留可公开读取的秘密。
- [x] 6.3 实现共享 ensure-auth 的 env → cache → 隐藏输入顺序，新输入验证三个 source 读权限后才缓存；测试 env 优先且不落盘、缺权限不保存、缓存 401 至多一次替换及取消保留旧缓存。
- [x] 6.4 实现单一 `notion auth` 入口和显式 `--source`：无凭据隐藏输入，有凭据可选择验证/更换/清除，不增加模式 flags；测试清除不需要 API/有效 source、不远程 revoke，更换尊重环境优先级，非交互/JSON 只验证当前凭据且不修改缓存。
- [x] 6.5 对 `!TTY`、`--no-interactive`、`--json` 强制禁止凭据提示，并接入统一错误输出；通过集成测试验证缺 Token 非零退出、JSON stdout 只有一个结果且不包含交互文本。
- [x] 6.6 覆盖 HTTP error、debug、任意反射文本、子进程参数和 JSON 的秘密值脱敏；使用假的可辨识 Token 做泄露回归测试，确认仓库 diff、日志及诊断输出均无明文。

## 7. notion diff/validate、规范化与身份保护

- [x] 7.1 实现三个 source 的 schema 校验、完整 query 分页和 relation property 分页；测试多页关系和末页失败，确认不使用截断数据生成候选快照。
- [x] 7.2 通过共享模型完成 Notion 字段规范化、复杂 JSON、多段 rich_text 和旧字段受控转换；测试重复 ID、悬空引用、冲突列/JSON、未知 model 字段及完整 service/release round-trip。
- [x] 7.3 将旧 page-ID manifest 迁到 `dotfiles/notion/manifest.json`，实现 active/draft/retired、稳定键迁移映射及 tombstone；测试已发布项消失、改 draft、未知重命名和权限不可见均不能被当作删除。
- [x] 7.4 实现集合语义关系比较和稳定 YAML 序列化；用乱序 API 响应验证无意义重排消失、新增成员顺序稳定、重复生成字节一致。
- [x] 7.5 实现 notion diff 的人类/JSON 差异与 hasChanges，以及 notion validate 的离线模型/摘要/引用校验；验证 diff 只读且区分有效差异和错误，validate 无绑定/Token/网络也能运行，均不执行内部恢复写入，不接受 connector/snapshot/mode 参数。
- [ ] 7.6 使用直接 API 重新读取实际三个数据源，更新第 3 组对齐报告并生成待审查候选 diff；以 page ID 和五主机展开计划验证差异来源，字段/记录编辑交付为独立显式动作，未对齐时不允许首次 pull 覆盖基准。

## 8. notion pull、本地事务和内部恢复

- [x] 8.1 实现显式 `--source` 的可写 Git checkout 校验及生成文件 allowlist；测试 package 安装目录、错误源和越界写入被拒绝，defaults/模板/sources 不被同步覆盖。
- [x] 8.2 实现 pull 的完整候选验证和逐 stable-key `--allow-retire`；验证缺少退休确认、未审查身份迁移或未完成首次对齐时仓库文件保持原样。
- [x] 8.3 实现源操作锁、基线摘要、同文件系统暂存、上一代备份和持久事务 journal；对每个替换点注入异常/中断，验证整代回滚或阻止使用半成品，并保留恢复材料。
- [x] 8.4 将中断检测和安全恢复并入下一次 notion pull 的内部前置阶段，并让 env setup/config apply 拒绝中断 generation；测试局部恢复先于认证/读取且不需要 API，存活写进程或后续用户编辑冲突时保留材料并输出人工处理位置，不暴露独立恢复命令。
- [x] 8.5 完成已对齐 API fixture → notion diff → notion pull → notion validate → host plan 的端到端验证；确认输出仅为受控 YAML/manifest，无 commit/push、另一 checkout 更新、Notion 写入或自动安装。

## 9. 独立 bootstrap 与 SSH clone

- [x] 9.1 新增 POSIX/PowerShell 入口和共同的 Node 24 完整发行包 URL/SHA256 锁定表；覆盖六个平台目标及 unsupported 环境，校验锁定版本与项目 Node 要求一致且下载包含 npm。
- [x] 9.2 实现先决条件检测、Git/OpenSSH 准备、Node/npm 复用或用户目录安装；用假命令覆盖缺工具/不兼容版本/下载校验失败/提权后恢复用户身份，不对开发机做真实系统安装。
- [x] 9.3 实现 SSH key 发现/选择/生成、公钥注册指引、agent/passphrase 和 GitHub/仓库读取验证；测试不覆盖既有私钥、保持 host-key 校验、GitHub 特殊退出码及认证失败无 HTTPS 回退。
- [x] 9.4 实现 SSH clone 默认 `~/Documents/GitHub/CthuTool`、`--dir`/`-Directory`、已有 checkout 复用及显式 HTTPS remote 转换选项；测试路径含空格、无关目录冲突、dirty checkout 不 reset/pull、远程 URL 保持预期。
- [x] 9.5 以 local mode 接入现有安装器和已提交 bundle，建立用户 npm prefix、固定 Node 24 launcher 与 PATH；在临时 home 验证无 Go/pnpm/Bun/build 依赖，新终端和子进程可用且用户文件无 root 所有权。
- [x] 9.6 验证 launcher 下 `chc source status/use/update` 使用实际 checkout、SSH remote 和相同 npm prefix；覆盖 mise 切换 Node 版本后 chc 仍使用 Node 24，不生成第二个隐藏 clone。
- [x] 9.7 bootstrap 安装后按顺序调用 TS notion auth、统一 init，传递明确的非交互 host/flags；测试已有配置冲突可衔接 config 接入且不重复引导、不自动 notion pull/env setup/config apply/mise install，不在脚本另存 Token 或编写业务编辑器。
- [x] 9.8 实现分阶段恢复和取消/失败输出；用 auth 取消、API 不可达、未知 host、缺少非交互输入案例验证已安装状态保留、退出非零、重跑不重复克隆和损坏用户配置。

## 10. 分发和 CI

- [x] 10.1 将 dotfiles 数据、模板、根 chezmoi 声明及非秘密 metadata 纳入 package files 和资产 inventory；检查 installable package 文件清单，漏掉任一必需模板时验证必须失败。
- [x] 10.2 更新 bundle/asset 检查及 precommit affected 检测，纳入新源文件、根 dotfiles 资产、bootstrap 和运行时锁定表；用输入矩阵测试确认相关变更触发检查，无关改动仍成功 skip。
- [x] 10.3 扩展 `.github/workflows/cli.yml` 的离线 schema/snapshot/render 校验，保留稳定 `cli-dist` job；验证 PR/main 的 required-safe 行为，无 Token 也能完成检查且不安装 host 软件。
- [x] 10.4 生成并提交一致的 CLI bundle，在 Node 24 下从独立目录安装/调用 committed distribution；验证分组 help、notion validate、五主机 env setup --dry-run 可定位资产，不需要源码编译、Go 或开发依赖。

## 11. 文档、集成验收和退役交接

- [x] 11.1 更新 CLI README 和迁移文档，按 env/config/notion 三类组织帮助与示例，init 只作跨组首次接入；核对 config add 的路径、source/host 参数、config/notion diff 的比较对象、单独 config apply、auth 内的 Token 操作、pull/Git 更新区别，不保留平铺别名或旧入口。
- [x] 11.2 交付旧机器迁移、事务恢复与回滚操作手册，并列出旧 dot/Go release/dotfiles-bootstrap 的外部退役清单；验证恢复 sourceDir/binding 的步骤可复现，未授权时不自动编辑或归档外部仓库。
- [x] 11.3 汇总模型、计划、五主机 doctor、绑定、凭据、同步和 bootstrap 的集成测试，执行 CLI 目标 lint/typecheck/tests 及 `pnpm run check:cli-dist`；记录通过结果，不以真实服务安装代替自动测试。
- [ ] 11.4 在隔离 macOS/Windows/Linux 测试环境验收新安装、已有源迁移及本机已有配置/仓库刚初始化的接入，并覆盖 WSL 及目标架构；交付验收矩阵与未覆盖项，真实 k3s/软件安装只在显式选择的测试机进行，未通过前不切换旧入口。
- [x] 11.5 执行 `openspec validate apps-cli-migrate-dotfiles --strict` 和 `git diff --check`，核对实际 diff 范围；确认生成的 `.agents/.zcode` OpenSpec skills、受保护业务插件及邻近 changes 均未修改。

## 12. 原生能力复用与重复封装审查

- [x] 12.1 删除自建接入决策/收据/摘要/模板临时副本和路径映射，使用原生 add/merge/apply/managed；读取配置优先原生，SSH 改为 create-only。核对 env/Notion/bootstrap 保留模块的职责与必要性。
- [x] 12.2 用真实 chezmoi 验证普通文件导入、模板合并工具/终端、交互 skip/overwrite、非交互冲突与审查后改动、源更新、私有备份和 JSON 输出；无真实 home/系统安装副作用。
- [x] 12.3 更新规格、操作与回滚文档，重新生成 CLI bundle 并通过目标 lint/typecheck/tests、分发校验、OpenSpec strict 和 diff/scope 检查。

## 13. init 环境检查可见性

- [x] 13.1 init 输出 OS/架构/WSL、Node、chezmoi/mise 的检查、安装选择、路径和可读版本，保持已有工具复用且不自动升级；JSON 返回结构化结果，quiet 抑制进度。
- [x] 13.2 验证安装/失败/复用事件及真实 CLI 的普通、JSON、quiet 输出，更新操作文档并重新验证类型、目标测试、bundle、OpenSpec 与 diff 范围。
