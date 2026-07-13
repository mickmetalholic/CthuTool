import pc from 'picocolors';
import {
  listSelectable,
  type ScriptCatalog,
  type ScriptCatalogRow,
} from '../domain/script-catalog';
import { getBundledScriptsRoot } from './bundled-scripts-root';
import { discoverScripts } from './discover-scripts';

const maxDescriptionLength = 160;
const maxWarnings = 5;

function boundedDescription(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.length <= maxDescriptionLength
    ? value
    : `${value.slice(0, maxDescriptionLength - 1)}…`;
}

export function toBundledScriptCatalogRows(
  catalog: ScriptCatalog,
): readonly ScriptCatalogRow[] {
  return listSelectable(catalog).map((row) => ({
    ...row,
    description: boundedDescription(row.description),
  }));
}

export function loadBundledScriptCatalog() {
  return discoverScripts(getBundledScriptsRoot());
}

export async function getBundledScriptIdCandidates(): Promise<
  readonly string[]
> {
  const discovered = await loadBundledScriptCatalog();
  return discovered.isOk()
    ? toBundledScriptCatalogRows(discovered.value).map((row) => row.id)
    : [];
}

export function formatBundledScriptCatalog(
  catalog: ScriptCatalog,
  heading = 'AVAILABLE SCRIPTS',
): string {
  const rows = toBundledScriptCatalogRows(catalog);
  const width = Math.max(0, ...rows.map((row) => row.id.length));
  const lines = [heading, ''];
  if (rows.length === 0) {
    lines.push('  No bundled scripts available.');
  } else {
    for (const row of rows) {
      const detail = row.description
        ? `${row.title} — ${row.description}`
        : row.title;
      lines.push(`  ${pc.cyan(row.id.padEnd(width + 2))}${detail}`);
    }
  }
  if (catalog.warnings.length > 0) {
    lines.push('', 'WARNINGS', '');
    for (const warning of catalog.warnings.slice(0, maxWarnings)) {
      lines.push(`  ${warning.path}: ${warning.message}`);
    }
    const omitted = catalog.warnings.length - maxWarnings;
    if (omitted > 0) {
      lines.push(`  ... ${omitted} more warnings`);
    }
  }
  return lines.join('\n');
}

export async function renderBundledScriptHelpAppendix(): Promise<string> {
  const discovered = await loadBundledScriptCatalog();
  if (discovered.isErr()) {
    return [
      'AVAILABLE SCRIPTS',
      '',
      `  Unavailable: ${discovered.error.message}`,
    ].join('\n');
  }
  return formatBundledScriptCatalog(discovered.value);
}
