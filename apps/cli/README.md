# @cthutool/cli

## Bundled Scripts

Run bundled scripts through the `scripts` subcommand:

```bash
pnpm --filter @cthutool/cli run dev -- scripts <script-id>
```

## convert-to-cbz

`convert-to-cbz` scans the input directory recursively, converts `.pdf` and `.epub` files, and writes `.cbz` outputs under `<input>/.output` by default.

Example:

```bash
pnpm --filter @cthutool/cli run dev -- scripts convert-to-cbz --input ./samples --format jpg --quality 90 --concurrency 4
```

If `--input` is omitted, the command prompts for a directory interactively.
