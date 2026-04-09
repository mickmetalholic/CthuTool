import { err, ok, type Result } from 'neverthrow';
import type { WelcomePanelModel } from '../ui/welcome-panel';

export type GreetingViewModel = {
  readonly panel: WelcomePanelModel;
  readonly message: string;
  readonly status: 'success' | 'cancelled';
};

export type FlowError = { readonly message: string };

export const successResult = (
  model: GreetingViewModel,
): Result<GreetingViewModel, FlowError> => ok(model);

export const cancelledResult = (): Result<GreetingViewModel, FlowError> =>
  err({ message: 'cancelled' });
