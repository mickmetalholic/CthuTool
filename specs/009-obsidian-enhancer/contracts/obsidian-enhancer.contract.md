# 合同：obsidian-enhancer

## 1. 插件运行合同

### 1.1 功能入口

- 插件加载后必须注册 4 个 Ribbon 入口：
  1. Open in Eudic
  2. Auto Move
  3. Done Reviewing
  4. Easier

### 1.2 行为合同

- **Open in Eudic**  
  - 仅当前笔记包含词汇标签时执行 deeplink 打开。  
  - 无活动笔记或缺少标签时给出明确 Notice。

- **Auto Move**  
  - 使用 frontmatter 标签与目录前缀匹配确定目标目录。  
  - 命中后重命名到目标目录；未命中时提示未匹配。

- **Done Reviewing**  
  - 更新当前笔记 frontmatter 中 `last review` 为当天日期（`YYYY-MM-DD`）。

- **Easier**  
  - 状态链路：`Again -> Hard -> Good -> Easy -> Complete`。  
  - 无有效状态时仅提示，不强制覆盖。

### 1.3 设置合同

- 设置面板至少包含：
  - `Vocabulary Tag`
  - `Excluded Root Folders`（逗号分隔）
- 设置修改后必须持久化，重启 Obsidian 后生效。

## 2. 构建与部署合同

### 2.1 构建入口

- 包构建命令：`pnpm --filter @cthutool/obsidian-enhancer build`
- 构建脚本需执行：
  1. TypeScript 类型检查（如环境可用）
  2. esbuild 打包
  3. 插件资产同步

### 2.2 输出合同

构建成功后，目标目录必须包含：

- `main.js`
- `manifest.json`
- `styles.css`
- `versions.json`

### 2.3 目标目录解析合同

输出目录优先级：

1. `--outdir=...` 参数
2. `OBSIDIAN_PLUGIN_DIR` 环境变量
3. 默认 `dist`

### 2.4 失败合同

- 目标目录不可写或文件复制失败时，构建必须返回失败状态。  
- 不得出现“主包打包成功但资产缺失仍提示成功”的误导结果。

## 3. 一致性验收合同

- 迁移后用户可观察行为必须与参考实现一致。  
- 已知问题场景（目录匹配错误、输出反馈不清晰等）必须在新包中得到修复并可复验。  
- 合同验证通过后，方可进入后续增量功能迭代。
