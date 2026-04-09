export type RunState =
  | 'welcome'
  | 'prompt'
  | 'loading'
  | 'result'
  | 'cancelled';

const transitions: Readonly<Record<RunState, ReadonlyArray<RunState>>> = {
  welcome: ['prompt'],
  prompt: ['prompt', 'loading'],
  loading: ['result', 'cancelled'],
  result: [],
  cancelled: [],
};

export const canTransition = (from: RunState, to: RunState): boolean =>
  transitions[from].includes(to);

export const nextState = (from: RunState, to: RunState): RunState => {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
  return to;
};
