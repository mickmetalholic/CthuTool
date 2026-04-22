import { MultiBar, Presets, type SingleBar } from 'cli-progress';
import { createColors } from 'picocolors';
import {
  assignProgressSlot,
  createProgressSlots,
  type ProgressSlot,
  releaseProgressSlot,
  sanitizeRelativeDisplayName,
} from './progress-view-model';

export type ProgressLogger = {
  start: (totalFiles: number, fileConcurrency: number) => void;
  beginFile: (taskId: string, displayName: string) => void;
  updateFile: (
    taskId: string,
    current: number,
    total: number,
    message?: string,
  ) => void;
  finishFile: (taskId: string, failed?: boolean) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  summary: (input: ConversionSummaryLike) => void;
  incrementTotal: () => void;
  flush: () => Promise<void>;
  stop: () => void;
};

export type ConversionSummaryLike = {
  readonly totalFiles: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly failures: ReadonlyArray<{
    readonly sourcePath: string;
    readonly reason: string;
  }>;
  readonly outputRoot: string;
  readonly durationMs: number;
};

// Force color to satisfy the CLI output contract (multi-color + distinct bars).
const c = createColors(true);

type QueueState = {
  queue: string[];
  writing: boolean;
  pendingFlush: Array<() => void>;
};

type MultiBarLike = {
  create: (
    totalValue: number,
    startValue: number,
    payload?: Record<string, unknown>,
    barOptions?: Record<string, unknown>,
  ) => SingleBar;
  remove: (bar: SingleBar) => boolean;
  stop: () => void;
  log: (message: string) => void;
};

type RuntimeProgressState = {
  slots: ReadonlyArray<ProgressSlot>;
  barBySlot: Map<number, SingleBar>;
  totalBar: SingleBar | null;
  totals: Map<string, number>;
  totalFilesPlanned: number;
  totalFilesDone: number;
  lastPrintedPercentByTask: Map<string, number>;
};

const createQueueState = (): QueueState => ({
  queue: [],
  writing: false,
  pendingFlush: [],
});

const pump = (
  state: QueueState,
  sink: { writeLine: (line: string) => void },
) => {
  if (state.writing || state.queue.length === 0) {
    if (!state.writing && state.queue.length === 0) {
      const waiters = [...state.pendingFlush];
      state.pendingFlush = [];
      for (const resolve of waiters) resolve();
    }
    return;
  }
  state.writing = true;
  const next = state.queue.shift() as string;
  sink.writeLine(next);
  state.writing = false;
  pump(state, sink);
};

const enqueue = (
  state: QueueState,
  sink: { writeLine: (line: string) => void },
  line: string,
): void => {
  state.queue.push(line);
  pump(state, sink);
};

const beautifyPhaseMessage = (message: string): string => {
  const normalized = message.trim().toLowerCase();
  if (normalized.length === 0) return '';
  if (normalized === 'extract') return '📚 extracting pages';
  if (normalized === 'render-fallback') return '🖼 rendering fallback';
  if (normalized === 'pdfinfo ready') return '🔎 metadata ready';
  if (normalized === 'render') return '🖨 rendering pages';
  if (normalized === 'processed') return '✅ pages processed';
  if (normalized === 'done') return '✅ done';
  if (normalized === 'failed') return '❌ failed';
  return `• ${message}`;
};

const colorizeCount = (
  kind: 'total' | 'file' | undefined,
  text: string,
): string =>
  kind === 'total' ? c.cyan(text) : kind === 'file' ? c.magenta(text) : text;

const TOTAL_TAG = '🌐 TOTAL';
const FILE_TAG = '📄 FILE ';

export const formatEnglishSummary = (
  input: ConversionSummaryLike,
): string[] => {
  const durationSec = Math.max(0, Math.round(input.durationMs / 1000));
  const stats = [
    `${c.cyan('🌐 Total Files')}   ${c.bold(String(input.totalFiles))}`,
    `${c.green('✅ Success')}      ${c.bold(String(input.successCount))}`,
    `${input.failureCount > 0 ? c.red('❌ Failed') : c.green('❌ Failed')}       ${c.bold(String(input.failureCount))}`,
    `${c.blue('📂 Output')}       ${c.bold(input.outputRoot)}`,
    `${c.yellow('⏱ Time')}         ${c.bold(`${durationSec}s`)}`,
  ];
  const failures =
    input.failureCount === 0
      ? [c.green('✅ No failures recorded.')]
      : [
          c.red(`❌ Failure Details (${input.failureCount})`),
          ...input.failures.slice(0, 20).map((f) => {
            const src = c.yellow(f.sourcePath);
            const reason = c.red(f.reason);
            return `  • ${src} ${c.dim('->')} ${reason}`;
          }),
          ...(input.failures.length > 20
            ? [c.dim(`  … and ${input.failures.length - 20} more`)]
            : []),
        ];

  return [
    c.bold(c.magenta('╭─ 📦 convert-to-cbz summary')),
    `${c.magenta('│')} ${c.dim('────────────────────────────────────────')}`,
    ...stats.map((line) => `${c.magenta('│')} ${line}`),
    `${c.magenta('│')}`,
    ...failures.map((line) => `${c.magenta('│')} ${line}`),
    c.bold(c.magenta('╰─ done')),
  ];
};

