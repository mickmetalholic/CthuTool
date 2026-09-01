import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const scriptPath = join(root, 'scripts', 'ensure-ai-tooling.mjs');

type CommandResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

type BootstrapModule = {
  readonly AiToolingBootstrapError: new (
    code: string,
    message: string,
  ) => Error & { readonly code: string };
  readonly ensureAiTooling: (options: {
    readonly cwd?: string;
    readonly runner: (
      command: string,
      args: readonly string[],
      options: { readonly cwd: string },
    ) => Promise<CommandResult>;
    readonly logger?: Pick<Console, 'log'>;
    readonly postCheckout?: boolean;
  }) => Promise<{ readonly status: 'valid' | 'repaired' }>;
};

const success: CommandResult = { code: 0, stdout: '', stderr: '' };
const failure = (stderr: string): CommandResult => ({
  code: 1,
  stdout: '',
  stderr,
});

async function loadModule(): Promise<BootstrapModule> {
  return (await import(pathToFileURL(scriptPath).href)) as BootstrapModule;
}

function sequenceRunner(
  results: readonly CommandResult[],
  calls: string[][],
) {
  return async (_command: string, args: readonly string[]) => {
    calls.push([...args]);
    const result = results[calls.length - 1];
    if (!result) throw new Error('Unexpected bootstrap command.');
    return result;
  };
}

describe('AI tooling bootstrap', () => {
  it('returns a no-op when the read-only check already passes', async () => {
    const { ensureAiTooling } = await loadModule();
    const calls: string[][] = [];

    await expect(
      ensureAiTooling({
        runner: sequenceRunner([success], calls),
        logger: { log: () => undefined },
      }),
    ).resolves.toEqual({ status: 'valid' });
    expect(calls.map((args) => args.slice(1))).toEqual([['--check']]);
  });

  it('repairs generated-state drift and verifies the result', async () => {
    const { ensureAiTooling } = await loadModule();
    const calls: string[][] = [];

    await expect(
      ensureAiTooling({
        runner: sequenceRunner(
          [failure('missing adapter'), success, success, success],
          calls,
        ),
        logger: { log: () => undefined },
      }),
    ).resolves.toEqual({ status: 'repaired' });
    expect(calls.map((args) => args.slice(1))).toEqual([
      ['--check'],
      ['--check-prerequisites'],
      [],
      ['--check'],
    ]);
  });

  it('reports prerequisite failures without attempting setup', async () => {
    const { ensureAiTooling } = await loadModule();
    const calls: string[][] = [];

    await expect(
      ensureAiTooling({
        runner: sequenceRunner(
          [failure('missing adapter'), failure('openspec not found')],
          calls,
        ),
        logger: { log: () => undefined },
        postCheckout: true,
      }),
    ).rejects.toMatchObject({
      code: 'prerequisite_failed',
      message: expect.stringMatching(
        /OpenSpec prerequisite.*Checkout files already exist.*pnpm setup:ai-tooling/s,
      ),
    });
    expect(calls).toHaveLength(2);
  });

  it('keeps setup and post-repair verification failures distinct', async () => {
    const { ensureAiTooling } = await loadModule();

    await expect(
      ensureAiTooling({
        runner: sequenceRunner(
          [failure('drift'), success, failure('setup exploded')],
          [],
        ),
        logger: { log: () => undefined },
      }),
    ).rejects.toMatchObject({
      code: 'setup_failed',
      message: expect.stringContaining('setup exploded'),
    });

    await expect(
      ensureAiTooling({
        runner: sequenceRunner(
          [failure('drift'), success, success, failure('still stale')],
          [],
        ),
        logger: { log: () => undefined },
      }),
    ).rejects.toMatchObject({
      code: 'verification_failed',
      message: expect.stringContaining('still stale'),
    });
  });
});
