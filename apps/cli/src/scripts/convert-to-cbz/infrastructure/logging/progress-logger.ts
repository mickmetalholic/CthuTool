import { MultiBar, Presets, type SingleBar } from 'cli-progress';
import pc from 'picocolors';
import {
  assignProgressSlot,
  createProgressSlots,
  type ProgressSlot,
  releaseProgressSlot,
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
  incrementTotal: () => void;
  flush: () => Promise<void>;
  stop: () => void;
};

type QueueState = {
  queue: string[];
  writing: boolean;
  pendingFlush: Array<() => void>;
};

type RuntimeProgressState = {
  slots: ReadonlyArray<ProgressSlot>;
  bars: Map<string, SingleBar>;
  barBySlot: Map<number, SingleBar>;
  totalBar: SingleBar | null;
  totals: Map<string, number>;
};

const createQueueState = (): QueueState => ({
  queue: [],
  writing: false,
  pendingFlush: [],
});

const pump = (state: QueueState) => {
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
  process.stdout.write(`${next}\n`, () => {
    state.writing = false;
    pump(state);
  });
};

const enqueue = (state: QueueState, line: string): void => {
  state.queue.push(line);
  pump(state);
};

export const createProgressLogger = (): ProgressLogger => {
  const state = createQueueState();
  const progress: RuntimeProgressState = {
    slots: [],
    bars: new Map(),
    barBySlot: new Map(),
    totalBar: null,
    totals: new Map(),
  };
  let multiBar: MultiBar | null = null;

  const ensureMultiBar = () => {
    if (multiBar) return multiBar;
    multiBar = new MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format: '{bar} {percentage}% | {value}/{total} | {label}',
      },
      Presets.shades_classic,
    );
    return multiBar;
  };

  const slotByTask = (taskId: string): ProgressSlot | undefined =>
    progress.slots.find((s) => s.taskId === taskId);

  return {
    start: (totalFiles, fileConcurrency) => {
      const mb = ensureMultiBar();
      progress.totalBar = mb.create(totalFiles, 0, { label: 'total' });
      progress.slots = createProgressSlots(fileConcurrency);
    },
    beginFile: (taskId, displayName) => {
      progress.slots = assignProgressSlot(progress.slots, taskId, displayName);
      const slot = slotByTask(taskId);
      if (!slot) return;
      const mb = ensureMultiBar();
      const bar = mb.create(1, 0, { label: displayName });
      progress.bars.set(taskId, bar);
      progress.barBySlot.set(slot.slotId, bar);
      progress.totals.set(taskId, 1);
    },
    updateFile: (taskId, current, total, message) => {
      const bar = progress.bars.get(taskId);
      if (!bar) return;
      bar.setTotal(Math.max(1, total));
      progress.totals.set(taskId, Math.max(1, total));
      bar.update(Math.min(current, Math.max(1, total)), {
        label: message ? `${taskId} ${message}` : taskId,
      });
    },
    finishFile: (taskId, failed = false) => {
      const slot = slotByTask(taskId);
      const bar = progress.bars.get(taskId);
      if (bar) {
        bar.update(progress.totals.get(taskId) ?? 1, {
          label: failed ? `${taskId} failed` : `${taskId} done`,
        });
      }
      progress.bars.delete(taskId);
      progress.totals.delete(taskId);
      if (slot) {
        progress.barBySlot.delete(slot.slotId);
      }
      progress.slots = releaseProgressSlot(progress.slots, taskId, failed);
    },
    info: (message) => enqueue(state, pc.cyan(message)),
    success: (message) => enqueue(state, pc.green(message)),
    warn: (message) => enqueue(state, pc.yellow(message)),
    error: (message) => enqueue(state, pc.red(message)),
    incrementTotal: () => {
      if (progress.totalBar) {
        progress.totalBar.increment();
      }
    },
    flush: () =>
      new Promise<void>((resolve) => {
        state.pendingFlush.push(resolve);
        pump(state);
      }),
    stop: () => {
      if (multiBar) {
        multiBar.stop();
      }
    },
  };
};