export const createBarFormatterForTest = () => {
  return (
    // biome-ignore lint/suspicious/noExplicitAny: cli-progress formatter types are not exported
    options: any,
    // biome-ignore lint/suspicious/noExplicitAny: cli-progress formatter types are not exported
    params: any,
    // biome-ignore lint/suspicious/noExplicitAny: payload is runtime-defined
    payload: any,
  ): string => {
    const kind = payload?.kind as 'total' | 'file' | undefined;
    if (kind === 'file' && payload?.active !== true) return '';

    const labelRaw = typeof payload?.label === 'string' ? payload.label : '';
    const label = labelRaw.length > 0 ? c.bold(labelRaw) : '';
    const messageRaw =
      typeof payload?.message === 'string' ? payload.message : '';
    const message = beautifyPhaseMessage(messageRaw);
    const title = message ? `${label} ${c.dim(message)}` : label;

    const progressRaw =
      typeof params?.progress === 'number' ? params.progress : 0;
    const progress = Math.min(Math.max(progressRaw, 0), 1);
    const barSize =
      typeof options?.barsize === 'number' && options.barsize > 0
        ? Math.floor(options.barsize)
        : 40;
    const completeChar =
      typeof options?.barCompleteChar === 'string' &&
      options.barCompleteChar.length > 0
        ? options.barCompleteChar
        : '=';
    const incompleteChar =
      typeof options?.barIncompleteChar === 'string' &&
      options.barIncompleteChar.length > 0
        ? options.barIncompleteChar
        : '-';
    const completeCount = Math.round(progress * barSize);
    const barText =
      completeChar.repeat(completeCount) +
      incompleteChar.repeat(Math.max(0, barSize - completeCount));
    const coloredBar =
      kind === 'total'
        ? c.cyan(barText)
        : kind === 'file'
          ? c.magenta(barText)
          : barText;

    const badge =
      kind === 'total'
        ? c.bold(c.bgCyan(c.black(` ${TOTAL_TAG} `)))
        : kind === 'file'
          ? c.bold(c.bgMagenta(c.white(` ${FILE_TAG} `)))
          : c.bold(c.bgWhite(c.black(' STEP ')));
    const percentage = c.bold(`${Math.floor(progress * 100)}%`);
    const value = typeof params?.value === 'number' ? params.value : 0;
    const total = typeof params?.total === 'number' ? params.total : 0;
    const counts = colorizeCount(kind, `${value}/${total}`);
    return `${badge} ${coloredBar} ${percentage} | ${counts} | ${title}`;
  };
};

