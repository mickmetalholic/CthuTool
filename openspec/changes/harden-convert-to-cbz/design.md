## Context

`apps/cli` builds a committed Node-targeted `dist/index.js`, but bundled-script discovery currently resolves manifests under `apps/cli/src/scripts/` and dynamically imports their TypeScript entries at runtime. The locally installed `chc` therefore discovers `convert-to-cbz` but fails to load it under Node. Running the TypeScript entry directly with Bun exposes additional data-path defects:

- the EPUB extractor reads the whole archive with a Bun-only API and recognizes only XHTML `<img src>` references;
- real fixed-layout EPUBs in the target collection use SVG `<image xlink:href>` pages, so extraction returns no pages;
- the fallback renderer is a placeholder string producer, allowing a fake `.jpg` entry to be reported as success;
- every PDF page is rendered through `pdftoppm`, even when the PDF contains one compatible scan image per page;
- converters allocate temporary directories without an owning cleanup lifecycle;
- the packager opens the final target directly, so a failed rerun can truncate or replace an existing archive.

The command must remain useful in interactive and JSON modes, preserve existing recursive relative-path mapping, run from the committed installed CLI, and process large image-based books without retaining whole-library temporary output.

## Goals / Non-Goals

**Goals:**

- Make packaged bundled scripts executable under the supported Node 24 runtime in local and managed installs.
- Preserve ordered source image bytes from fixed-layout EPUBs and image-only PDF pages whenever CBZ-compatible output is possible.
- Render only PDF pages whose visible result cannot be represented safely by one extracted image.
- Reject placeholder, zero-page, malformed, or page-count-mismatched output.
- Make writes atomic, reruns explicit, summaries backward-compatible, and temporary-resource cleanup unconditional.
- Add installed-command and real-format fixtures that reproduce the observed Windows/Node, SVG EPUB, and scan-PDF cases.

**Non-Goals:**

- Organizing files into author/title/language/edition library folders.
- SHA-256 deduplication or source-library cleanup.
- Supporting MOBI, RAR/ZIP container expansion, or treating loose image directories as source comics.
- Fetching comic metadata or requiring `ComicInfo.xml`.
- OCR, image enhancement, color correction, or recompressing extracted source images to a uniform format.

## Decisions

### Package built-in script entrypoints for the installed Node runtime

The CLI build will produce runtime-compatible JavaScript for bundled script entrypoints and execution will resolve a discovered built-in script id to packaged output. Discovery may continue to use bounded manifest metadata, but execution MUST NOT import `.ts` files from `apps/cli/src`.

All packaged script code will use Node-compatible APIs. In particular, EPUB input will use `node:fs` rather than the Bun global. A Node-spawned installed-command integration test will exercise `chc scripts run convert-to-cbz`, so Bun unit tests cannot mask packaging or module-resolution failures.

Alternative considered: teach Node to execute source TypeScript with loaders or experimental resolution flags. This was rejected because local and managed installs are intended to run committed prebuilt output without development-only runtime hooks.

### Parse EPUB structure and namespaces instead of matching one HTML shape

EPUB conversion will use a namespace-tolerant XML parser for `container.xml`, OPF manifest/spine data, and each spine document. It will recognize:

- XHTML `img[src]`;
- SVG `image[href]`;
- SVG `image[xlink:href]`.

Relative references will be URL-decoded and resolved against the referring document. Page occurrences will follow the OPF spine and in-document order. Repeated references remain repeated pages; only duplicate references within the same page element may be normalized. Compatible JPEG, PNG, and WebP bytes will be copied without decoding.

If the ordered extraction path yields no valid images, the file fails. The placeholder renderer will be removed; a real renderer can be proposed separately if reflowable EPUB support becomes necessary.

Alternative considered: broaden the current regular expressions. This was rejected because namespaces, escaped paths, attribute order, and SVG references make regex-only parsing fragile.

### Classify PDF pages before choosing extraction or rendering

Poppler remains the PDF backend, with dependency checks scoped to PDF work. The converter will use `pdfinfo` for page count and `pdfimages -list` plus extraction output to classify visible page images.

