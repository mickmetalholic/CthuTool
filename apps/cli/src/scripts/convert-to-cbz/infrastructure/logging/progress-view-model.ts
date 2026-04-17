export type ProgressSlot = {
  readonly slotId: number;
  readonly taskId: string | null;
  readonly displayName: string | null;
  readonly current: number;
  readonly total: number;
  readonly status: 'idle' | 'running' | 'done' | 'failed';
};

export const createProgressSlots = (
  count: number,
): ReadonlyArray<ProgressSlot> =>
  Array.from({ length: count }, (_, idx) => ({
    slotId: idx,
    taskId: null,
    displayName: null,
    current: 0,
    total: 0,
    status: 'idle' as const,
  }));

export const assignProgressSlot = (
  slots: ReadonlyArray<ProgressSlot>,
  taskId: string,
  displayName: string,
): ReadonlyArray<ProgressSlot> => {
  const target = slots.find((x) => x.taskId === null);
  if (!target) return slots;
  return slots.map((slot) =>
    slot.slotId === target.slotId
      ? {
          ...slot,
          taskId,
          displayName,
          current: 0,
          total: 0,
          status: 'running',
        }
      : slot,
  );
};

export const releaseProgressSlot = (
  slots: ReadonlyArray<ProgressSlot>,
  taskId: string,
  failed = false,
): ReadonlyArray<ProgressSlot> =>
  slots.map((slot) =>
    slot.taskId === taskId
      ? {
          ...slot,
          taskId: null,
          displayName: null,
          current: 0,
          total: 0,
          status: failed ? 'failed' : 'done',
        }
      : slot,
  );
