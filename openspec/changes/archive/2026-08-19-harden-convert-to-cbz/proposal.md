## Why

`convert-to-cbz` is discoverable from the locally installed `chc` CLI, but the installed Node runtime cannot load its TypeScript source entry. A direct Bun smoke test also showed that real fixed-layout EPUB files using SVG `<image>` pages produce a one-entry fake CBZ, while scan-based PDFs are always re-rendered instead of preserving their source images and temporary page directories are left behind.

## What Changes

- Make bundled `convert-to-cbz` execution use a runtime-compatible packaged entry so the installed `chc` command can run it under the supported Node runtime.
- Convert fixed-layout EPUB content in OPF spine order, including XHTML `<img>` and SVG `<image href>` / `<image xlink:href>` page references, while preserving original image bytes and repeated page references.
- Replace the placeholder EPUB fallback with an explicit conversion failure when ordered page assets cannot be produced.
- Use an extract-first PDF strategy that preserves compatible embedded page images when a page has one usable image, and render only pages that require composition.
- Produce deterministic, validated CBZ page entries and refuse to report success when page counts, image signatures, or archive integrity do not match the conversion result.
- Make batch writes safe and stateless: preserve relative directories, avoid silent overwrites by default, write outputs atomically, clean temporary assets on every path, and report skipped, converted, and failed files separately.
- Add real-format fixtures and installed-CLI coverage for Windows/Node execution, SVG-image EPUBs, image-only PDFs, render fallback, reruns, cleanup, and failure behavior.
- Document supported PDF/EPUB behavior, external Poppler requirements, output conflict semantics, and the boundary that MOBI, nested archives, loose-image directories, deduplication, and library-specific naming remain preprocessing concerns.

## Capabilities

### New Capabilities

- `apps-cli-comic-conversion`: Defines reliable PDF/EPUB page extraction, fallback rendering, CBZ packaging, validation, output safety, and cleanup behavior.

### Modified Capabilities

- `apps-cli-bundled-script-execution`: Requires discovered bundled scripts such as `convert-to-cbz` to execute from the installed prebuilt CLI under its supported Node runtime instead of depending on loadable TypeScript source files.

## Impact

- Affected code: `apps/cli` bundled-script packaging/loading, `src/scripts/convert-to-cbz/**`, CLI build output, focused unit/integration/installed-command tests, and CLI documentation.
- Runtime dependencies: Poppler capability checks expand from `pdfinfo`/`pdftoppm` to the extraction tools needed by the selected PDF strategy.
- Command behavior: existing PDF/EPUB inputs and relative output mapping remain supported; existing target files no longer get silently truncated, and unsupported or invalid conversions fail rather than producing placeholder archives.
- Out of scope: organizing a library into author/title/edition folders, SHA-256 deduplication, MOBI conversion, archive expansion, and treating a loose image directory as one comic.
