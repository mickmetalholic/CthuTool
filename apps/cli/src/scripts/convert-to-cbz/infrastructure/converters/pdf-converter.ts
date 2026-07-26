import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { ImageFormat, PageAsset } from '../../domain/conversion-types';
import type { Converter, ConvertResult } from '../../domain/converter';
import { conversionFailure } from '../../domain/errors';
import { toArchiveName } from '../../domain/path-mapping';

type CommandResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

type PdfImageRecord = {
  readonly page: number;
  readonly number: number;
  readonly type: string;
  readonly width: number;
  readonly height: number;
  readonly encoding: string;
  readonly xPpi: number;
  readonly yPpi: number;
};

type PageSize = {
  readonly width: number;
  readonly height: number;
};

export type PdfPagePlan =
  | { readonly kind: 'extract-jpeg'; readonly page: number }
  | { readonly kind: 'extract-png'; readonly page: number }
  | { readonly kind: 'render'; readonly page: number; readonly reason: string };

const runCommand = (
  bin: string,
  args: ReadonlyArray<string>,
): Promise<CommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += String(data);
    });
    child.stderr.on('data', (data) => {
      stderr += String(data);
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stderr, stdout }));
  });

const parsePdfPageCount = (content: string): number => {
  const match = content.match(/^Pages:\s*(\d+)\s*$/im);
  return match ? Number(match[1]) : 0;
};

const parsePdfPageSizes = (
  content: string,
  pageCount: number,
): ReadonlyMap<number, PageSize> => {
  const sizes = new Map<number, PageSize>();
  const defaultMatch = content.match(
    /^Page size:\s*([\d.]+)\s+x\s+([\d.]+)\s+pts/im,
  );
  if (defaultMatch) {
    const size = {
      height: Number(defaultMatch[2]),
      width: Number(defaultMatch[1]),
    };
    for (let page = 1; page <= pageCount; page += 1) {
      sizes.set(page, size);
    }
  }
  for (const match of content.matchAll(
    /^Page\s+(\d+)\s+size:\s*([\d.]+)\s+x\s+([\d.]+)\s+pts/gim,
  )) {
    sizes.set(Number(match[1]), {
      height: Number(match[3]),
      width: Number(match[2]),
    });
  }
  return sizes;
};

export const parsePdfImagesList = (
  content: string,
): ReadonlyArray<PdfImageRecord> =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter(
      (columns) =>
        columns.length >= 14 &&
        /^\d+$/.test(columns[0] ?? '') &&
        /^\d+$/.test(columns[1] ?? ''),
    )
    .map((columns) => ({
      encoding: (columns[8] ?? '').toLowerCase(),
      height: Number(columns[4]),
      number: Number(columns[1]),
      page: Number(columns[0]),
      type: (columns[2] ?? '').toLowerCase(),
      width: Number(columns[3]),
      xPpi: Number(columns[12]),
      yPpi: Number(columns[13]),
    }))
    .filter(
      (record) =>
        Number.isFinite(record.page) &&
        Number.isFinite(record.width) &&
        Number.isFinite(record.height),
    );

const approximatelyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) <= Math.max(2, right * 0.02);

const coversPage = (
  image: PdfImageRecord,
  pageSize: PageSize | undefined,
): boolean => {
  if (
    !pageSize ||
    image.xPpi <= 0 ||
    image.yPpi <= 0 ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return false;
  }
  const displayedWidth = (image.width / image.xPpi) * 72;
  const displayedHeight = (image.height / image.yPpi) * 72;
  const direct =
    approximatelyEqual(displayedWidth, pageSize.width) &&
    approximatelyEqual(displayedHeight, pageSize.height);
  const rotated =
    approximatelyEqual(displayedWidth, pageSize.height) &&
    approximatelyEqual(displayedHeight, pageSize.width);
  return direct || rotated;
};

export const planPdfPages = (
  pageCount: number,
  pageSizes: ReadonlyMap<number, PageSize>,
  records: ReadonlyArray<PdfImageRecord>,
): ReadonlyArray<PdfPagePlan> => {
  const plans: PdfPagePlan[] = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const pageRecords = records.filter((record) => record.page === page);
    const visible = pageRecords.filter((record) => record.type === 'image');
    const masks = pageRecords.filter(
      (record) => record.type === 'mask' || record.type === 'smask',
    );
    const [image] = visible;
    if (visible.length !== 1 || !image) {
      plans.push({
        kind: 'render',
        page,
        reason:
          visible.length === 0
            ? 'no extractable page image'
            : 'multiple visible images',
      });
      continue;
    }
    if (masks.length > 0) {
      plans.push({
        kind: 'render',
        page,
        reason: 'image mask requires composition',
      });
      continue;
    }
    if (!coversPage(image, pageSizes.get(page))) {
      plans.push({
        kind: 'render',
        page,
        reason: 'image does not cover the complete page',
      });
      continue;
    }
    if (image.encoding === 'jpeg') {
      plans.push({ kind: 'extract-jpeg', page });
      continue;
    }
    if (
      image.encoding === 'image' ||
      image.encoding === 'ccitt' ||
      image.encoding === 'jbig2'
    ) {
      plans.push({ kind: 'extract-png', page });
      continue;
    }
    plans.push({
      kind: 'render',
      page,
      reason: `unsupported native encoding: ${image.encoding || 'unknown'}`,
    });
  }
  return plans;
};

