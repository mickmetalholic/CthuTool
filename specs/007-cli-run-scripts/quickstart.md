# Quickstart - CLI 内置脚本（007-cli-run-scripts）

## 前置条件

- 安装依赖并完成 monorepo 常规 bootstrap（见仓库根 README）。  
- 使用 **Bun** 作为 `apps/cli` 的运行时（与 `package.json` 一致）。

## 通过 CLI 运行内置脚本

在仓库根或 `apps/cli` 下（以实际 `package.json` scripts 为准）：

1. 列出/选择运行（交互式终端）：  
   - 调用带「运行脚本」能力的子命令；不传脚本名时将出现选择列表。  

2. 直接指定脚本标识（非交互友好）：  
   - 使用实现最终确定的参数形式传入与 `apps/cli/src/scripts/<id>` 同名的 `id`。

具体命令名与参数以实现后的 `--help` 为准；契约见 `contracts/run-scripts-command.contract.md`。

## 使用 Bun 直接执行某个脚本入口

示例（路径按本机仓库位置调整）：

```bash
bun run apps/cli/src/scripts/hello-world/index.ts
```

要求该目录下存在 `script.json` 与 `index.ts`，且默认导出可调用函数。

## 新增一个脚本包（贡献者）

1. 在 `apps/cli/src/scripts/` 下新建目录 `<script-id>/`（kebab-case）。  
2. 添加 `script.json`，`id` 与目录名一致，填写 `title` 与可选 `description`。  
3. 添加 `index.ts`，默认导出异步或同步入口函数。  
4. 运行 `bun test` 与 CLI 手动验证；提交前确保 Biome / tsc / Knip 通过。

详细字段与入口约定见 `contracts/script-package.contract.md` 与 `data-model.md`。
