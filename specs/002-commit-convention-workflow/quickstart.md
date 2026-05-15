# Quickstart: 约定式提交工作流

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## 前置条件

- Node **≥ 20**（与仓库 `engines` 一致）
- **pnpm** 9.x
- 已 `pnpm install`
- 克隆后若 hook 未生效：确认已执行过 `pnpm install`（会触发 `prepare` → Husky）

## 推荐提交流程（交互 + 中文提示）

```bash
git add .
pnpm run commit
```

按 cz-git 向导选择 **type**（方向键）、填写 **scope**（可选）、**英文 subject**；若有 **body/footer**，仍须英文。完成后由 Commitizen 写入消息并触发 `commit-msg` → commitlint。

## 直接使用 `git commit`（仍被拦截）

```bash
git commit -m "feat(scope): add English imperative subject"
```

消息必须符合合同与 commitlint；否则 hook 失败并打印规则错误。

## 本地校验（不提交）

```bash
pnpm exec commitlint --edit .git/COMMIT_EDITMSG
# 或针对最近一次提交信息文件调试时复制内容到临时文件再 --edit
```

## CI 行为（计划实施后）

- **Pull Request**：`actions/checkout` 使用完整历史（`fetch-depth: 0`），对 `base..HEAD` 运行 `pnpm exec commitlint --from … --to HEAD --verbose`（见 `.github/workflows/ci.yml`）。
- **Push**（`main` / `master`）：对 **最近一次提交** 运行 `pnpm exec commitlint --last --verbose`。

## 常见问题

| 现象 | 处理 |
|------|------|
| Hook 不执行 | 确认 `.husky/commit-msg` 存在且可执行；重新 `pnpm install` |
| 合并提交被拦 | 检查消息是否匹配合同中的豁免模式；必要时更新 `ignores` 与合同 |
| 中文写进说明被拒 | 符合 FR-008：改为英文 subject/body/footer |
| `body-max-line-length` 报错 | 正文/脚注 **每一行** 不超过 100 字符；拆行或分多次 `-m` |

## 与 AI 协作

- **`.cursor/rules/*.mdc`**（Project Rules）含提交格式摘要；生成 commit subject 前优先遵循相关 `.mdc` 与本文档。
