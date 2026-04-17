# Quickstart: 批量 PDF/ePub 转 CBZ

## 1. 前置条件

- 已安装仓库要求版本的 Node/Bun 与 pnpm
- 已在仓库根目录执行依赖安装
- 脚本实现位于 `apps/cli/src/scripts/convert-to-cbz`，通过 `scripts` 子命令调用
- 脚本包需包含 `script.json`（元信息）与 `index.ts`（默认执行入口）
- 系统需预装 Poppler，并确保 `pdftoppm` 与 `pdfinfo` 在 `PATH` 可用
  - macOS: `brew install poppler`
  - Debian/Ubuntu: `sudo apt-get install poppler-utils`
  - Windows: `choco install poppler` 或从 <https://github.com/oschwartz10612/poppler-windows/releases/> 下载并将 `bin` 目录加入 `PATH`

## 2. 运行命令

在仓库根目录执行（示例）：

```bash
pnpm --filter @cthutool/cli run scripts -- convert-to-cbz --input ./samples --format jpg --quality 90 --concurrency 4
```

若省略 `--input`，命令会进入交互式路径输入。

验证记录（2026-04-17）：

- 已确认 `convert-to-cbz` 脚本元数据与入口可被 `scripts` 子命令发现
- 已确认无目标文件场景会提前退出并返回 0 文件总结
- 已确认批处理流程会输出完成总结（成功数、失败数、输出目录）

## 3. 结果验证

1. 扫描后应识别所有 `.pdf/.epub`（大小写不敏感）。  
2. 在 `<input>/.output` 下按相对目录生成 `.cbz`。  
3. 同名文件在不同子目录中不会互相覆盖。  
4. 任一文件失败时，其余文件继续执行。  
5. 并发执行时终端可同时看到多个活跃文件子进度（数量与并发池一致）。  
6. PDF 文件进度遵循：先 `pdfinfo` 取页数，再一次性 `pdftoppm` 转换，完成后进度直接到 100%。  
7. 终端结束摘要包含成功数、失败原因、输出目录、总耗时。

## 4. 性能与资源建议

- 默认文件并发建议 `min(4, CPU核心数)`。
- ePub 渲染兜底阶段默认单浏览器实例，页面并发建议 `1`。
- 大批量时优先使用直接提取路径，可显著降低 Puppeteer 开销。
- 进度展示建议采用 `1` 条总体进度 + `concurrency` 条活跃任务进度条，避免只显示单文件造成信息缺失。
- PDF 禁止逐页创建 `pdftoppm` 进程，必须一次性转换以减少进程创建开销。
- UI 层优先复用现有 `cli-progress` 组件，并通过统一 logger 输出日志，避免打断进度条。

## 5. 测试建议（TDD）

- 单元测试：
  - 扫描与路径映射（保留相对目录）
  - 页序归一化与前导零命名
  - 策略决策（ePub 提取优先/渲染兜底）
- 集成测试：
  - 混合目录批处理
  - 单文件损坏不中断
  - 权限受限路径错误提示
