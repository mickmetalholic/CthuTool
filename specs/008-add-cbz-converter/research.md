# 008-add-cbz-converter 研究结论

## 1) PDF 处理方案：外部 CLI vs 纯 JavaScript

### Decision

默认且唯一采用 Poppler CLI 方案（`pdfinfo` + `pdftoppm`），将其作为运行前置依赖。

### Rationale

- 外部 CLI（Poppler）在转换质量与速度上通常更强，尤其面对大体积、复杂矢量页面时优势明显。
- 虽然安装门槛更高，但目标用户可接受预装 Poppler；本项目优先保证转换质量、复杂 PDF 兼容性和批处理吞吐。
- `pdfinfo` + `pdftoppm` 组合成熟稳定，便于在 PDF 分支实现高质量与确定性输出。

### Alternatives considered

1. **纯 JS（`pdf-lib` + canvas/sharp）**  
   - 说明：`pdf-lib` 更擅长 PDF 创建/编辑，不是强页面栅格化引擎；页面渲染仍需依赖专门渲染器。  
   - 结论：质量、性能与复杂 PDF 兼容性不满足最终目标，放弃。

2. **双引擎自动切换（CLI + 纯 JS）**  
   - 优点：理论上兼顾可用性与性能。  
   - 缺点：实现复杂、行为差异大、测试矩阵膨胀。  
   - 结论：不采用，保持单一 PDF 引擎策略。

## 1.1) PDF 预检与错误引导（强制）

### Decision

启动时在任何扫描与转换前执行 `checkDependencies()`：

- `pdftoppm -v` 返回码必须为 `0`
- `pdfinfo -v` 返回码必须为 `0`
- 任一失败则立即终止任务

### Rationale

- 及早失败，避免进入任务后才报环境错误。
- 统一错误出口，方便输出分平台安装指南。

### 必须实现的错误提示

- **macOS**: 提示 `brew install poppler`
- **Debian/Ubuntu**: 提示 `sudo apt-get install poppler-utils`
- **Windows**: 提示 `choco install poppler`，并提示可从 Poppler for Windows 下载并将 `bin` 加入 `PATH`  
  推荐链接：<https://github.com/oschwartz10612/poppler-windows/releases/>

## 1.2) PDF 命令执行安全约束（强制）

### Decision

- 外部命令统一走安全参数传递（优先 `spawn/execFile` 参数数组；若使用 shell 命令字符串，路径必须双引号包裹并进行转义）。
- 所有用户输入参数（如 `--dpi`）先经 `valibot` 校验为合法数值范围，再用于命令参数拼接。

### Rationale

- 降低命令注入风险。
- 保障包含空格、特殊字符路径时的稳定性。

## 1.3) PDF 进度汇报策略（与 pdftoppm 配套）

### Decision

单文件 PDF 进度采用三段式：

1. `pdfinfo` 获取总页数并设置该文件进度条 `total`
2. `pdftoppm` 一次性转换全部页面（期间保持稳定进度条可见，并展示处理中状态文案）
3. 命令成功后进度条一次性更新为 `total`

### Rationale

- 避免逐页调用 `pdftoppm` 造成高昂进程创建开销。
- 在保持高吞吐的前提下，仍提供可感知的处理中反馈。

## 2) ePub 处理方案：图片提取 vs 浏览器截图

### Decision

采用“直接提取优先，浏览器渲染兜底”的混合策略：

1. 解析 ePub 包结构，按 spine 顺序优先提取可直接复用的图片资源；  
2. 对无法直接提取或内容为复杂排版章节，再使用 Puppeteer 渲染截图。

### Rationale

- 直接提取路径对“图片型 ePub”吞吐更高、资源消耗更低，避免 Puppeteer 启动与页面渲染开销。
- Puppeteer 对复杂 HTML/CSS 的还原度高，可作为兼容兜底确保内容完整。
- 两阶段策略可避免“简单文件过度处理”，同时保证复杂文档不降级。

### Alternatives considered

1. **全量 Puppeteer 截图**  
   - 优点：实现统一、视觉一致性高。  
   - 缺点：慢且占资源，不适合大批量。  
   - 结论：不作为默认主路径。

2. **只做图片提取，不渲染**  
   - 优点：速度快、实现相对简单。  
   - 缺点：对图文混排、样式驱动页面会丢失语义与版式。  
   - 结论：兼容性不足。

