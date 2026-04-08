# Quickstart - CLI Welcome Greeting Demo

## 1. 前置条件

- Bun 已安装（推荐与仓库一致版本）。  
- 在仓库根目录执行命令。  
- 终端支持交互输入（TTY）。

## 2. 安装依赖

```bash
bun install
```

## 3. 启动 Demo

```bash
bun run --filter @cthutool/cli start
```

若尚未配置 workspace script，可先进入应用目录：

```bash
cd apps/cli
bun run start
```

## 4. 期望交互

1. 顶部显示欢迎面板（边框 + 颜色）。  
2. 询问姓名。  
3. 输入合法后清屏并显示 2 秒 loading。  
4. 最终界面保留欢迎面板，并显示 `Hello, <name>`。

## 5. 测试与质量检查

```bash
bun test
bun run lint
bun run typecheck
```

## 6. 常见问题

- **输入后无响应**: 检查是否在非交互终端中运行。  
- **颜色不显示**: 终端可能降级为纯文本，这是允许行为，只要交互顺序正确。  
- **中断后出现成功文案**: 属于缺陷，应修复为中断即退出且不显示成功信息。
