import { basename } from 'node:path';
import pc from 'picocolors';
import type {
  ObsidianAgentsStatus,
  ObsidianAgentsStatusReport,
} from '../domain/obsidian-agents-service';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function displayWidth(value: string): number {
  let width = 0;
  for (const { segment } of segmenter.segment(value)) {
    if (/^\p{Mark}+$/u.test(segment)) continue;
    const point = segment.codePointAt(0) ?? 0;
    if (point < 32 || (point >= 127 && point < 160)) continue;
    width +=
      /\p{Extended_Pictographic}/u.test(segment) ||
      (point >= 0x1100 &&
        (point <= 0x115f ||
          point === 0x2329 ||
          point === 0x232a ||
          (point >= 0x2e80 && point <= 0xa4cf) ||
          (point >= 0xac00 && point <= 0xd7a3) ||
          (point >= 0xf900 && point <= 0xfaff) ||
          (point >= 0xfe10 && point <= 0xfe19) ||
          (point >= 0xfe30 && point <= 0xfe6f) ||
          (point >= 0xff00 && point <= 0xff60) ||
          (point >= 0xffe0 && point <= 0xffe6) ||
          point >= 0x20000))
        ? 2
        : 1;
  }
  return width;
}

function wrap(value: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  let used = 0;
  for (const { segment } of segmenter.segment(value)) {
    const size = displayWidth(segment);
    if (line && used + size > width) {
      // Prefer a word/path boundary while retaining every character, including spaces.
      const boundaries = [...line.matchAll(/[ /\\]/gu)];
      const last = boundaries.at(-1);
      const cut =
        last && displayWidth(line.slice(0, last.index + 1)) >= width / 2
          ? last.index + 1
          : line.length;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
      used = displayWidth(line);
    }
    line += segment;
    used += size;
  }
  lines.push(line);
  return lines;
}

export function quoteVaultPath(
  path: string,
  platform: NodeJS.Platform = process.platform,
): string {
  // PowerShell on Windows; POSIX shell elsewhere. Always quote supplied paths.
  return platform === 'win32'
    ? `'${path.replaceAll("'", "''")}'`
    : `'${path.replaceAll("'", "'\\''")}'`;
}

export function formatObsidianAgentsStatus(
  report: ObsidianAgentsStatusReport,
  options: {
    columns?: number;
    color?: boolean;
    platform?: NodeJS.Platform;
  } = {},
): string[] {
  const colors = pc.createColors(options.color ?? false);
  const width = Math.max(20, Math.min(options.columns ?? 80, 96));
  const lines: string[] = [colors.bold(colors.cyan('Obsidian Agents'))];
  const { total, healthy, needsAttention } = report.summary;
  if (total === 0) {
    lines.push('', 'No vaults configured.', 'Run: chc obsidian agents setup');
    return lines.flatMap((line) =>
      options.color ? [line] : wrap(line, width),
    );
  }
  const summary = `${total} ${total === 1 ? 'vault' : 'vaults'}  /  ${healthy} ready  /  ${needsAttention} needs attention`;
  lines.push(...wrap(summary, width).map(colors.dim));

  function detail(label: string, value: string) {
    const prefix = `  ${label.padEnd(9)}`;
    const continuation = ' '.repeat(prefix.length);
    wrap(value, width - prefix.length).forEach((line, index) => {
      lines.push((index === 0 ? colors.dim(prefix) : continuation) + line);
    });
  }

  for (const vault of report.vaults) {
    lines.push('');
    const title = basename(vault.vaultPath) || vault.vaultPath;
    const badge = vault.healthy ? 'READY' : 'NEEDS ATTENTION';
    const styledBadge = vault.healthy
      ? colors.green(badge)
      : colors.yellow(badge);
    if (width >= 48 && displayWidth(title) + badge.length + 3 <= width) {
      lines.push(
        colors.bold(title) +
          ' '.repeat(width - displayWidth(title) - badge.length) +
          styledBadge,
      );
    } else {
      lines.push(...wrap(title, width).map(colors.bold), styledBadge);
    }
    lines.push(colors.dim('-'.repeat(width)));
    detail('Vault', vault.vaultPath);
    if (vault.configured) {
      detail('Source', vault.sourcePath);
      detail('Link', vault.agentsPath);
      if (vault.link.resolvedTarget || vault.link.target) {
        detail('', `-> ${vault.link.resolvedTarget ?? vault.link.target}`);
      }
      if (vault.link.status !== 'correct')
        detail('Status', vault.link.status.replaceAll('_', ' '));
      detail(
        'Type',
        vault.link.type === 'junction'
          ? 'Directory junction'
          : vault.link.type === 'symbolic_link'
            ? 'Symbolic link'
            : 'No link',
      );
      detail(
        'Contents',
        `Skills ${vault.paths.skillsExists ? 'OK' : 'MISSING'}  /  State ${vault.paths.stateExists ? 'OK' : 'MISSING'}`,
      );
    }
    if (!vault.healthy) {
      lines.push('');
      vault.issues.forEach((issue, index) => {
        detail(index === 0 ? 'Issue' : '', issue);
      });
      detail('Action', actionForVault(vault));
      detail(
        '',
        `chc obsidian agents setup --vault ${quoteVaultPath(vault.vaultPath, options.platform)}`,
      );
    }
  }
  return lines;
}

function actionForVault(vault: ObsidianAgentsStatus): string {
  if (!vault.configured) return 'Configure this vault:';
  if (!vault.paths.vaultExists)
    return 'Restore the vault at this path, then rerun setup:';
  if (vault.link.status === 'not_link' || vault.link.status === 'unsupported') {
    return 'Relocate the occupied .agents path manually, then rerun setup:';
  }
  if (!vault.paths.sourceInsideVault)
    return 'Choose a visible source inside the vault during setup:';
  if (vault.source.kind !== 'absent' && vault.source.kind !== 'directory') {
    return 'Relocate the occupied source path manually, then rerun setup:';
  }
  return 'Create or repair the local directories and link:';
}