A page uses extraction only when it has exactly one compatible visible image and any associated mask can be preserved or is demonstrably fully opaque. JPEG data stays JPEG; losslessly decoded scan data becomes PNG. Pages containing multiple visible images, vector composition, meaningful transparency, or unsupported native encodings use `pdftoppm` for that page at the requested DPI and format.

The final page list merges extracted and rendered assets by PDF page number and MUST contain exactly one valid image for every source page.

Alternative considered: keep rendering every page. This was rejected because it increases file size, consumes substantially more CPU and temporary space, and introduces generational quality loss for scan-only PDFs.

### Give every conversion an owned temporary workspace

Each converter will receive an owned workspace abstraction rather than returning unowned `mkdtemp` paths. Scheduling will package the result inside a `try/finally` boundary and dispose the workspace after success, skip, or failure. Cleanup errors will be bounded diagnostics and will not hide the primary conversion result.

The implementation will avoid reading every source and generated page into memory simultaneously. EPUB archive access and CBZ output will be streaming or otherwise bounded per file, and file-level concurrency remains configurable.

### Write and validate archives atomically

The packager will write a uniquely named partial archive beside the target, then validate expected entries and image signatures before atomically replacing the final path. Failed partial output is removed.

Page entries use zero-padded names such as `0001.jpg`; archive member order is not treated as the reading-order contract because ZIP writers and readers may reorder members. Numeric page names and the validated expected entry set define order.

If the final target already exists, the default behavior is to skip it and report that decision. `--overwrite` explicitly authorizes replacement through the same partial-write path; direct truncation of the existing target is never used.

### Extend summaries without breaking current automation

The existing `totalFiles`, `successCount`, `failureCount`, `failures`, `outputRoot`, and `durationMs` fields remain. The summary adds `convertedCount` and `skippedCount`; `successCount` equals converted plus skipped files. Human output shows the same categories. JSON stdout remains exactly one parseable result.

### Keep source-format expansion and library organization outside this change

The command continues to advertise PDF and EPUB inputs. MOBI conversion can be staged through Calibre, ZIP-contained PDFs can be expanded, and loose pages can be packed by a separate preprocessing workflow. Output can then be mapped into the Manga Library hierarchy without coupling author/title/edition policy to a generic converter.

## Risks / Trade-offs

- [Risk] PDF image classification may misidentify masks or composed pages. → Default uncertain pages to rendering and cover opaque-mask extraction with fixtures.
- [Risk] Adding a streaming ZIP/XML parser increases dependencies. → Add only direct runtime dependencies used by `apps/cli`, pin through the workspace lockfile, and cover malformed archives.
- [Risk] Mixed extracted and rendered pages can have different dimensions or encodings. → Preserve source dimensions for extracted pages, document mixed output, and validate only image integrity/order rather than forcing normalization.
- [Risk] Skipping existing outputs can preserve an old bad archive. → Report every skip explicitly and provide `--overwrite`; atomic writes prevent newly generated partial files from occupying the final path.
- [Risk] Packaging built-in scripts could diverge from manifest discovery. → Generate or validate the execution registry during build and add catalog-to-entry consistency tests.
- [Risk] Real large books can exhaust memory under file concurrency. → Stream ZIP data where practical, own one workspace per task, and add bounded-concurrency integration coverage.

## Migration Plan

1. Add failing Node-installed-command, SVG EPUB, scan-PDF, output-conflict, and cleanup tests.
2. Package built-in script entries and switch installed execution to packaged JavaScript.
3. Replace EPUB extraction and remove the placeholder fallback.
4. Add PDF classification/extraction with render fallback and per-source dependency checks.
5. Add owned workspaces, atomic packaging, validation, overwrite semantics, and summary fields.
6. Refresh the committed CLI bundle and documentation.
7. Run focused CLI tests, typecheck/lint/build checks, and real smoke fixtures on Windows.

Rollback consists of reverting the change and committed CLI bundle. Existing successfully created CBZ files remain ordinary ZIP archives and require no data migration.

## Open Questions

None block implementation. `ComicInfo.xml`, new source adapters, and library hierarchy manifests remain candidates for separate changes after the core converter is reliable.
