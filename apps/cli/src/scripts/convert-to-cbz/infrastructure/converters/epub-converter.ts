import { readFile, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { strFromU8, unzipSync } from 'fflate';
import type { ImageFormat } from '../../domain/conversion-types';
import type { Converter, ConvertResult } from '../../domain/converter';
import { conversionFailure } from '../../domain/errors';
import { toArchiveName } from '../../domain/path-mapping';

type XmlElement = {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
};

const xmlParser = new XMLParser({
  allowBooleanAttributes: true,
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  preserveOrder: true,
  trimValues: false,
});

const localName = (value: string): string =>
  value.toLowerCase().split(':').at(-1) ?? value.toLowerCase();

const collectElements = (
  value: unknown,
  acceptedNames: ReadonlySet<string>,
  output: XmlElement[] = [],
): ReadonlyArray<XmlElement> => {
  if (Array.isArray(value)) {
    for (const child of value) {
      collectElements(child, acceptedNames, output);
    }
    return output;
  }
  if (!value || typeof value !== 'object') return output;

  const node = value as Record<string, unknown>;
  const attributes = Object.fromEntries(
    Object.entries(
      node[':@'] && typeof node[':@'] === 'object'
        ? (node[':@'] as Record<string, unknown>)
        : {},
    )
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      )
      .map(([name, attrValue]) => [name.toLowerCase(), attrValue]),
  );

  for (const [name, child] of Object.entries(node)) {
    if (name === ':@') continue;
    const normalizedName = localName(name);
    if (acceptedNames.has(normalizedName)) {
      output.push({ name: normalizedName, attributes });
    }
    collectElements(child, acceptedNames, output);
  }
  return output;
};

const parseElements = (
  xml: string,
  acceptedNames: ReadonlyArray<string>,
): ReadonlyArray<XmlElement> =>
  collectElements(
    xmlParser.parse(xml),
    new Set(acceptedNames.map((name) => name.toLowerCase())),
  );

const getAttribute = (
  element: XmlElement,
  acceptedNames: ReadonlyArray<string>,
): string | undefined => {
  for (const acceptedName of acceptedNames) {
    const exact = element.attributes[acceptedName.toLowerCase()];
    if (exact !== undefined) return exact;
  }
  const acceptedLocalNames = new Set(acceptedNames.map(localName));
  return Object.entries(element.attributes).find(([name]) =>
    acceptedLocalNames.has(localName(name)),
  )?.[1];
};

const normalizeArchivePath = (value: string): string =>
  value.replaceAll('\\', '/').replace(/^\/+/, '');

