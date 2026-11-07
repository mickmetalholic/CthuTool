import { stripVTControlCharacters } from 'node:util';
import pc from 'picocolors';
import type {
  adoptFiles,
  applyConfiguration,
  saveBinding,
} from '../domain/dotfiles/configuration';
import type { diagnose, installEntry } from '../domain/dotfiles/environment';
import type { resolvePlan } from '../domain/dotfiles/model';
import type {
  ToolPreparation,
  ToolPreparationEvent,
} from '../infra/dotfiles/tooling';
import type { CliContext } from '../runtime/cli-context';
import { type CliOutput, processOutput } from '../runtime/output';

type Plan = ReturnType<typeof resolvePlan>;
type Installation = Awaited<ReturnType<typeof installEntry>>;
type NotionSyncResult = {
  source: string;
  hasChanges: boolean;
  changes: { path: string; before: string; after: string }[];
  retired: string[];
  published: boolean;
  generation: number;
  alignmentReviewed: boolean;
};
export type DotfilesResults = {
  init: Awaited<ReturnType<typeof saveBinding>> & {
    environment: {
      os: string;
      arch: string;
      wsl: boolean;
      node: string;
      tools: ToolPreparation[];
    };
    plan: Plan;
    adoption?: Awaited<ReturnType<typeof adoptFiles>>;
    next: string[];
  };
  'env setup': { plan: Plan } & (
    | { source: string; dryRun: true }
    | {
        results: (
          | Installation
          | { id: string; status: 'failed'; detail: string }
        )[];
        blockingFailures: number;
        next: string;
      }
  );
  'env doctor': Awaited<ReturnType<typeof diagnose>> & {
    source: string;
    host: string | null;
    bindingIssue?: string;
  };
  'config add': Awaited<ReturnType<typeof adoptFiles>>;
  'config diff': { output: string };
  'config apply': Awaited<ReturnType<typeof applyConfiguration>>;
  'notion auth':
    | { cleared: true; environmentStillActive: boolean }
    | { authenticated: true; credentialSource: 'environment' | 'cache' };
  'notion validate': {
    source: string;
    valid: boolean;
    hosts: string[];
    modelVersion: number;
    alignmentReviewed: boolean;
  };
  'notion diff': NotionSyncResult;
  'notion pull': NotionSyncResult;
};
export type DotfilesProgress =
  | ToolPreparationEvent
  | {
      type: 'environment';
      os: string;
      arch: string;
      wsl: boolean;
      node: string;
    }
  | { type: 'phase'; title: string; detail?: string };

type Tone = 'success' | 'warning' | 'error' | 'muted';
type RendererDeps = {
  output: CliOutput;
  isOutputTty: () => boolean;
  isColorSupported: () => boolean;
  columns?: () => number;
};
const defaultDeps: RendererDeps = {
  output: processOutput,
  isOutputTty: () => process.stdout.isTTY === true,
  isColorSupported: () => pc.isColorSupported,
  columns: () => process.stdout.columns ?? 100,
};
const text = (value: string) =>
  stripVTControlCharacters(value).replaceAll(/\p{Cc}/gu, (character) =>
    character === '\n' ? character : '',
  );
const count = (amount: number, noun: string) =>
  `${amount} ${noun}${amount === 1 ? '' : 's'}`;
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
function width(value: string): number {
  let size = 0;
  for (const { segment } of graphemes.segment(value)) {
    if (/^\p{Mark}+$/u.test(segment)) continue;
    const code = segment.codePointAt(0) ?? 0;
    size +=
      /\p{Extended_Pictographic}/u.test(segment) ||
      (code >= 0x1100 &&
        (code <= 0x115f ||
          (code >= 0x2e80 && code <= 0xa4cf) ||
          (code >= 0xac00 && code <= 0xd7a3) ||
          (code >= 0xf900 && code <= 0xfaff) ||
          (code >= 0xfe10 && code <= 0xff60) ||
          code >= 0x20000))
        ? 2
        : 1;
  }
  return size;
}
function wrap(value: string, columns: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const { segment } of graphemes.segment(value)) {
    if (line && width(line + segment) > columns) {
      const boundary = [...line.matchAll(/[ ,/\\]/gu)].at(-1);
      const cut =
        boundary && boundary.index >= line.length / 2
          ? boundary.index + 1
          : line.length;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
    line += segment;
  }
  lines.push(line);
  return lines;
}

