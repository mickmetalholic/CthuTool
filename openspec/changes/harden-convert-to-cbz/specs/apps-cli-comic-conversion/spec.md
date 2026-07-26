## ADDED Requirements

### Requirement: PDF and EPUB source discovery
The `convert-to-cbz` command SHALL recursively discover PDF and EPUB source files case-insensitively, exclude its selected output tree from source discovery, and map each source to the same relative directory with a `.cbz` extension.

#### Scenario: Recursive relative-path mapping
- **WHEN** the input contains `series/edition/book.EPUB` and the output root is separate from the input
- **THEN** the command selects the EPUB source
- **AND** maps it to `series/edition/book.cbz` under the output root

#### Scenario: Default output is not rescanned
- **WHEN** the default `<input>/.output` directory already contains prior CBZ output
- **THEN** the scanner excludes that output tree from source discovery
- **AND** does not create recursive output mappings

#### Scenario: Unsupported source is ignored
- **WHEN** the input tree also contains MOBI, RAR, ZIP, or unrelated files
- **THEN** those files are not scheduled as PDF or EPUB conversion tasks
- **AND** the command does not claim that it converted them

### Requirement: Ordered EPUB image extraction
The EPUB converter SHALL derive page occurrences from the package OPF spine, resolve page image references from each spine document, and copy compatible source image bytes without re-encoding.

#### Scenario: XHTML image page
- **WHEN** a spine document contains an XHTML `img` element with a relative `src`
- **THEN** the referenced image is resolved relative to that document
- **AND** appears in the CBZ at the corresponding spine position

#### Scenario: SVG image page
- **WHEN** a spine document contains an SVG `image` element using `href` or `xlink:href`
- **THEN** the referenced image is resolved regardless of XML namespace prefix
- **AND** appears in the CBZ at the corresponding spine position

#### Scenario: Encoded relative path
- **WHEN** a page reference contains URL-encoded path characters or parent-directory segments
- **THEN** the converter decodes and normalizes the reference within the EPUB archive
- **AND** resolves the intended manifest asset without escaping the archive namespace

#### Scenario: Repeated page reference
- **WHEN** the OPF spine intentionally references the same page image more than once
- **THEN** each occurrence is preserved in output order

#### Scenario: Source image bytes are preserved
- **WHEN** a spine page references a compatible JPEG, PNG, or WebP image
- **THEN** the corresponding CBZ entry has the same image bytes as the EPUB asset

#### Scenario: EPUB yields no valid pages
- **WHEN** the EPUB cannot produce any valid ordered page image
- **THEN** conversion fails for that source
- **AND** no successful CBZ or placeholder image is written

### Requirement: Extract-first PDF conversion
The PDF converter SHALL classify every source page and preserve a compatible embedded page image when it represents the complete visible page, using page rendering only when safe extraction is not possible.

#### Scenario: Single JPEG scan page
- **WHEN** a PDF page contains one compatible JPEG image that represents the complete visible page
- **THEN** the original JPEG payload is used for that CBZ page without lossy re-rendering

#### Scenario: Lossless scan page
- **WHEN** a PDF page contains one losslessly encoded scan image that represents the complete visible page
- **THEN** the page is emitted as a lossless CBZ-compatible image such as PNG

#### Scenario: Opaque soft mask
- **WHEN** the only image on a page has a soft mask whose decoded samples are fully opaque
- **THEN** the converter may extract the visible image without emitting a separate mask page

#### Scenario: Composed PDF page
- **WHEN** a PDF page contains multiple visible images, vector composition, meaningful transparency, or an unsupported native encoding
- **THEN** the converter renders that page at the requested DPI and output format

#### Scenario: Mixed extraction and rendering
- **WHEN** one PDF contains both extractable and composed pages
- **THEN** the final CBZ contains exactly one page image for every PDF page
- **AND** page images remain in source page order

#### Scenario: Poppler dependency is scoped to PDF work
- **WHEN** an input batch contains only EPUB sources
- **THEN** missing PDF-specific Poppler tools do not prevent EPUB conversion

### Requirement: Deterministic valid CBZ output
The converter SHALL package one valid image entry per converted source page using deterministic zero-padded names and SHALL validate the completed archive before reporting success.

#### Scenario: Page entry naming
- **WHEN** a book contains multiple output pages
- **THEN** entries are named `0001.<ext>`, `0002.<ext>`, and so on according to source order

#### Scenario: Page-count validation
- **WHEN** the source reports a known page count
- **THEN** the archive is successful only if it contains the same number of valid page-image entries

#### Scenario: Placeholder content is rejected
- **WHEN** an alleged page entry does not have a valid signature for its declared image format
- **THEN** archive validation fails
- **AND** the command does not report the source as converted

#### Scenario: Archive finalization fails
- **WHEN** ZIP finalization or integrity validation fails
- **THEN** no partial archive remains at the final target path
- **AND** the failure identifies the affected source and stage

### Requirement: Safe output conflicts and atomic replacement
The converter SHALL avoid silently overwriting existing CBZ targets and SHALL create or replace final output only through an atomic partial-write workflow.

#### Scenario: Existing target without overwrite
- **WHEN** the target CBZ already exists and `--overwrite` is not set
- **THEN** the source is reported as skipped
- **AND** the existing target bytes are unchanged

#### Scenario: Explicit overwrite
- **WHEN** the target CBZ already exists and `--overwrite` is set
- **THEN** conversion writes and validates a separate partial archive
- **AND** replaces the existing target only after validation succeeds

#### Scenario: Failed overwrite preserves target
- **WHEN** an overwrite conversion or validation fails
- **THEN** the original target remains unchanged
- **AND** the partial archive is removed

### Requirement: Conversion resource cleanup
Every scheduled conversion SHALL own its temporary workspace and dispose temporary files after packaging, skipping, or failure.

#### Scenario: Successful conversion cleanup
- **WHEN** a source is converted and packaged successfully
- **THEN** its extracted or rendered temporary pages are removed before the task completes

#### Scenario: Failed conversion cleanup
- **WHEN** conversion, packaging, or validation throws
- **THEN** temporary pages and partial archives are removed in a cleanup-safe path
- **AND** the primary failure remains the reported result

#### Scenario: Cleanup warning is bounded
- **WHEN** temporary cleanup itself fails
- **THEN** diagnostics identify the cleanup stage without dumping unbounded filesystem contents

### Requirement: Conversion summary categories
Conversion summaries SHALL distinguish converted, skipped, and failed files while preserving existing top-level summary fields.

#### Scenario: Mixed batch summary
- **WHEN** a batch converts one source, skips one existing target, and fails one invalid source
- **THEN** the summary reports `convertedCount: 1`, `skippedCount: 1`, and `failureCount: 1`
- **AND** `successCount` equals the converted plus skipped counts
- **AND** `totalFiles` equals all three scheduled sources

#### Scenario: JSON output remains singular
- **WHEN** the batch runs with `--json`
- **THEN** stdout contains exactly one parseable JSON result with the conversion summary
- **AND** progress and cleanup diagnostics do not corrupt stdout