export const createProgressLogger = (deps?: {
  readonly createMultiBar?: (format: unknown) => MultiBarLike;
}): ProgressLogger => {
  const state = createQueueState();
  const progress: RuntimeProgressState = {
    slots: [],
    barBySlot: new Map(),
    totalBar: null,
    totals: new Map(),
    totalFilesPlanned: 0,
    totalFilesDone: 0,
    lastPrintedPercentByTask: new Map(),
  };
  const supportsInteractiveBars = deps?.createMultiBar
    ? true
    : process.stdout.isTTY === true;
  let multiBar: MultiBarLike | null = null;

  const sink = {
    writeLine: (line: string) => {
      if (multiBar) {
        multiBar.log(`${line}\n`);
        return;
      }
      process.stdout.write(`${line}\n`);
    },
  };

  const ensureMultiBar = () => {
    if (!supportsInteractiveBars) return null;
    if (multiBar) return multiBar;
    const formatter = createBarFormatterForTest();
    if (deps?.createMultiBar) {
      multiBar = deps.createMultiBar(formatter);
      return multiBar;
    }
    multiBar = new MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        stream: process.stdout,
        noTTYOutput: true,
        notTTYSchedule: 100,
        format: formatter,
      },
      Presets.shades_classic,
    ) as unknown as MultiBarLike;
    return multiBar;
  };

  const slotByTask = (taskId: string): ProgressSlot | undefined =>
    progress.slots.find((s) => s.taskId === taskId);

  return {
    start: (totalFiles, fileConcurrency) => {
      progress.totalFilesPlanned = totalFiles;
      progress.totalFilesDone = 0;
      progress.lastPrintedPercentByTask.clear();
      progress.slots = createProgressSlots(fileConcurrency);
      progress.barBySlot.clear();
      if (!supportsInteractiveBars) {
        enqueue(
          state,
          sink,
          `${c.cyan(TOTAL_TAG)} ${c.bold('0')}/${c.bold(String(totalFiles))}`,
        );
        return;
      }
      const mb = ensureMultiBar();
      if (!mb) return;
      progress.totalBar = mb.create(totalFiles, 0, {
        kind: 'total',
        label: 'Total',
        active: true,
      });
    },
    beginFile: (taskId, displayName) => {
      const safeName = sanitizeRelativeDisplayName(displayName);
      progress.slots = assignProgressSlot(progress.slots, taskId, safeName);
      const slot = slotByTask(taskId);
      if (!slot) return;
      if (!supportsInteractiveBars) {
        enqueue(
          state,
          sink,
          `${c.magenta(FILE_TAG)} ${c.bold(safeName)} ${c.dim('started')}`,
        );
        return;
      }
      const mb = ensureMultiBar();
      if (!mb) return;
      const existing = progress.barBySlot.get(slot.slotId);
      const bar =
        existing ??
        mb.create(1, 0, {
          kind: 'file',
          active: true,
          label: safeName,
          message: '',
        });
      progress.barBySlot.set(slot.slotId, bar);
      bar.setTotal(1);
      bar.update(0, {
        kind: 'file',
        active: true,
        label: safeName,
        message: '',
      });
      progress.totals.set(taskId, 1);
    },
    updateFile: (taskId, current, total, message) => {
      const slot = slotByTask(taskId);
      if (!slot) return;
      if (!supportsInteractiveBars) {
        const safeTotal = Math.max(1, total);
        const percent = Math.floor(
          (Math.min(current, safeTotal) / safeTotal) * 100,
        );
        const last = progress.lastPrintedPercentByTask.get(taskId) ?? -1;
        if (percent === 100 || percent - last >= 20) {
          progress.lastPrintedPercentByTask.set(taskId, percent);
          const phase = beautifyPhaseMessage(message ?? '');
          const phaseText = phase.length > 0 ? ` ${c.dim(phase)}` : '';
          enqueue(
            state,
            sink,
            `${c.magenta(FILE_TAG)} ${c.bold(slot.displayName ?? '')} ${c.bold(`${percent}%`)} ${c.magenta(`${Math.min(current, safeTotal)}/${safeTotal}`)}${phaseText}`,
          );
        }
        return;
      }
      const bar = progress.barBySlot.get(slot.slotId);
      if (!bar) return;
      const nextTotal = Math.max(1, total);
      bar.setTotal(nextTotal);
      progress.totals.set(taskId, nextTotal);
      bar.update(Math.min(current, nextTotal), {
        kind: 'file',
        active: true,
        label: slot.displayName ?? '',
        message: message ?? '',
      });
    },
    finishFile: (taskId, failed = false) => {
      const slot = slotByTask(taskId);
      progress.totals.delete(taskId);
      progress.lastPrintedPercentByTask.delete(taskId);
      if (slot) {
        if (!supportsInteractiveBars) {
          enqueue(
            state,
            sink,
            `${failed ? c.red('❌') : c.green('✅')} ${c.bold(slot.displayName ?? '')} ${c.dim(failed ? 'failed' : 'done')}`,
          );
        }
        const bar = progress.barBySlot.get(slot.slotId);
        if (bar && supportsInteractiveBars) {
          if (multiBar) {
            multiBar.remove(bar);
          }
          progress.barBySlot.delete(slot.slotId);
        }
      }
      progress.slots = releaseProgressSlot(progress.slots, taskId, failed);
    },
    info: (message) => enqueue(state, sink, `${c.cyan('ℹ️ INFO')} ${message}`),
    success: (message) =>
      enqueue(state, sink, `${c.green('✅ SUCCESS')} ${message}`),
    warn: (message) => enqueue(state, sink, `${c.yellow('⚠️ WARN')} ${message}`),
    error: (message) => enqueue(state, sink, `${c.red('❌ ERROR')} ${message}`),
    summary: (input) => {
      for (const line of formatEnglishSummary(input)) {
        enqueue(state, sink, line);
      }
    },
    incrementTotal: () => {
      progress.totalFilesDone += 1;
      if (progress.totalBar) {
        progress.totalBar.increment();
      }
      if (!supportsInteractiveBars) {
        enqueue(
          state,
          sink,
          `${c.cyan(TOTAL_TAG)} ${c.bold(String(progress.totalFilesDone))}/${c.bold(String(progress.totalFilesPlanned))}`,
        );
      }
    },
    flush: () =>
      new Promise<void>((resolve) => {
        state.pendingFlush.push(resolve);
        pump(state, sink);
      }),
    stop: () => {
      if (multiBar) {
        multiBar.stop();
      }
    },
  };
};
