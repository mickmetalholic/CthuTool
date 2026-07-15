## 1. Skill Organization

- [x] 1.1 Rename the three Anki skill directories, frontmatter names, display names, and default prompts to the `anki-create-<object>` convention.
- [x] 1.2 Keep all Anki skills explicit-only and verify every default prompt references its exact renamed skill.
- [x] 1.3 Add the flat `notion-add-channel` skill with a grouped display name and explicit-only invocation policy.

## 2. Notion Channel Workflow

- [x] 2.1 Implement channel URL validation, platform resolution, live database discovery, and duplicate detection instructions.
- [x] 2.2 Implement existing-category validation or confirmed inference, platform-template selection, creation verification, and Notion URL reporting instructions.

## 3. Plugin Contracts and Documentation

- [x] 3.1 Declare bundled skills in the plugin manifest and update its capability description and cachebuster.
- [x] 3.2 Update current user documentation and main OpenSpec skill paths without modifying historical archived changes or generated agent adapters.

## 4. Verification

- [x] 4.1 Validate all four skills, the CthuCodex plugin, exact name-directory-prompt consistency, and manual-only policies.
- [x] 4.2 Run `git diff --check` and confirm active plugin, documentation, and main-spec references no longer use the retired invocation names, excluding migration history in this change and archived changes.
