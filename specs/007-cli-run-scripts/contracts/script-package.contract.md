# Contract: 内置脚本包（Script Package）

## 文件布局

- 根路径：`apps/cli/src/scripts/`（仓库内相对 `apps/cli` 源码树）。  
- 每个脚本包占一个子目录：`<script-id>/`。  
- 必填文件：  
  - `script.json` — 元数据  
  - `index.ts` — 入口  

## script.json

- 编码：UTF-8。  
- JSON 必须符合 `ScriptManifest` schema（见 `data-model.md`），由 valibot 在运行时校验。

### 最小示例

```json
{
  "id": "hello-world",
  "title": "Hello World",
  "description": "Demonstration script that prints a greeting."
}
```

## index.ts 入口

- 必须提供 **默认导出**。  
- 默认导出必须为可调用的函数：  
  - 推荐：异步函数 `async function (): Promise<void>`。  
  - 允许：同步函数 `function (): void`，由运行器包装为 Promise。  
- 禁止依赖未文档化的全局注入；如需配置，应在后续迭代扩展契约。

## 标识符

- `script.json` 中的 `id` 必须与父目录名 `<script-id>` **完全一致**。  
- 不一致时：该包视为无效，发现流程记录错误并跳过（或按实现统一策略），且不得出现在可选列表中。
