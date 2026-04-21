import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import type { Converter, ConvertResult } from '../../domain/converter';
import { conversionFailure } from '../../domain/errors';
import { toArchiveName } from '../../domain/path-mapping';
import { createEpubRendererPool } from '../renderers/epub-renderer-pool';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const normalizePath = (value: string): string => value.replaceAll('\\', '/');

const dirnameOf = (value: string): string => {
  const normalized = normalizePath(value);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '' : normalized.slice(0, index);
};

const resolveRelativePath = (baseDir: string, rel: string): string => {
  const merged = `${baseDir}/${rel}`.replaceAll('//', '/');
  const segments = merged.split('/');
  const resolved = segments.reduce<string[]>((acc, segment) => {
    if (segment === '' || segment === '.') return acc;
    if (segment === '..') return acc.slice(0, -1);
    return acc.concat(segment);
  }, []);
  return resolved.join('/');
};

const parseContainerOpfPath = (
  files: Readonly<Record<string, Uint8Array>>,
): string | undefined => {
  const containerXml = files['META-INF/container.xml'];
  if (!containerXml) return undefined;
  const xml = strFromU8(containerXml);
  const match = xml.match(/full-path\s*=\s*["']([^"']+)["']/i);
  return match?.[1] ? normalizePath(match[1]) : undefined;
};

const parseManifest = (opfXml: string): Readonly<Record<string, string>> => {
  const itemRegex = /<item\b[^>]*>/gi;
  const idRegex = /\bid\s*=\s*["']([^"']+)["']/i;
  const hrefRegex = /\bhref\s*=\s*["']([^"']+)["']/i;
  const entries = [...opfXml.matchAll(itemRegex)]
    .map((match) => match[0])
    .map((itemTag) => {
      const id = itemTag.match(idRegex)?.[1];
      const href = itemTag.match(hrefRegex)?.[1];
      if (!id || !href) return undefined;
      return [id, normalizePath(href)] as const;
    })
    .filter((x): x is readonly [string, string] => x !== undefined);
  return Object.fromEntries(entries);
};

const parseSpineItemRefs = (opfXml: string): ReadonlyArray<string> =>
  [...opfXml.matchAll(/<itemref\b[^>]*>/gi)]
    .map((match) => match[0])
    .map(
      (itemRefTag) => itemRefTag.match(/\bidref\s*=\s*["']([^"']+)["']/i)?.[1],
    )
    .filter((x): x is string => Boolean(x));

const parseImageRefs = (html: string): ReadonlyArray<string> => {
  const refs = [
    ...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
  ]
    .map((match) => normalizePath(match[1]))
    .filter((src) => src.length > 0);
  const unique = refs.reduce<string[]>((acc, value) => {
    if (acc.includes(value)) return acc;
    return acc.concat(value);
  }, []);
  return unique;
};

const inferImageFormat = (
  path: string,
  fallback: 'png' | 'jpg' | 'webp',
): 'png' | 'jpg' | 'webp' => {
  const ext = path.split('.').at(-1)?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  return fallback;
};

const collectImageEntries = (
  files: Readonly<Record<string, Uint8Array>>,
  rootOpfPath: string,
): ReadonlyArray<readonly [string, Uint8Array]> => {
  const opfContent = files[rootOpfPath];
  if (!opfContent) return [];
  const opfXml = strFromU8(opfContent);
  const manifest = parseManifest(opfXml);
  const spineIds = parseSpineItemRefs(opfXml);
  const opfDir = dirnameOf(rootOpfPath);
  const chapterPaths = spineIds
    .map((id) => manifest[id])
    .filter((x): x is string => Boolean(x))
    .map((href) => resolveRelativePath(opfDir, href));
  const orderedImagePaths = chapterPaths.flatMap((chapterPath) => {
    const chapterContent = files[chapterPath];
    if (!chapterContent) return [];
    const chapterHtml = strFromU8(chapterContent);
    return parseImageRefs(chapterHtml).map((imgRef) =>
      resolveRelativePath(dirnameOf(chapterPath), imgRef),
    );
  });
  const deduped = orderedImagePaths.reduce<string[]>((acc, value) => {
    if (acc.includes(value)) return acc;
    return acc.concat(value);
  }, []);
  return deduped
    .map((path) => [path, files[path]] as const)
    .filter((entry): entry is readonly [string, Uint8Array] => {
      const [path, content] = entry;
      if (!content) return false;
      const ext = path.split('.').at(-1)?.toLowerCase();
      return ext !== undefined && IMAGE_EXTENSIONS.has(ext);
    });
};

const tryExtractAll = async (
  epubPath: string,
  root: string,
): Promise<
  ReadonlyArray<{
    readonly tempPath: string;
    readonly sourcePath: string;
  }>
> => {
  const bytes = await Bun.file(epubPath).arrayBuffer();
  const files = unzipSync(new Uint8Array(bytes));
  const rootOpfPath = parseContainerOpfPath(files);
  if (!rootOpfPath) return [];
  const imageEntries = collectImageEntries(files, rootOpfPath);
  const pages = await Promise.all(
    imageEntries.map(async ([imagePath, content], idx) => {
      const outputPath = join(root, `raw-${String(idx + 1).padStart(5, '0')}`);
      await writeFile(outputPath, content);
      return { tempPath: outputPath, sourcePath: imagePath };
    }),
  );
  return pages;
};

export const epubConverter: Converter = {
  sourceType: 'epub',
  async convert(file, ctx): Promise<ConvertResult> {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-pages-'));
    const fallbackExt = ctx.options.imageFormat;
    const extracted = await tryExtractAll(file.sourcePath, root);
    if (extracted.length > 0) {
      return {
        ok: true,
        pages: extracted.map(({ tempPath, sourcePath }, idx) => {
          const imageExt = inferImageFormat(sourcePath, fallbackExt);
          return {
            index: idx + 1,
            tempPath,
            archiveName: toArchiveName(idx + 1, imageExt),
            format: imageExt,
            quality: ctx.options.imageQuality,
          };
        }),
      };
    }

    // Use fallback renderer only when extraction path cannot provide ordered page assets.
    const renderer = createEpubRendererPool(ctx.options.epubRenderConcurrency);
    try {
      const chapters = [file.sourcePath];
      const total = chapters.length;
      const pages: Array<{
        index: number;
        tempPath: string;
        archiveName: string;
        format: 'png' | 'jpg' | 'webp';
        quality: number;
      }> = [];

      for (const [idx, chapterPath] of chapters.entries()) {
        const pagePath = join(root, toArchiveName(idx + 1, fallbackExt));
        const content = await renderer.renderChapter(chapterPath, idx + 1);
        await writeFile(pagePath, content, 'utf8');
        pages.push({
          index: idx + 1,
          tempPath: pagePath,
          archiveName: toArchiveName(idx + 1, fallbackExt),
          format: fallbackExt,
          quality: ctx.options.imageQuality,
        });
        ctx.onProgress?.(file, {
          current: idx + 1,
          total,
          message: 'render-fallback',
        });
      }

      return { ok: true, pages };
    } catch (e) {
      return {
        ok: false,
        failure: conversionFailure(
          file.sourcePath,
          'convert',
          e instanceof Error ? e.message : String(e),
        ),
      };
    } finally {
      await renderer.dispose();
    }
  },
};
