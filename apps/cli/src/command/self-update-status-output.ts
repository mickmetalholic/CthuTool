import pc from 'picocolors';
import type { CliInstallationStatus } from '../domain/self-update-manager';
import type { CliContext } from '../runtime/cli-context';
import { type CliOutput, processOutput } from '../runtime/output';

export type SelfUpdateStatusRendererDeps = {
  readonly output: CliOutput;
  readonly isOutputTty: () => boolean;
  readonly isColorSupported: () => boolean;
};

const defaultDeps: SelfUpdateStatusRendererDeps = {
  output: processOutput,
  isOutputTty: () => process.stdout.isTTY === true,
  isColorSupported: () => pc.isColorSupported,
};

const statusMessageLength = 120;

function formatCommitTime(value: string): string {
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(Z|[+-]\d{2}:\d{2})$/,
  );
  return match ? `${match[1]} ${match[2]} ${match[3]}` : value;
}

function boundStatusMessage(value: string): string {
  const normalized = value.replaceAll(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  return characters.length <= statusMessageLength
    ? normalized
    : `${characters.slice(0, statusMessageLength - 1).join('')}…`;
}

export function renderCliInstallationStatus(
  context: CliContext,
  status: CliInstallationStatus,
  deps: SelfUpdateStatusRendererDeps = defaultDeps,
): void {
  if (context.json || context.quiet) return;

  const colors = pc.createColors(deps.isOutputTty() && deps.isColorSupported());
  const mode =
    status.mode === 'local'
      ? colors.magenta('● LOCAL')
      : colors.blue('● REMOTE');
  const commit = colors.yellow(status.commit ?? 'unavailable');
  const commitIdentity = status.commitTime
    ? `${commit} ${colors.dim(`· ${formatCommitTime(status.commitTime)}`)}`
    : commit;
  const bundle = status.bundlePresent
    ? `${colors.green('✓ present')} ${colors.dim(`· ${status.bundlePath}`)}`
    : `${colors.yellow('! missing')} ${colors.dim(`· ${status.bundlePath}`)}`;
  const sourceRow = (label: string, value: string) =>
    `│  ${colors.dim(label.padEnd(12))}${value}`;
  const installationRow = (label: string, value: string) =>
    `   ${colors.dim(label.padEnd(12))}${value}`;
  const lines = [
    `${colors.bold(colors.cyan('◆ CthuTool'))}  ${colors.dim(`v${status.version}`)}  ${mode}`,
    '│',
    `├─ ${colors.bold('Source')}`,
    sourceRow('Repository', status.repo),
    sourceRow('Ref', status.ref),
    sourceRow('Commit', commitIdentity),
  ];
  if (status.commitMessage) {
    lines.push(sourceRow('Message', boundStatusMessage(status.commitMessage)));
  }
  lines.push(
    '│',
    `└─ ${colors.bold('Installation')}`,
    installationRow('Directory', status.installDir),
    installationRow('Bundle', bundle),
  );
  deps.output.stdout.write(`${lines.join('\n')}\n`);
}
