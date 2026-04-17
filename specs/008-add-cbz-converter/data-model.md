# 008-add-cbz-converter 数据模型

## ConversionJob

- **用途**: 表示一次批量转换任务的聚合根。
- **字段**:
  - `jobId: string`
  - `inputRoot: string`
  - `outputRoot: string`
  - `status: "pending" | "running" | "completed" | "completed_with_failures" | "failed"`
  - `startedAt: number`
  - `endedAt: number | null`
  - `totalFiles: number`
  - `successCount: number`
  - `failureCount: number`
  - `options: ConversionOptions`
- **校验规则**:
  - `inputRoot` 必须存在且为目录（FR-003）
  - `outputRoot` 必须可创建/可写（FR-010/FR-017）

## SourceComicFile

- **用途**: 表示扫描得到的单个源文件及其处理上下文。
- **字段**:
  - `sourcePath: string`
  - `relativePath: string`
  - `sourceType: "pdf" | "epub"`
  - `targetCbzPath: string`
  - `readable: boolean`
  - `status: "queued" | "processing" | "success" | "failed"`
- **校验规则**:
  - 扩展名必须大小写不敏感匹配 `.pdf`/`.epub`（FR-004）
  - `targetCbzPath` 必须由 `relativePath` 映射生成并保留目录结构（FR-011）

## PageAsset

- **用途**: 表示单个文件转换后的一页图片。
- **字段**:
  - `index: number`（从 1 开始）
  - `tempPath: string`
  - `archiveName: string`（如 `0001.jpg`）
  - `format: "png" | "jpg" | "webp"`
  - `quality: number`
- **校验规则**:
  - `archiveName` 必须连续、固定宽度、前导零（FR-009）
  - 页序必须与阅读顺序一致（FR-008）

## FailureRecord

- **用途**: 表示单文件失败信息，支持总结输出与追踪。
- **字段**:
  - `sourcePath: string`
  - `stage: "scan" | "read" | "convert" | "archive" | "write"`
  - `reason: string`
  - `recoverable: boolean`
- **校验规则**:
  - `reason` 必须为用户可读描述（FR-013/FR-017）
  - 单文件失败不得改变任务继续执行语义（FR-013）

## ConversionOptions

- **用途**: 统一 PDF/ePub 转换相关可配置项。
- **字段**:
  - `imageFormat: "png" | "jpg" | "webp"`
  - `imageQuality: number`（1-100）
  - `dpi: number`（PDF 渲染建议 150-300）
  - `fileConcurrency: number`
  - `epubRenderConcurrency: number`
- **校验规则**:
  - 默认值存在且公开（FR-012）
  - `fileConcurrency >= 1`
  - `epubRenderConcurrency` 默认 1，建议最大 2

## ProgressSlot

- **用途**: 表示并发进度视图中的一个可复用子进度槽位。
- **字段**:
  - `slotId: number`
  - `taskId: string | null`
  - `displayName: string | null`
  - `current: number`
  - `total: number`
  - `status: "idle" | "running" | "done" | "failed"`
- **校验规则**:
  - 同一时刻一个槽位最多绑定一个 `taskId`
  - 槽位总数必须等于 `fileConcurrency`
  - `taskId` 释放后槽位可复用给下一任务

## DependencyCheckResult

- **用途**: 表示启动预检（Pre-flight Check）结果。
- **字段**:
  - `pdftoppmAvailable: boolean`
  - `pdfinfoAvailable: boolean`
  - `platform: "win32" | "darwin" | "linux" | "other"`
  - `installHint: string | null`
- **校验规则**:
  - 两项命令任一不可用时，任务状态必须保持未启动并直接失败退出
  - `installHint` 必须提供可执行的安装建议命令

## 状态流转

### Job 级状态

`pending -> running -> completed | completed_with_failures | failed`

- 当有至少一个文件成功且至少一个文件失败时为 `completed_with_failures`。
- 当初始化阶段失败（路径非法、无权限）可直接 `failed`。

### File 级状态

`queued -> processing -> success | failed`

- 任一文件进入 `failed` 后，不影响其他 `queued` 文件继续处理。