/** Human presentation stays separate from the JSON result and native chezmoi output. */
export function createDotfilesRenderer(
  context: CliContext,
  command: keyof DotfilesResults,
  deps: RendererDeps = defaultDeps,
) {
  const human = !context.json && !context.quiet;
  const c = pc.createColors(deps.isOutputTty() && deps.isColorSupported());
  const columns = Math.max(40, Math.min(100, deps.columns?.() ?? 100));
  let started = false;
  const tone = (value: string, style: Tone) =>
    ({ success: c.green, warning: c.yellow, error: c.red, muted: c.dim })[
      style
    ](value);
  const write = (line = '') => {
    if (human) deps.output.stdout.write(`${line}\n`);
  };
  const start = () => {
    if (started || !human) return;
    started = true;
    write(
      `${c.bold(c.cyan('◆ CthuTool'))}  ${c.dim(`dotfiles › ${command.replaceAll(' ', ' › ')}`)}`,
    );
  };
  const section = (title: string) => {
    start();
    write(c.dim('│'));
    write(`${c.cyan('◇')} ${c.bold(text(title))}`);
  };
  const row = (label: string, value: string, style?: Tone) => {
    const lines = text(value)
      .split('\n')
      .flatMap((line) => wrap(line, columns - 18));
    for (const [index, line] of lines.entries())
      write(
        `${c.dim('│')}  ${c.dim((index === 0 ? text(label) : '').padEnd(13))}  ${style ? tone(line, style) : line}`,
      );
  };
  const item = (label: string, value: string, style: Tone = 'muted') => {
    const symbol = { success: '✓', warning: '!', error: '✗', muted: '·' }[
      style
    ];
    write(
      `${c.dim('│')}  ${tone(symbol, style)} ${c.bold(text(label))}${value ? `  ${tone(text(value), style)}` : ''}`,
    );
  };
  const finish = (message: string, style: Tone = 'success') => {
    write(c.dim('│'));
    write(
      `${c.dim('└')} ${tone(`${style === 'success' ? '✓' : style === 'error' ? '✗' : '!'} ${message}`, style)}`,
    );
  };
  const next = (commands: string[]) => {
    section('Next steps');
    for (const [index, value] of commands.entries())
      row(`${index + 1}.`, value);
  };
  const profile = (plan: Plan) => {
    row('Host', plan.host);
    row('Platform', plan.os);
    row('Shell', plan.shell);
    row('Terminal', plan.terminal);
    row('Toolsets', plan.toolsets.join(', ') || 'none');
    const packages = plan.entries.filter(
      (e) => e.classification === 'package',
    ).length;
    row(
      'Software',
      `${packages} packages · ${plan.entries.length - packages} runtimes · ${plan.skipped.length} unsupported`,
    );
  };
  const alignment = (reviewed: boolean) =>
    row(
      'Alignment',
      reviewed ? 'reviewed' : 'review required before Notion publication',
      reviewed ? 'success' : 'warning',
    );
  const sync = (result: NotionSyncResult, pull: boolean) => {
    section(pull ? 'Notion publication' : 'Notion comparison');
    row('Source', result.source);
    row('Generation', String(result.generation));
    alignment(result.alignmentReviewed);
    row(
      'Changes',
      `${result.changes.length} files · ${result.retired.length} retirements`,
    );
    if (result.changes.length) {
      section(result.published ? 'Published files' : 'Changed files');
      for (const change of result.changes) item(change.path, '', 'warning');
    }
    if (!pull) {
      for (const change of result.changes) {
        section(change.path);
        // Retain both complete versions for review; JSON consumers receive the same fields.
        row('Published', '--- local snapshot', 'error');
        for (const line of change.before.trimEnd().split('\n'))
          row('', line, 'error');
        row('Notion', '+++ candidate snapshot', 'success');
        for (const line of change.after.trimEnd().split('\n'))
          row('', line, 'success');
      }
    }
    if (result.retired.length) {
      section('Retirements requiring acknowledgement');
      for (const key of result.retired) item(key, '--allow-retire', 'warning');
    }
    if (result.published)
      next(['git diff -- dotfiles/data dotfiles/notion/manifest.json']);
    else if (result.hasChanges) {
      if (!result.alignmentReviewed) {
        section('Before publication');
        row('Review', 'docs/dotfiles/reconciliation.md', 'warning');
      } else
        next([
          `chc dotfiles notion pull${result.retired.length ? ` --allow-retire ${result.retired.join(',')}` : ''}`,
        ]);
    }
    finish(
      result.published
        ? 'Snapshot published locally; ready for Git review'
        : result.hasChanges
          ? 'Differences found; review before publication'
          : 'Notion and the local snapshot match',
      result.hasChanges && !result.published ? 'warning' : 'success',
    );
  };
  const renderers: {
    [K in keyof DotfilesResults]: (result: DotfilesResults[K]) => void;
  } = {
    init(result) {
      section('Host profile');
      profile(result.plan);
      row('Source', result.source);
      row('Binding', result.configFile);
      if (result.previousConfigBackup)
        row('Backup', result.previousConfigBackup);
      if (result.legacyHint) row('Previous host', result.legacyHint);
      if (result.adoption) {
        section('Imported home files');
        for (const op of result.adoption.operations)
          item(op.target, op.command, 'success');
        row('Review', 'git diff -- dotfiles/home');
      }
      next(result.next);
      finish('Host binding saved');
    },
    'env setup'(result) {
      section(
        'dryRun' in result ? 'Software plan · dry run' : 'Software setup',
      );
      profile(result.plan);
      if ('dryRun' in result) {
        row('Source', result.source);
        section('Installation plan');
        for (const entry of result.plan.entries) {
          const policy = entry.platform;
          const owner =
            entry.classification === 'runtime' ? 'runtime' : policy?.owner;
          item(
            entry.id,
            `${owner === 'dot' ? `${policy?.install} · ${policy?.package}` : `managed by ${owner}`} · ${entry.provenance}`,
          );
          const guidance =
            policy?.guidance ??
            ('guidance' in entry.software
              ? entry.software.guidance
              : undefined);
          if (guidance) row('', guidance);
        }
      } else {
        section('Results');
        for (const entry of result.results) {
          const style =
            entry.status === 'failed'
              ? 'error'
              : ['installed', 'available'].includes(entry.status)
                ? 'success'
                : 'warning';
          item(entry.id, entry.status, style);
          if ('detail' in entry && entry.detail) row('', entry.detail);
        }
        row(
          'Summary',
          Object.entries(
            result.results.reduce<Record<string, number>>((counts, r) => {
              counts[r.status] = (counts[r.status] ?? 0) + 1;
              return counts;
            }, {}),
          )
            .map(([status, count]) => `${count} ${status}`)
            .join(' · ') || 'No software selected',
        );
      }
      if (result.plan.skipped.length) {
        section('Unsupported software');
        for (const entry of result.plan.skipped)
          item(entry.id, `${entry.reason} · ${entry.provenance}`, 'warning');
      }
      if ('dryRun' in result) {
        next([`chc dotfiles env setup --host ${result.plan.host}`]);
        finish('Preview complete; no installers ran');
      } else {
        next([
          'chc dotfiles env doctor',
          'chc dotfiles config diff',
          'mise install',
        ]);
        finish(
          result.blockingFailures
            ? `Setup finished with ${count(result.blockingFailures, 'failure')}`
            : 'Software setup complete; review manual and runtime actions above',
          result.blockingFailures ? 'error' : 'success',
        );
      }
    },
    'env doctor'(result) {
      section('Machine');
      row('Source', result.source);
      row('Host', result.host ?? 'unbound');
      if (result.bindingIssue)
        item('Host binding', result.bindingIssue, 'warning');
      section('Prerequisites');
      for (const p of result.prerequisites)
        item(
          p.command,
          p.available ? 'available' : 'missing',
          p.available ? 'success' : 'warning',
        );
      section('Git identity · read only');
      row('Name', result.gitIdentity.name || 'not configured');
      row('Email', result.gitIdentity.email || 'not configured');
      if (result.results.length) section('Software health');
      for (const entry of result.results) {
        const missing = entry.checks.some(
          (check) => check.status === 'missing',
        );
        const manual = entry.checks.some((check) => check.status === 'manual');
        item(
          entry.id,
          `${missing ? 'missing' : manual ? 'manual check' : 'ready'} · ${entry.severity}`,
          missing
            ? entry.severity === 'blocking'
              ? 'error'
              : 'warning'
            : manual
              ? 'warning'
              : 'success',
        );
        for (const check of entry.checks)
          row('', `${check.status} · ${check.type} · ${check.detail}`);
        if (entry.guidance) row('', entry.guidance);
      }
      const attention =
        !!result.bindingIssue ||
        result.prerequisites.some((p) => !p.available) ||
        result.results.some((r) => r.checks.some((c) => c.status !== 'ok'));
      finish(
        result.blockingFailures
          ? `${count(result.blockingFailures, 'blocking software failure')}`
          : attention
            ? 'Checks complete; review items above'
            : 'All checked software is ready',
        result.blockingFailures ? 'error' : attention ? 'warning' : 'success',
      );
    },
    'config add'(result) {
      section('Imported home files');
      row('Source', result.source);
      for (const op of result.operations)
        item(op.target, `chezmoi ${op.command}`, 'success');
      section('Private backups');
      for (const backup of result.backups) if (backup) row('Backup', backup);
      next(['git diff -- dotfiles/home', 'chc dotfiles config diff']);
      finish('Source updated; ready for review');
    },
    'config diff'(result) {
      section('Home configuration differences');
      if (result.output.trim()) {
        write();
        if (human)
          deps.output.stdout.write(
            result.output.endsWith('\n') ? result.output : `${result.output}\n`,
          );
        next([
          'chc dotfiles config add <home-path...>',
          'chc dotfiles config apply',
        ]);
        finish('Differences found', 'warning');
      } else finish('Home files match the rendered configuration');
    },
    'config apply'(result) {
      section('Home configuration');
      row('Host', result.host);
      row('Source', result.source);
      row(
        'Conflict mode',
        result.interactive
          ? 'native chezmoi prompts'
          : 'noninteractive preflight',
      );
      next(['chc dotfiles config diff', 'mise install']);
      finish('chezmoi apply completed; check diff for any skipped files');
    },
    'notion auth'(result) {
      section('Notion credentials');
      if ('cleared' in result) {
        row('Cache', 'cleared');
        if (result.environmentStillActive)
          item('NOTION_TOKEN', 'still active in this environment', 'warning');
        finish('Local credential cache cleared');
      } else {
        row(
          'Token source',
          result.credentialSource === 'environment'
            ? 'NOTION_TOKEN environment variable'
            : 'private local cache',
        );
        row('Access', 'software, toolsets and hosts verified');
        next(['chc dotfiles notion diff']);
        finish('Notion access verified');
      }
    },
    'notion validate'(result) {
      section('Published snapshot · offline');
      row('Source', result.source);
      row('Model', `v${result.modelVersion}`);
      alignment(result.alignmentReviewed);
      section(`Published hosts · ${result.hosts.length}`);
      for (const host of result.hosts) item(host, '', 'success');
      finish('Snapshot structure, digests and references are valid');
    },
    'notion diff': (result) => sync(result, false),
    'notion pull': (result) => sync(result, true),
  };
  return {
    start,
    progress(event: DotfilesProgress) {
      if (!human) return;
      switch (event.type) {
        case 'environment':
          section('Environment');
          row(
            'Platform',
            `${event.os}/${event.arch}${event.wsl ? ' · WSL' : ''}`,
          );
          row('Node', event.node);
          break;
        case 'tool_check':
          item(event.tool, 'checking…');
          break;
        case 'tool_install':
          item(
            event.tool,
            `missing · installing with ${event.installer}…`,
            'warning',
          );
          break;
        case 'tool_ready': {
          const tool = event.preparation;
          item(tool.tool, tool.status, 'success');
          row('Version', tool.version ?? 'unavailable');
          row('Executable', tool.path);
          break;
        }
        case 'phase':
          section(event.title);
          if (event.detail) row('Status', event.detail);
          break;
      }
    },
    result<K extends keyof DotfilesResults>(
      name: K,
      result: DotfilesResults[K],
    ) {
      if (human) renderers[name](result);
    },
  };
}
