import { isCancel, log, text } from '@clack/prompts';
import { err, ok, type Result } from 'neverthrow';
import { validateName } from '../domain/name-schema';

export type PromptCancelled = { readonly type: 'cancelled' };
export type PromptInvalid = {
  readonly type: 'invalid';
  readonly message: string;
};

export const promptName = async (): Promise<
  Result<string, PromptCancelled | PromptInvalid>
> => {
  while (true) {
    const input = await text({ message: 'Please enter your name' });
    if (isCancel(input)) {
      return err({ type: 'cancelled' });
    }
    const validated = validateName(String(input ?? ''));
    if (validated.isErr()) {
      log.error(validated.error.message);
      continue;
    }
    return ok(validated.value);
  }
};
