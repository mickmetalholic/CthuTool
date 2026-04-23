# Quickstart: obsidian-enhancer

## 1. 前置条件

- 已在仓库根目录完成依赖安装。  
- 当前分支为 `009-obsidian-enhancer`。  
- 目标目录：`packages/obsidian-enhancer`。

## 2. 默认构建验证

在仓库根目录执行：

```bash
pnpm --filter @cthutool/obsidian-enhancer build
```

若本地 TypeScript 运行时异常，可临时改为：

```bash
cd packages/obsidian-enhancer
node esbuild.config.mjs --production
```

期望产物目录：

- `packages/obsidian-enhancer/dist/main.js`
- `packages/obsidian-enhancer/dist/manifest.json`
- `packages/obsidian-enhancer/dist/styles.css`
- `packages/obsidian-enhancer/dist/versions.json`

## 3. 指定插件目录直出验证

PowerShell：

```powershell
$env:OBSIDIAN_PLUGIN_DIR = "D:\Vault\.obsidian\plugins\obsidian-enhancer"
pnpm --filter @cthutool/obsidian-enhancer build
```

期望结果：目标目录直接包含完整插件产物，无需手动复制。

## 4. 功能回归验证

1. 在 Obsidian 启用插件。  
2. 验证 4 个 Ribbon 功能入口可见。  
3. 准备带 frontmatter 标签的笔记，验证：
   - Eudic deeplink 打开行为
   - Auto Move 目录匹配移动
   - Done Reviewing 日期更新
   - Easier 状态升级
4. 验证缺少活动笔记/缺少标签时存在明确 Notice 提示。

## 5. 问题修复验证点

- 自动移动目录过滤不再误命中。  
- 标签标准化后匹配更稳定（大小写、前缀差异）。  
- 构建产物完整且目录投递行为可预测。
