import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Converter, ConvertResult } from '../../domain/converter';
import { conversionFailure } from '../../domain/errors';
import { toArchiveName } from '../../domain/path-mapping';
import { createEpubRendererPool } from '../renderers/epub-renderer-pool';

const tryExtractFirst = async (
  _epubPath: string,
): Promise<ReadonlyArray<string>> => [];

export const epubConverter: Converter = {
  sourceType: 'epub',
  async convert(file, ctx): Promise<ConvertResult> {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-pages-'));
    const imageExt = ctx.options.imageFormat;
    const extracted = await tryExtractFirst(file.sourcePath);
    if (extracted.length > 0) {
      return {
        ok: true,
        pages: extracted.map((tempPath, idx) => ({
          index: idx + 1,
          tempPath,
          archiveName: toArchiveName(idx + 1, imageExt),
          format: imageExt,
          quality: ctx.options.imageQuality,
        })),
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
        const pagePath = join(root, toArchiveName(idx + 1, imageExt));
        const content = await renderer.renderChapter(chapterPath, idx + 1);
        await writeFile(pagePath, content, 'utf8');
        pages.push({
          index: idx + 1,
          tempPath: pagePath,
          archiveName: toArchiveName(idx + 1, imageExt),
          format: imageExt,
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
