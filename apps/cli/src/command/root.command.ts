import { defineCommand } from 'citty';
import { codexCommand } from './codex.command';
import {
  type AnyCommandDef,
  buildRegisteredSubCommands,
  type CliCommandRegistration,
  registerCommandGroup,
} from './command-discovery';
import {
  createCompletionCommand,
  createInternalCompleteCommand,
} from './completion.command';
import { opencodeCommand } from './opencode.command';
import { normalizeScriptsArgs, scriptsCommand } from './run-scripts.command';
import {
  statusCommand,
  updateCommand,
  versionCommand,
} from './self-update.command';

let rootCommand: AnyCommandDef;

const rootCommandRegistrations: readonly CliCommandRegistration[] = [
  {
    name: 'codex',
    command: codexCommand,
    visibility: 'public',
    bareBehavior: 'help',
  },
  {
    name: 'opencode',
    command: opencodeCommand,
    visibility: 'public',
    bareBehavior: 'help',
  },
  {
    name: 'version',
    command: versionCommand,
    visibility: 'compat',
    bareBehavior: 'run',
  },
  {
    name: 'status',
    command: statusCommand,
    visibility: 'public',
    bareBehavior: 'run',
  },
  {
    name: 'update',
    command: updateCommand,
    visibility: 'public',
    bareBehavior: 'run',
  },
  {
    name: 'completion',
    command: createCompletionCommand(),
    visibility: 'public',
    bareBehavior: 'help',
  },
  {
    name: '__complete',
    command: createInternalCompleteCommand(() => rootCommand),
    visibility: 'internal',
    bareBehavior: 'run',
  },
  {
    name: 'scripts',
    command: scriptsCommand,
    visibility: 'public',
    bareBehavior: 'help',
    normalizeArgs: normalizeScriptsArgs,
  },
];

rootCommand = registerCommandGroup(
  defineCommand({
    meta: {
      name: 'chc',
      description: 'CthuTool monorepo CLI',
    },
    subCommands: buildRegisteredSubCommands(rootCommandRegistrations),
  }),
  rootCommandRegistrations,
);

export { rootCommand, rootCommandRegistrations };
