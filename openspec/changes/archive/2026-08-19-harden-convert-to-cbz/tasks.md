## 1. Regression Fixtures and Tests

- [x] 1.1 Add an installed-CLI regression test that runs `chc scripts run convert-to-cbz` under Node and proves the packaged command does not import TypeScript source files at runtime.
- [x] 1.2 Add EPUB fixtures covering XHTML `<img>`, SVG `href`, SVG `xlink:href`, URL-encoded paths, repeated spine references, and an EPUB with no valid image pages.
- [x] 1.3 Add PDF fixtures covering direct JPEG extraction, lossless non-JPEG extraction, opaque image masks, complex rendered pages, and a mixed extract/render document.
- [x] 1.4 Add integration tests for deterministic page naming, archive validity, page-count preservation, conflict skipping, explicit overwrite, atomic failure behavior, temporary-workspace cleanup, and JSON summary categories.

## 2. Packaged Script Runtime

- [x] 2.1 Build bundled script entry points into the CLI distribution and make discovery and execution resolve the same packaged registry entry.
- [x] 2.2 Remove Bun-only runtime dependencies from `convert-to-cbz` and its reachable modules so the installed Node CLI can load and execute it.
- [x] 2.3 Refresh committed CLI distribution artifacts and verify `pnpm run check:cli-dist` accepts the packaged script output.

## 3. EPUB Page Extraction

- [x] 3.1 Add the explicit XML/XHTML parsing dependency needed for EPUB container, package, spine, XHTML, and SVG documents.
- [x] 3.2 Resolve EPUB spine documents in reading order and collect XHTML image sources plus SVG `href` and `xlink:href` references with URL decoding.
- [x] 3.3 Preserve referenced image bytes and repeated page references while assigning deterministic CBZ page names.
- [x] 3.4 Remove the text placeholder fallback and fail conversion when an EPUB yields no valid image pages.

## 4. Extract-First PDF Conversion

- [x] 4.1 Extend the PDF prerequisite check to cover the Poppler tools used for both inspection and image extraction.
- [x] 4.2 Classify each PDF page as directly extractable, losslessly normalizable, or requiring rendering, including opaque-mask handling.
- [x] 4.3 Extract compatible single-image pages without rasterizing them, normalize lossless pages to PNG when required, and render only complex pages.
- [x] 4.4 Merge extracted and rendered pages back into source page order and verify mixed-document page counts.

## 5. Safe Output and Lifecycle

- [x] 5.1 Introduce an owned temporary-workspace abstraction and guarantee cleanup on success, conversion failure, and interruption paths handled by the process.
- [x] 5.2 Write each CBZ to a sibling partial path, validate ZIP readability and page entries, and atomically replace the destination only after validation succeeds.
- [x] 5.3 Skip existing outputs by default, add an explicit `--overwrite` option, and preserve the prior destination when overwrite conversion fails.
- [x] 5.4 Extend human-readable and JSON summaries with converted, skipped, failed, unsupported, and cleaned-up results while retaining existing summary fields.

## 6. Documentation and Validation

- [x] 6.1 Update CLI/script documentation with supported PDF and EPUB behavior, unsupported preprocessing cases, output mapping, conflict policy, and `--overwrite`.
- [x] 6.2 Run the targeted CLI unit and integration tests with the repository's Bun test preload and timeout settings.
- [x] 6.3 Run affected typecheck, lint, CLI build, and committed-distribution consistency checks.
- [x] 6.4 Run installed-CLI smoke tests on Windows against representative EPUB and PDF fixtures and inspect the resulting CBZ archives.
- [x] 6.5 Run `openspec validate harden-convert-to-cbz --type change --strict`, `git diff --check`, and confirm generated adapter files and neighboring OpenSpec changes remain untouched.