## 3) 核心架构与模块设计

### Decision

采用分层模块化架构，统一转换器接口：

- CLI 入口模块（参数解析 + 交互）
- 文件扫描与任务调度模块（递归扫描 + 保留相对路径映射）
- 转换器模块（`Converter` 接口，`PdfConverter` / `EpubConverter` 实现）
- 进度与日志模块（进度条与结构化日志）
- 文件打包模块（有序图片打包为 CBZ）

### Rationale

- 满足 SRP 与可测试性；每层责任边界清晰。
- 对上层调度器屏蔽 PDF/ePub 差异，实现统一批处理流程。
- 易于后续扩展新格式（如 CBR、MOBI）。

## 4) 并发控制与资源管理

### Decision

- 文件级并发：使用 `p-limit`，默认并发 `min(4, cpuCount)`，支持 CLI 参数覆盖。
- PDF 渲染并发：遵循文件并发池，不额外放大单文件内部并发，避免内存峰值失控。
- Puppeteer 策略：全局单 Browser 实例；截图阶段仅允许 1~2 个 Page 并发（默认 1）。
- 进度展示策略：维护 `activeTasks` 视图，实时展示多个并发文件的子进度，而不是仅展示单个“当前文件”。

### Rationale

- 批处理吞吐主要来自文件级并发；盲目提高章节级并发会显著抬升内存与 CPU 抖动。
- 单浏览器复用可显著降低冷启动成本，减少频繁启动/销毁导致的不稳定性。
- 对重资源操作单独限流，可避免影响同批次其他轻量任务。
- 并发可观测性必须与调度模型一致，否则用户无法判断队列是否卡住或哪个文件慢。

## 5) 并发进度条设计（新增）

### Decision

采用“1 个总体进度 + N 个活跃任务子进度”的终端视图：

- 总体进度条：`processed/total`
- 子进度条：数量固定为 `fileConcurrency`，每个槽位绑定一个活跃任务
- 槽位复用：任务结束后将同一槽位分配给下一个待处理文件

### Rationale

- 与并发池规模严格对齐，信息密度和稳定性更好。
- 避免为每个历史任务保留进度条导致终端刷屏。
- 用户可以同时观察多个正在执行文件的页进度，满足并发场景可观测性要求。

## 6) 进度 UI 稳定性与日志隔离

### Decision

- 直接复用现有 `cli-progress` `MultiBar` 组件作为唯一进度渲染实现。
- 运行期间日志统一走 `progress-logger`，采用缓冲/串行输出，避免打断进度条。
- 禁止在转换循环中直接调用 `console.log`。

### Rationale

- 复用成熟组件可降低光标控制与终端兼容性风险。
- 进度与日志共用终端时，未隔离输出会导致进度条错位、闪烁或内容断裂。
- 单通道输出模型可确保多并发进度在长任务中持续稳定可读。

## 约束与风险记录

- Poppler 属于外部依赖，需在启动前完成预检并提供分平台安装指引。
- ePub 提取路径需要可靠的阅读顺序判断（spine 优先），否则可能出现页序偏差。
- Puppeteer 在无沙盒环境下需给出明确错误提示与可操作建议。

## 最终技术选型建议（汇总）

1. **PDF**: 默认且唯一使用 Poppler CLI，启动即做依赖预检，缺失时终止并给出分平台安装指引。  
2. **ePub**: 采用提取优先 + 渲染兜底，兼顾性能与复杂内容兼容。  
3. **架构**: 统一 `Converter` 契约 + 分层模块，确保可扩展和可测试。  
4. **并发**: 统一并发池 + Puppeteer 单实例限流，保障稳定吞吐与资源可控。

## 7) Implementation Validation Notes (2026-04-17)

### Executed checks

- `bun test --preload ./tests/setup.ts` in `apps/cli`: **pass** (`41 pass, 0 fail`)
- `bun x tsc --noEmit` in `apps/cli`: **pass**
- `bun x @biomejs/biome check src tests` in `apps/cli`: **fail** (contains pre-existing style issues outside convert-to-cbz target scope)

### Scope note

- New and updated `convert-to-cbz` files were formatted with `biome check --write` and pass local type-check and tests.
- Remaining Biome failures are from previously existing files in the CLI package and were not modified by this feature implementation.
