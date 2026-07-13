import type { CommandDef } from 'citty';

// biome-ignore lint/suspicious/noExplicitAny: Citty's CommandDef is invariant in its argument schema; the registry intentionally stores heterogeneous commands.
export type AnyCommandDef = CommandDef<any>;

export type CommandVisibility = 'public' | 'compat' | 'internal';
export type BareCommandBehavior = 'help' | 'run';

export type CliCommandRegistration = {
  readonly name: string;
  readonly command: AnyCommandDef;
  readonly visibility: CommandVisibility;
  readonly bareBehavior: BareCommandBehavior;
  readonly normalizeArgs?: (args: readonly string[]) => readonly string[];
};

export type CandidateProviderContext = {
  readonly currentWord: string;
  readonly completedWords: readonly string[];
  readonly path: readonly string[];
};

export type PositionalCandidateProvider = (
  context: CandidateProviderContext,
) => Promise<readonly string[]> | readonly string[];

export type CommandHelpAppendixProvider = () =>
  | Promise<string | undefined>
  | string
  | undefined;

const registrationsByCommand = new WeakMap<
  AnyCommandDef,
  readonly CliCommandRegistration[]
>();
const positionalCandidatesByCommand = new WeakMap<
  AnyCommandDef,
  PositionalCandidateProvider
>();
const helpAppendixByCommand = new WeakMap<
  AnyCommandDef,
  CommandHelpAppendixProvider
>();

export function buildRegisteredSubCommands(
  registrations: readonly CliCommandRegistration[],
): Record<string, AnyCommandDef> {
  return Object.fromEntries(
    registrations.map((registration) => [
      registration.name,
      registration.command,
    ]),
  );
}

export function registerCommandGroup<T extends AnyCommandDef>(
  command: T,
  registrations: readonly CliCommandRegistration[],
): T {
  registrationsByCommand.set(command, registrations);
  return command;
}

export function getCommandRegistrations(
  command: AnyCommandDef,
): readonly CliCommandRegistration[] | undefined {
  return registrationsByCommand.get(command);
}

export function getCommandRegistration(
  command: AnyCommandDef,
  name: string,
): CliCommandRegistration | undefined {
  return getCommandRegistrations(command)?.find(
    (registration) => registration.name === name,
  );
}

export function normalizeRegisteredArgs(
  rootCommand: AnyCommandDef,
  rawArgs: readonly string[],
): string[] {
  const [name, ...commandArgs] = rawArgs;
  if (!name) {
    return [...rawArgs];
  }
  const registration = getCommandRegistration(rootCommand, name);
  if (!registration?.normalizeArgs) {
    return [...rawArgs];
  }
  return [name, ...registration.normalizeArgs(commandArgs)];
}

export function registerPositionalCandidates<T extends AnyCommandDef>(
  command: T,
  provider: PositionalCandidateProvider,
): T {
  positionalCandidatesByCommand.set(command, provider);
  return command;
}

export function getPositionalCandidateProvider(
  command: AnyCommandDef,
): PositionalCandidateProvider | undefined {
  return positionalCandidatesByCommand.get(command);
}

export function registerCommandHelpAppendix<T extends AnyCommandDef>(
  command: T,
  provider: CommandHelpAppendixProvider,
): T {
  helpAppendixByCommand.set(command, provider);
  return command;
}

export function getCommandHelpAppendixProvider(
  command: AnyCommandDef,
): CommandHelpAppendixProvider | undefined {
  return helpAppendixByCommand.get(command);
}