const generatedFilesForPrefix = async (
  rootPath: string,
  prefix: string,
  extension: string,
): Promise<ReadonlyArray<string>> => {
  const prefixName = `${basename(prefix)}-`;
  return (await readdir(rootPath))
    .filter(
      (name) =>
        name.startsWith(prefixName) &&
        name.toLowerCase().endsWith(`.${extension}`),
    )
    .sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    )
    .map((name) => join(rootPath, name));
};

const extractPage = async (
  command: typeof runCommand,
  sourcePath: string,
  rootPath: string,
  plan: Extract<PdfPagePlan, { kind: 'extract-jpeg' | 'extract-png' }>,
): Promise<
  { readonly format: 'jpg' | 'png'; readonly path: string } | undefined
> => {
  const format = plan.kind === 'extract-jpeg' ? 'jpg' : 'png';
  const prefix = join(
    rootPath,
    `extract-${String(plan.page).padStart(5, '0')}`,
  );
  const result = await command('pdfimages', [
    '-f',
    String(plan.page),
    '-l',
    String(plan.page),
    plan.kind === 'extract-jpeg' ? '-j' : '-png',
    sourcePath,
    prefix,
  ]);
  if (result.code !== 0) return undefined;
  const generated = await generatedFilesForPrefix(rootPath, prefix, format);
  const [path] = generated;
  return path ? { format, path } : undefined;
};

const renderPage = async (
  command: typeof runCommand,
  sourcePath: string,
  rootPath: string,
  page: number,
  format: ImageFormat,
  dpi: number,
  quality: number,
): Promise<{ readonly format: ImageFormat; readonly path: string }> => {
  const prefix = join(rootPath, `render-${String(page).padStart(5, '0')}`);
  const formatArg = format === 'jpg' ? '-jpeg' : `-${format}`;
  const args = [
    formatArg,
    '-f',
    String(page),
    '-l',
    String(page),
    '-singlefile',
    '-r',
    String(dpi),
  ];
  if (format === 'jpg') {
    args.push('-jpegopt', `quality=${quality}`);
  }
  args.push(sourcePath, prefix);
  const result = await command('pdftoppm', args);
  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || `pdftoppm failed for page ${page}`);
  }
  const path = `${prefix}.${format}`;
  return { format, path };
};

export const createPdfConverter = (deps?: {
  readonly runCommand?: typeof runCommand;
}): Converter => ({
  sourceType: 'pdf',
  async convert(file, ctx): Promise<ConvertResult> {
    const command = deps?.runCommand ?? runCommand;
    try {
      const info = await command('pdfinfo', ['-box', file.sourcePath]);
      if (info.code !== 0) {
        return {
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            info.stderr.trim() || 'pdfinfo failed',
          ),
        };
      }
      const pageCount = parsePdfPageCount(info.stdout);
      if (pageCount < 1) {
        return {
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            'PDF reports no pages',
          ),
        };
      }

      const detailedInfo = await command('pdfinfo', [
        '-f',
        '1',
        '-l',
        String(pageCount),
        '-box',
        file.sourcePath,
      ]);
      const pageSizeContent =
        detailedInfo.code === 0 ? detailedInfo.stdout : info.stdout;
      const listed = await command('pdfimages', ['-list', file.sourcePath]);
      if (listed.code !== 0) {
        return {
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            listed.stderr.trim() || 'pdfimages -list failed',
          ),
        };
      }

      const plans = planPdfPages(
        pageCount,
        parsePdfPageSizes(pageSizeContent, pageCount),
        parsePdfImagesList(listed.stdout),
      );
      const pages: PageAsset[] = [];
      for (const plan of plans) {
        let produced:
          | { readonly format: ImageFormat; readonly path: string }
          | undefined;
        if (plan.kind === 'extract-jpeg' || plan.kind === 'extract-png') {
          produced = await extractPage(
            command,
            file.sourcePath,
            ctx.workspace.rootPath,
            plan,
          );
        }
        if (!produced) {
          produced = await renderPage(
            command,
            file.sourcePath,
            ctx.workspace.rootPath,
            plan.page,
            ctx.options.imageFormat,
            ctx.options.dpi,
            ctx.options.imageQuality,
          );
        }
        pages.push({
          archiveName: toArchiveName(plan.page, produced.format),
          format: produced.format,
          index: plan.page,
          quality: ctx.options.imageQuality,
          tempPath: produced.path,
        });
        ctx.onProgress?.(file, {
          current: plan.page,
          message: plan.kind === 'render' ? 'render' : 'extract',
          total: pageCount,
        });
      }

      if (
        pages.length !== pageCount ||
        pages.some((page, offset) => page.index !== offset + 1)
      ) {
        return {
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            `PDF page count mismatch: expected ${pageCount}, produced ${pages.length}`,
          ),
        };
      }
      return { ok: true, pages };
    } catch (error) {
      return {
        ok: false,
        failure: conversionFailure(
          file.sourcePath,
          'convert',
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  },
});

export const pdfConverter = createPdfConverter();
