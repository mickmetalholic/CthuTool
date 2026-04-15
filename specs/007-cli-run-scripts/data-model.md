# Data Model - CLI 脚本发现与执行

## 实体：ScriptId

- **描述**: 脚本在 CLI 与文件系统中使用的稳定标识符。  
- **字段**:
  - `value`: `string`，与 `apps/cli/src/scripts/<value>/` 目录名一致。  
- **校验规则**:
  - 非空字符串。  
  - 建议使用 kebab-case（字母、数字、连字符）；非法字符在 schema 或规范化规则中拒绝或显式映射（实现时锁定一种策略）。  
- **关系**: 每个 `ScriptPackage` 恰好对应一个 `ScriptId`。

## 实体：ScriptManifest（script.json）

- **描述**: 单个脚本包的机器可读元数据，供列表与帮助展示。  
- **字段**（最小集，可扩展须向后兼容）:
  - `id`: `string`，必须与父目录名相同。  
  - `title`: `string`，短标题，用于选择与列表。  
  - `description`: `string`（可选），较长说明。  
- **校验规则**:
  - 全文由 valibot schema 校验；缺失必填字段或 `id` 与目录不一致则该包标记为无效并带原因（不阻塞其他包发现，行为见 spec Edge Cases）。  
- **状态**: 静态文件；无运行时迁移。

## 实体：ScriptPackage

- **描述**: 文件系统中的一个可运行脚本包。  
- **字段**:
  - `id`: `ScriptId`  
  - `rootPath`: 绝对或相对于包解析根的目录路径（实现约定）  
  - `manifest`: `ScriptManifest`  
  - `entryRelative`: 固定为 `index.ts`（相对 `rootPath`）  
- **校验规则**:
  - 必须存在 `script.json` 与 `index.ts`。  
  - `manifest.id` 必须等于目录名。  
- **关系**: 多个 `ScriptPackage` 组成 `ScriptCatalog`。

## 实体：ScriptCatalog

- **描述**: 某次发现流程得到的全部脚本包集合。  
- **字段**:
  - `packages`: `ReadonlyArray<ScriptPackage>`  
  - `warnings`: `ReadonlyArray<{ path: string; message: string }>`（可选，用于部分包无效时）  
- **规则**:
  - **重复 id**：若两个有效包出现相同 `id`（理论上不应发生），实现必须定义确定性优先级或报错；推荐以首次发现或字典序报错并拒绝运行直至修复。  
- **操作**:
  - `listSelectable()`：返回可供用户选择的 `id` + `title` 列表。  
  - `resolve(id)`：返回 `Result<ScriptPackage, CatalogError>`。

## 实体：RunRequest

- **描述**: 一次「运行某内置脚本」的请求。  
- **字段**:
  - `targetId`: `ScriptId | undefined`（CLI 未传参时为 `undefined`，进入交互或报错）  
  - `isInteractive`: `boolean`（TTY 检测）  
- **状态转换**:
  - `targetId` 已定义 → 解析并执行。  
  - `targetId` 未定义且 `isInteractive` → 展示选择 UI 后执行。  
  - `targetId` 未定义且非交互 → 失败并提示用法。

## 实体：ScriptRunOutcome

- **描述**: 一次执行的结果摘要（用于测试与日志）。  
- **字段**:
  - `status`: `'ok' | 'validation_failed' | 'load_failed' | 'execution_failed'`  
  - `exitCode`: `number`  
- **规则**: 与 `process.exitCode` 及 neverthrow 错误映射一致。
