## 1. Replace the channel skill

- [x] 1.1 Replace the add-only skill with concise `notion-manage-channels` CRUD guidance and explicit-only metadata; verify the old entrypoint is absent and skill validation passes.
- [x] 1.2 Preserve identity, browser, tag semantics, platform-icon fallback, and per-item retry safeguards; review the change scenarios against the instructions without live mutations.
- [x] 1.3 Migrate the README and channel docs, including the old-command migration note; verify unrelated book and album documentation remains unchanged.

## 2. Validate and deliver

- [x] 2.1 Run strict OpenSpec change validation, skill/YAML validation, and whitespace checks; record results and confirm generated adapters and unrelated changes remain untouched without regeneration.
- [ ] 2.2 Commit the scoped changes and open an independent PR; verify its base is main, its diff excludes book-library changes, and PR #81 remains unmerged.

## Verification results

- Reviewed CRUD, tag add/remove/replace, delegated classification, duplicate identities, template fallback, blocked/changing tabs, independent batch outcomes, and uncertain-write scenarios against the final instructions.
- Skill and YAML validation, strict change validation, whitespace checks, and comparison of unchanged documentation sections passed. No live Notion mutations or adapter regeneration were performed.
