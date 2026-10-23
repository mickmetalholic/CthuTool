# Migration rollback and retirement checklist

Before switching an existing machine, preserve the old checkout, save `chezmoi dump-config --format json`, note its sourceDir/host, and retain chc's private binding backup path printed by init. Review config diff before any apply. Home-file backups contain content, mode and symlink destination in private JSON; do not publish them.

To undo binding only: close dotfiles writers; copy the private `binding/*.backup` back to the exact chezmoi config file reported by init (preserve private permissions), then inspect `chezmoi dump-config --format json` and `chezmoi diff`. An alternative explicit switch uses init --source <old-supported-CthuTool-source> --migrate-from <current-source> --host <id>. The original Go dotfiles source can be restored by restoring its original configuration backup and using its original CLI. Switching a binding does not restore home files or uninstall software.

Native interactive apply is sequential; quitting or skipping later files does not undo earlier confirmed writes. Review config diff after interruption. Old receipts.json files are historical only and no longer affect apply. To restore a specific overwritten home file: inspect its recorded backup's target, text, mode and link flag; preserve any newer edits separately; restore only the intended target and permissions/link metadata, then diff. Never recursively copy the entire private backup directory into home. To roll back a published snapshot, review a previous complete Git generation and restore all four generated YAML files together with their manifest. Do not mix generations or rewrite digests to conceal a mismatch.

If notion pull is interrupted: rerun notion pull against the same source. Its source lock and local recovery run before Token lookup. An active PID means wait for that writer. A conflicting user edit or invalid recovery journal means preserve `dotfiles/notion/.transaction` and `.sync-lock` and inspect the printed files. Compare each target digest with the journal before/after and retain newer edits outside the source. Only after operator reconciliation may the reviewed previous generation be restored. Never delete recovery material merely to silence a digest error. Read-only validate/diff do not restore anything automatically.

Package and service changes are not automatically undone. In particular do not reset an existing k3s cluster or uninstall its data as part of source rollback. Bootstrap auth cancellation retains Git/Node/checkout/chc; resume auth then init.

External retirement is a separate explicit action after the acceptance matrix passes:

- [ ] Re-read and reconcile all three Notion sources; review page identity, advanced fields and all five expanded host plans.
- [ ] Complete isolated macOS/Windows/Linux/WSL and x64/arm64 acceptance, including existing-file migration and new terminals/source relink.
- [ ] Publish the reviewed CthuTool committed bundle and assets; run both standalone bootstraps on selected disposable machines.
- [ ] Migrate each old machine deliberately, retaining the old source/config backups until rollback is no longer needed.
- [ ] Update external dotfiles/dotfiles-bootstrap README and entry links; mark old dot binary and Go releases retired.
- [ ] Stop the old Go release and bootstrap publication workflows, retaining tags and recovery documentation.
- [ ] Archive external repositories only when separately authorized.

This implementation does not modify or archive the two external repositories.
