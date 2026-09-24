## 1. Finalize the lightweight skill

- [x] 1.1 Review and finalize the existing `notion-manage-books/SKILL.md` draft against the CRUD, identity, shared-relation, and personal-data requirements; verify each operation has guidance without fixed input syntax or redundant confirmation.
- [x] 1.2 Verify or complete default-template use, asynchronous verification, and shared-icon repair guidance; walk through successful creation, failed template application, and an existing page with notes to confirm no content duplication or personal-field reset.
- [x] 1.3 Verify or complete cover handoff guidance; review creation outcomes with an available cover, missing cover, and multiple books to confirm each result contains a labeled image/direct link or an explicit limitation.
- [x] 1.4 Verify `agents/openai.yaml` uses the `Notion · Manage Books` display name, references `$notion-manage-books`, and parses `allow_implicit_invocation` as boolean false; confirm the plugin's existing skills directory discovers these files without manifest changes.

## 2. Validate behavior and scope

- [x] 2.1 Run the skill-creator `quick_validate.py` validator on the skill folder and review the spec scenarios against the final instructions, including limited query access, unsupported reversible deletion, and uncertain-write retries; record results without mutating live Notion records.
- [x] 2.2 Run `openspec validate codex-plugins-cthu-codex-add-notion-book-skill --strict` and whitespace checks covering new files; confirm both pass.
- [x] 2.3 Inspect Git status and the scoped diff to confirm only this change and its book skill are affected; verify generated adapters, neighboring changes, and live database configuration remain unchanged. Do not run OpenSpec regeneration or let it modify business-plugin files.

## 3. Replace the former book skill

- [x] 3.1 Remove the three `notion-maintain-books` source files and migrate README/docs to `notion-manage-books`; verify no active old entrypoint remains.
- [x] 3.2 Preserve the personal-notes convention in the new skill and synchronize replacement requirements in the delta and main specs; validate the skill, spec, and scoped diff.

## Verification results

- Reviewed all specification scenarios against the final skill instructions, including template failure, existing notes, missing/batch covers, partial queries, unsupported deletion, and uncertain writes.
- Skill validator, parsed invocation metadata, plugin discovery path, change strict validation, and new-file whitespace checks passed.
- Scope review found only the book skills, their documentation, and this change's OpenSpec artifacts changed; no live Notion mutation tests or adapter regeneration were performed.
