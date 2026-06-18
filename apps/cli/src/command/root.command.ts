import { type CommandDef, defineCommand } from 'citty';
import { codexCommand } from './codex.command';
import {
  createCompletionCommand,
  createInternalCompleteCommand,
} from './completion.command';
import { scriptsCommand } from './run-scripts.command';
import { selfUpdateCommand } from './self-update.command';

let rootCommand: CommandDef;

rootCommand = defineCommand({
  meta: {
    name: 'chc',
    description: 'CthuTool monorepo CLI',
  },
  subCommands: {
    codex: codexCommand,
    'self-update': selfUpdateCommand,
    completion: createCompletionCommand(),
    __complete: createInternalCompleteCommand(() => rootCommand),
    scripts: scriptsCommand,
  },
});

export { rootCommand };
