## Verification record

### Automated coverage

- `cargo test -p cthutool-agent-tray`: native model, menu boundaries, single-instance identity, authenticated local control, restart policy, environment switching, one-time launch validation, coordinated exit, and reused-PID protection.
- `cargo clippy -p cthutool-agent-tray --all-targets -- -D warnings`: Rust lint and supported-host compilation.
- `cargo run -p cthutool-agent-tray -- --smoke-test`: macOS host construction of the native icon and menu without registering a visible tray item.
- `pnpm --filter @cthutool/agent-runtime test` and `pnpm --filter @cthutool/agent test`: Node Agent control, environment, bridge, shutdown, and ownership integration.

### Gesture support and fallback

- macOS maps a primary-button release to **Open CthuTool**. The context menu remains available from the normal secondary-button gesture.
- Windows maps the native primary-button double-click event to **Open CthuTool**. The context-menu **Open CthuTool** command is the reliable fallback when shell settings or accessibility tools suppress double-click events.
- Linux is not a release-supported target for this change. Its binary reports that support is deferred instead of silently creating an embedded or partial UI.

The macOS gesture path was compiled and its platform-independent mapping was unit tested on the current host. The Windows event mapping is unit tested but requires the Windows release smoke job from `add-agent-release-artifacts` for native execution coverage.