const decodeArchiveReference = (value: string): string | undefined => {
  const withoutFragment = value.split(/[?#]/, 1)[0]?.trim() ?? '';
  if (withoutFragment.length === 0) return undefined;
  try {
    return decodeURIComponent(withoutFragment);
  } catch {
    return undefined;
  }
};

const resolveArchiveReference = (
  baseDir: string,
  reference: string,
): string | undefined => {
  const decoded = decodeArchiveReference(reference);
  if (
    !decoded ||
    decoded.startsWith('/') ||
    decoded.startsWith('\\') ||
    /^[a-z][a-z0-9+.-]*:/i.test(decoded)
  ) {
    return undefined;
  }
  const resolved = posix.normalize(
    posix.join(normalizeArchivePath(baseDir), normalizeArchivePath(decoded)),
  );
  if (
    resolved === '..' ||
    resolved.startsWith('../') ||
    posix.isAbsolute(resolved)
  ) {
    return undefined;
  }
  return normalizeArchivePath(resolved);
};

const indexArchiveEntries = (
  files: Readonly<Record<string, Uint8Array>>,
): ReadonlyMap<string, Uint8Array> => {
  const entries = new Map<string, Uint8Array>();
  for (const [name, content] of Object.entries(files)) {
    const normalized = normalizeArchivePath(name);
    entries.set(normalized, content);
    const decoded = decodeArchiveReference(normalized);
    if (decoded) entries.set(normalizeArchivePath(decoded), content);
  }
  return entries;
};

const detectImageFormat = (content: Uint8Array): ImageFormat | undefined => {
  if (
    content.length >= 3 &&
    content[0] === 0xff &&
    content[1] === 0xd8 &&
    content[2] === 0xff
  ) {
    return 'jpg';
  }
  if (
    content.length >= 8 &&
    content[0] === 0x89 &&
    content[1] === 0x50 &&
    content[2] === 0x4e &&
    content[3] === 0x47 &&
    content[4] === 0x0d &&
    content[5] === 0x0a &&
    content[6] === 0x1a &&
    content[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    content.length >= 12 &&
    strFromU8(content.subarray(0, 4)) === 'RIFF' &&
    strFromU8(content.subarray(8, 12)) === 'WEBP'
  ) {
    return 'webp';
  }
  return undefined;
};

const findPackagePath = (
  entries: ReadonlyMap<string, Uint8Array>,
): string | undefined => {
  const container = entries.get('META-INF/container.xml');
  if (!container) return undefined;
  const rootfile = parseElements(strFromU8(container), ['rootfile'])[0];
  const fullPath = rootfile ? getAttribute(rootfile, ['full-path']) : undefined;
  return fullPath ? resolveArchiveReference('', fullPath) : undefined;
};

const collectOrderedImageEntries = (
  entries: ReadonlyMap<string, Uint8Array>,
  packagePath: string,
): ReadonlyArray<{
  readonly content: Uint8Array;
  readonly format: ImageFormat;
  readonly sourcePath: string;
}> => {
  const packageContent = entries.get(packagePath);
  if (!packageContent) return [];

  const opfXml = strFromU8(packageContent);
  const packageDir = posix.dirname(packagePath);
  const manifest = new Map(
    parseElements(opfXml, ['item'])
      .map((element) => {
        const id = getAttribute(element, ['id']);
        const href = getAttribute(element, ['href']);
        return id && href ? ([id, href] as const) : undefined;
      })
      .filter(
        (entry): entry is readonly [string, string] => entry !== undefined,
      ),
  );
  const spineIds = parseElements(opfXml, ['itemref'])
    .map((element) => getAttribute(element, ['idref']))
    .filter((value): value is string => value !== undefined);

  return spineIds.flatMap((id) => {
    const documentHref = manifest.get(id);
    const documentPath = documentHref
      ? resolveArchiveReference(packageDir, documentHref)
      : undefined;
    const documentContent = documentPath
      ? entries.get(documentPath)
      : undefined;
    if (!documentPath || !documentContent) return [];

    return parseElements(strFromU8(documentContent), ['img', 'image'])
      .map((element) =>
        element.name === 'img'
          ? getAttribute(element, ['src'])
          : getAttribute(element, ['href', 'xlink:href']),
      )
      .map((reference) =>
        reference
          ? resolveArchiveReference(posix.dirname(documentPath), reference)
          : undefined,
      )
      .filter((path): path is string => path !== undefined)
      .map((sourcePath) => {
        const content = entries.get(sourcePath);
        const format = content ? detectImageFormat(content) : undefined;
        return content && format ? { content, format, sourcePath } : undefined;
      })
      .filter(
        (
          entry,
        ): entry is {
          readonly content: Uint8Array;
          readonly format: ImageFormat;
          readonly sourcePath: string;
        } => entry !== undefined,
      );
  });
};

export const epubConverter: Converter = {
  sourceType: 'epub',
  async convert(file, ctx): Promise<ConvertResult> {
    try {
      const bytes = await readFile(file.sourcePath);
      const entries = indexArchiveEntries(unzipSync(bytes));
      const packagePath = findPackagePath(entries);
      const imageEntries = packagePath
        ? collectOrderedImageEntries(entries, packagePath)
        : [];

      if (imageEntries.length === 0) {
        return {
          ok: false,
          failure: conversionFailure(
            file.sourcePath,
            'convert',
            'EPUB contains no valid ordered JPEG, PNG, or WebP page images',
          ),
        };
      }

      const pages = [];
      for (const [offset, entry] of imageEntries.entries()) {
        const index = offset + 1;
        const tempPath = posix.join(
          ctx.workspace.rootPath.replaceAll('\\', '/'),
          `epub-${String(index).padStart(5, '0')}.${entry.format}`,
        );
        await writeFile(tempPath, entry.content);
        pages.push({
          archiveName: toArchiveName(index, entry.format),
          format: entry.format,
          index,
          quality: ctx.options.imageQuality,
          tempPath,
        });
        ctx.onProgress?.(file, {
          current: index,
          message: 'extract',
          total: imageEntries.length,
        });
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
};
