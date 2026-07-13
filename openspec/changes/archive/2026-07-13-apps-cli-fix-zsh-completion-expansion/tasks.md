## 1. Adapter Rendering

- [x] 1.1 Render the zsh adapter with executable parameter expansion instead of literal escaped array expressions.
- [x] 1.2 Rebuild the committed Node CLI distribution bundle.

## 2. Regression Coverage

- [x] 2.1 Assert the generated zsh adapter does not contain escaped `${...}` parameter expressions.
- [x] 2.2 Execute the generated adapter under zsh when available and verify candidates reach `compadd` separately.

## 3. Verification

- [x] 3.1 Run CLI tests, type checking, lint, and distribution bundle consistency checks.
- [x] 3.2 Validate the OpenSpec change and confirm generated agent adapter files remain unchanged.
