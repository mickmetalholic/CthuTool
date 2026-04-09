import {
  cancelledResult,
  type FlowError,
  successResult,
} from '../domain/flow-result';
import { buildGreetingMessage } from '../domain/greeting-message';
import { nextState, type RunState } from '../domain/run-state';
import { runLoadingScreen } from '../infra/loading-screen';
import { promptName } from '../infra/prompt-name';
import { defaultWelcomePanel, renderWelcomePanel } from '../ui/welcome-panel';

export type FlowDeps = {
  readonly write: (text: string) => void;
  readonly clear: () => void;
  readonly prompt: typeof promptName;
  readonly loading: typeof runLoadingScreen;
};

const defaultDeps: FlowDeps = {
  write: (text) => process.stdout.write(`${text}\n`),
  clear: () => console.clear(),
  prompt: promptName,
  loading: runLoadingScreen,
};

export const runGreetingFlow = async (
  deps: FlowDeps = defaultDeps,
): Promise<number> => {
  let state: RunState = 'welcome';
  deps.write(renderWelcomePanel(defaultWelcomePanel));
  state = nextState(state, 'prompt');

  while (true) {
    const promptResult = await deps.prompt();
    if (promptResult.isErr()) {
      if (promptResult.error.type === 'cancelled') {
        state = 'cancelled';
        cancelledResult();
        return state === 'cancelled' ? 130 : 1;
      }
      deps.write(promptResult.error.message);
      state = nextState(state, 'prompt');
      continue;
    }

    state = nextState(state, 'loading');
    deps.clear();
    try {
      await deps.loading(2000);
    } catch {
      state = nextState(state, 'cancelled');
      return 130;
    }
    state = nextState(state, 'result');
    const greeting = buildGreetingMessage(promptResult.value);
    const model = {
      panel: defaultWelcomePanel,
      message: greeting,
      status: 'success' as const,
    };
    const result = successResult(model);
    if (result.isErr()) {
      const error: FlowError = result.error;
      deps.write(error.message);
      return 1;
    }
    deps.write(renderWelcomePanel(model.panel));
    deps.write(result.value.message);
    return 0;
  }
};
