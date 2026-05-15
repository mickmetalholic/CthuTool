# Contract: Commit Message（约定式提交 + 英文）

**Version**: 1.0.0  
**Consumers**: Husky `commit-msg` → commitlint；Commitizen/cz-git；CI commitlint；AI（`.cursor/rules/*.mdc`）

## 1. 首行（Header）语法

```ebnf
header     = type , [ "(" , scope , ")" ] , ": " , subject ;
type       = "feat" | "fix" | "docs" | "style" | "refactor" | "perf" | "test" | "build" | "ci" | "chore" ;
scope      = *VCHAR ;   (* 实现阶段：与 commitlint scope 规则一致，如 kebab-case *)
subject    = *OCTET ;   (* 须为英文祈使；不得含 CJK；具体字符集以 commitlint 英文规则为准 *)
```

- **长度**：遵循 `@commitlint/config-conventional` 默认 `header-max-length`（默认 100），可在配置中显式声明以免漂移。

## 2. 正文与脚注

- 正文非空时：与首行之间 **必须** 有一空行。
- **正文与脚注各行长度**：遵循 `@commitlint/config-conventional` 默认 `body-max-line-length`（与实现一致，**每行不超过 100 个字符**）；超长单行会被 commitlint 拒绝。
- 脚注非空时：位于正文之后；常见 `BREAKING CHANGE:` 多行描述须为英文。

## 3. 全文语言

- `subject`、`body`、`footer` 任意非空部分 **不得包含 CJK 统一表意文字**（U+4E00–U+9FFF）。
- 交互式向导 UI 可使用中文；**写入 Git 的最终字符串**须满足本合同。

## 4. 豁免消息（与 commitlint `ignores` 一致）

以下模式 **不参与** conventional + 英文校验（实现时与 `commitlint.config.cjs` 保持逐字一致）：

- 以 `Merge branch '` 或 `Merge remote-tracking branch '` 开头的合并提交说明。
- 以 `Merge pull request #` 开头的 GitHub 风格合并说明。
- 以 `Revert "` 或 `Revert '` 开头的标准 `git revert` 生成说明（非 conventional header，由 `commitlint.config.cjs` `ignores` 放行）。
- 经团队明文增加的其他模式（须在配置与本文档同步更新）。

## 5. 验收钩子

- 给定合规样例：commitlint 退出码 0。
- 给定含 CJK 的样例：commitlint 非 0，且 stderr/规则消息体现语言要求。
- 给定合并豁免样例：commitlint 退出码 0。

## 6. 变更流程

修改本合同任一条款时，必须同时更新：

1. `commitlint.config.cjs`
2. `.cursor/rules/*.mdc`（与提交规范相关的规则文件）
3. [quickstart.md](../quickstart.md)
