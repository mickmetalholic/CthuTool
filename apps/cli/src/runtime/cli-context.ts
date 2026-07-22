import type { ArgsDef } from 'citty';

export type CliContext = {
  readonly isTty: boolean;
  readonly interactive: boolean;
  readonly json: boolean;
  readonly quiet: boolean;
};

export const cliContractArgs = {
  json: {
    type: 'boolean',
    description: 'Print one machine-readable JSON value to stdout',
  },
  noInteractive: {
    type: 'boolean',
    alias: 'no-interactive',
    description: 'Disable prompts even when stdin is a TTY',
  },
  quiet: {
    type: 'boolean',
    description: 'Suppress non-essential human status output',
  },
} satisfies ArgsDef;

export function createCliContext(
  args: {
    readonly json?: unknown;
    readonly noInteractive?: unknown;
    readonly quiet?: unknown;
  },
  deps: { readonly isTty: () => boolean } = {
    isTty: () => process.stdin.isTTY === true,
  },
): CliContext {
  const isTty = deps.isTty();
  return {
    isTty,
    interactive: isTty && args.noInteractive !== true,
    json: args.json === true,
    quiet: args.quiet === true,
  };
}
