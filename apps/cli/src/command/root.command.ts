import { defineCommand } from 'citty';
import { agentCommand } from './agent.command';
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
import { obsidianCommand } from './obsidian.command';
import { normalizeScriptsArgs, scriptsCommand } from './run-scripts.command';
import {
  statusCommand,
  updateCommand,
  versionCommand,
} from './self-update.command';
import { sourceCommand } from './source.command';

let rootCommand: AnyCommandDef;

const rootCommandRegistrations: readonly CliCommandRegistration[] = [
  {
    name: 'agent',
    command: agentCommand,
    visibility: 'public',
    bareBehavior: 'help',
  },
  {
    name: 'codex',
    command: codexCommand,
    visibility: 'public',
    bareBehavior: 'help',
  },
  {
    name: 'obsidian',
    command: obsidianCommand,
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
    visibility: 'compat',
    bareBehavior: 'run',
  },
  {
    name: 'update',
    command: updateCommand,
    visibility: 'compat',
    bareBehavior: 'run',
  },
  {
    name: 'source',
    command: sourceCommand,
    visibility: 'public',
    bareBehavior: 'help',
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
