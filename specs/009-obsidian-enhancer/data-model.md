# 009-obsidian-enhancer 数据模型

## EnhancerSettings

- **用途**: 插件运行时可持久化设置聚合。  
- **字段**:
  - `vocabularyTag: string`
  - `excludedRootsCsv: string`
- **校验规则**:
  - `vocabularyTag` 为空时回退默认值 `vocabulary`
  - `excludedRootsCsv` 支持逗号分隔，解析后统一小写比较

## FolderMatchEntry

- **用途**: 自动移动功能中的目录匹配候选项。  
- **字段**:
  - `path: string`
  - `tagSegments: string[]`
- **校验规则**:
  - `tagSegments` 由目录路径标准化得到（去前缀符号、统一小写）
  - 比较时采用“前缀匹配”而非全等匹配

## ActiveNoteContext

- **用途**: 当前活动笔记的运行时上下文。  
- **字段**:
  - `path: string`
  - `basename: string`
  - `frontmatterTags: string[]`
  - `status: string | string[] | undefined`
- **校验规则**:
  - 无活动笔记时功能必须短路并给出 Notice
  - 无 frontmatter 标签时，依赖标签逻辑的功能必须给出可读提示

## StatusTransition

- **用途**: “Easier” 功能的状态迁移规则。  
- **字段**:
  - `again -> Hard`
  - `hard -> Good`
  - `good -> Easy`
  - `easy -> Complete`
- **校验规则**:
  - 输入状态大小写不敏感
  - 非预期状态不得强行覆盖，应提示“状态不在升级链路中”

## BuildTargetConfig

- **用途**: 构建产物输出目标配置。  
- **字段**:
  - `explicitOutdir?: string`（命令参数 `--outdir=...`）
  - `pluginDirEnv?: string`（环境变量 `OBSIDIAN_PLUGIN_DIR`）
  - `resolvedOutdir: string`
- **解析优先级**:
  1. `--outdir=...`
  2. `OBSIDIAN_PLUGIN_DIR`
  3. 默认 `dist`

## PluginArtifactSet

- **用途**: 可被 Obsidian 直接加载的最小产物集合。  
- **字段**:
  - `main.js`
  - `manifest.json`
  - `styles.css`
  - `versions.json`
- **校验规则**:
  - 构建成功后上述文件必须同时存在于目标目录
  - `manifest.version` 与包版本语义保持一致

## IssueFixRecord

- **用途**: 跟踪迁移中修复的问题与验证结果。  
- **字段**:
  - `issue: string`
  - `scope: "tag-match" | "folder-filter" | "feedback" | "build-output"`
  - `verification: string`
  - `result: "pass" | "pending"`
- **校验规则**:
  - 每个修复项必须能对应至少一个验证步骤

## 状态流转

### 插件生命周期

`unloaded -> loaded -> configured -> active`

- `onload` 完成设置加载、功能注册、设置页注册后进入 `active`。

### 构建状态

`idle -> bundling -> assets-sync -> completed | failed`

- `bundling` 成功后必须进入 `assets-sync`。  
- `assets-sync` 任一文件复制失败即视为 `failed`。
