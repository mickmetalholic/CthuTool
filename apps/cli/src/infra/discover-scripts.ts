import type { Dirent, Stats } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { ResultAsync } from 'neverthrow';
import {
  ENTRY_FILES,
  type ScriptCatalog,
  type ScriptPackage,
} from '../domain/script-catalog';
import { validateScriptId } from '../domain/script-id';
import { parseScriptManifest } from '../domain/script-manifest-schema';

export type DiscoveryError = { readonly message: string };

const MANIFEST_FILE = 'script.json';
export const reservedScriptIds = new Set(['list', 'run']);

const pushWarning = (
  warnings: Array<{ path: string; message: string }>,
  path: string,
  message: string,
) => {
  warnings.push({ path, message });
};

/**
 * Scans `scriptsRoot` for subfolders with valid `script.json` and a packaged
 * `index.js` or source `index.ts` entry.
 * Invalid packages are skipped; warnings collect actionable reasons.
 *
 * @param scriptsRoot Absolute path to bundled scripts root (e.g. `.../src/scripts`)
 */
export function discoverScripts(
  scriptsRoot: string,
): ResultAsync<ScriptCatalog, DiscoveryError> {
  return ResultAsync.fromPromise(scanScriptsRoot(scriptsRoot), (e) => ({
    message: e instanceof Error ? e.message : String(e),
  }));
}

async function scanScriptsRoot(scriptsRoot: string): Promise<ScriptCatalog> {
  const warnings: Array<{ path: string; message: string }> = [];
  const packages: ScriptPackage[] = [];
  const seenIds = new Set<string>();

  let entries: Dirent[];
  try {
    entries = await readdir(scriptsRoot, { withFileTypes: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `cannot read bundled scripts directory (${scriptsRoot}): ${msg}`,
    );
  }

  const names = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  for (const name of names) {
    const dirPath = join(scriptsRoot, name);
    const dirIdResult = validateScriptId(name);
    if (dirIdResult.isErr()) {
      pushWarning(
        warnings,
        dirPath,
        `skip non-kebab-case script folder: ${dirIdResult.error.message}`,
      );
      continue;
    }

    const manifestPath = join(dirPath, MANIFEST_FILE);
    let entryRelative: (typeof ENTRY_FILES)[number] | undefined;
    let entryStat: Stats | undefined;
    for (const candidate of ENTRY_FILES) {
      try {
        const candidateStat = await stat(join(dirPath, candidate));
        if (candidateStat.isFile()) {
          entryRelative = candidate;
          entryStat = candidateStat;
          break;
        }
      } catch {
        // Try the next supported entry filename.
      }
    }

    let manifestStat: Stats;
    try {
      manifestStat = await stat(manifestPath);
    } catch {
      pushWarning(
        warnings,
        dirPath,
        `missing ${MANIFEST_FILE} or ${ENTRY_FILES.join('/')} under script package`,
      );
      continue;
    }

    if (!manifestStat.isFile() || !entryRelative || !entryStat?.isFile()) {
      pushWarning(
        warnings,
        dirPath,
        `${MANIFEST_FILE} and one of ${ENTRY_FILES.join('/')} must be files`,
      );
      continue;
    }

    let rawJson: string;
    try {
      rawJson = await readFile(manifestPath, 'utf8');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushWarning(warnings, manifestPath, `cannot read manifest: ${msg}`);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson) as unknown;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushWarning(warnings, manifestPath, `invalid JSON: ${msg}`);
      continue;
    }

    const manifestResult = parseScriptManifest(parsed);
    if (manifestResult.isErr()) {
      pushWarning(
        warnings,
        manifestPath,
        `manifest validation failed: ${manifestResult.error.message}`,
      );
      continue;
    }

    const manifest = manifestResult.value;
    if (manifest.id !== name) {
      pushWarning(
        warnings,
        manifestPath,
        `manifest id "${manifest.id}" does not match folder name "${name}"`,
      );
      continue;
    }

    if (reservedScriptIds.has(manifest.id)) {
      pushWarning(
        warnings,
        manifestPath,
        `script id "${manifest.id}" is reserved for a scripts command operation`,
      );
      continue;
    }

    if (seenIds.has(manifest.id)) {
      pushWarning(
        warnings,
        dirPath,
        `duplicate script id "${manifest.id}" ignored (keep first in discovery order)`,
      );
      continue;
    }

    seenIds.add(manifest.id);
    packages.push({
      id: manifest.id,
      rootPath: dirPath,
      manifest,
      entryRelative,
    });
  }

  return { packages, warnings };
}
