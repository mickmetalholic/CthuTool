# @cthutool/cli

## Global Install

From the repository root:

```bash
npm install -g .
chc codex status
```

The global command runs the built JavaScript bundle with Node. Bun is only used by this repository's build and test scripts.

## Local Development

For linked local development, install the repository once and keep the built CLI updated:

```bash
npm link
pnpm --filter @cthutool/cli dev
```

Then run commands through the linked global executable:

```bash
chc codex status
```

The `dev` script watches the TypeScript source and rebuilds `apps/cli/dist/index.js`. The linked `chc` command runs that built JavaScript with Node, matching the production runtime while still picking up local changes after each rebuild.

## Shared CLI Contract

For global installation, `npm install -g .` builds `dist/index.js` during packaging and the installed `chc` command runs that built JavaScript with Node.

Commands that support the agent contract accept these common flags:

```bash
--json              Print one machine-readable JSON value to stdout
--no-interactive    Disable prompts even when stdin is a TTY
--quiet             Suppress non-essential human status output
```

In JSON mode, stdout is reserved for the JSON response. Human warnings and diagnostics are written to stderr.

## Bundled Scripts

Run bundled scripts through the `scripts` subcommand:

```bash
chc scripts <script-id>
```

Interactive terminals may omit the script id and choose from a prompt:

```bash
chc scripts
```

Agent and CI callers should provide the script id explicitly:

```bash
chc scripts convert-to-cbz --input ./samples --json --no-interactive
chc scripts --script convert-to-cbz --input ./samples --json
```

## convert-to-cbz

`convert-to-cbz` scans the input directory recursively, converts `.pdf` and `.epub` files, and writes `.cbz` outputs under `<input>/.output` by default.

Example:

```bash
chc scripts convert-to-cbz --input ./samples --format jpg --quality 90 --concurrency 4
```

If `--input` is omitted, the command prompts for a directory interactively.

JSON example:

```bash
chc scripts convert-to-cbz --input ./samples --json
```

If `--input` is omitted in non-interactive mode, the command exits non-zero and prints a JSON error when `--json` is set.

## Codex Config

Inspect local-versus-repository Codex configuration:

```bash
chc codex status
chc codex diff --json
```

Export safe local Codex configuration into the repository, or apply repository-managed configuration locally:

```bash
chc codex export
chc codex apply
```

Check repository `.codex` for unsafe runtime state before committing:

```bash
chc codex doctor
```

Only `.codex/prompts`, `.codex/rules`, `.codex/skills.manifest.json`, `.codex/plugins.manifest.json`, and `.codex/README.md` are managed as reproducible config. Runtime state such as auth, sqlite databases, logs, sessions, caches, memories, and `config.toml` remains unmanaged.

## Codex Plugins

Check plugin status:

```bash
chc codex plugins
chc codex plugins --json
```

Install or update explicit plugins:

```bash
chc codex plugins --plugin english-coach
chc codex plugins --plugin english-coach --sync-cache --json
chc codex plugins --all --no-interactive
```

When no plugin is selected in non-interactive mode, `codex plugins` lists status and exits zero.

## Command Authoring Checklist

- Derive `CliContext` at the command boundary.
- Check `context.interactive` before calling prompt APIs.
- Make required inputs expressible as flags or positional arguments.
- Return `CliCommandError` values for expected command failures.
- In `--json` mode, write exactly one JSON value to stdout.
- Keep warnings and diagnostics on stderr.
- Add focused tests for non-interactive missing input and JSON output.
