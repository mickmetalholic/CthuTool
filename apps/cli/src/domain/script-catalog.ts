import { err, ok, type Result } from 'neverthrow';
import type { ScriptManifest } from './script-manifest-schema';

export const ENTRY_FILE = 'index.ts' as const;
export const PACKAGED_ENTRY_FILE = 'index.js' as const;
export const ENTRY_FILES = [PACKAGED_ENTRY_FILE, ENTRY_FILE] as const;

export type ScriptPackage = {
  readonly id: string;
  readonly rootPath: string;
  readonly manifest: ScriptManifest;
  readonly entryRelative: (typeof ENTRY_FILES)[number];
};

export type ScriptCatalog = {
  readonly packages: ReadonlyArray<ScriptPackage>;
  readonly warnings: ReadonlyArray<{
    readonly path: string;
    readonly message: string;
  }>;
};

export type CatalogResolveError =
  | { readonly kind: 'not_found'; readonly id: string }
  | { readonly kind: 'ambiguous'; readonly id: string };

export type ScriptCatalogRow = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
};

/**
 * Sorted selectable rows for prompts and listings.
 *
 * @param catalog Discovery result
 * @returns Stable id/title pairs for UI
 */
export const listSelectable = (
  catalog: ScriptCatalog,
): ReadonlyArray<ScriptCatalogRow> =>
  [...catalog.packages]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => ({
      id: p.id,
      title: p.manifest.title,
      description: p.manifest.description,
    }));

/**
 * Resolves a package by id from a catalog.
 *
 * @param catalog Discovery result
 * @param id Script id (kebab-case)
 * @returns Ok package or not-found / ambiguous
 */
export const resolvePackage = (
  catalog: ScriptCatalog,
  id: string,
): Result<ScriptPackage, CatalogResolveError> => {
  const matches = catalog.packages.filter((p) => p.id === id);
  if (matches.length === 0) {
    return err({ kind: 'not_found', id });
  }
  if (matches.length > 1) {
    return err({ kind: 'ambiguous', id });
  }
  const [first] = matches;
  return ok(first);
};
