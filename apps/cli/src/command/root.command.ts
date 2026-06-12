import { type CommandDef, defineCommand } from 'citty';
import { browserCommand } from './browser.command';
import { codexCommand } from './codex.command';
import {
  createCompletionCommand,
  createInternalCompleteCommand,
} from './completion.command';
import { scriptsCommand } from './run-scripts.command';

let rootCommand: CommandDef;

rootCommand = defineCommand({
  meta: {
    name: 'chc',
    description: 'CthuTool monorepo CLI',
  },
  subCommands: {
    browser: browserCommand,
    codex: codexCommand,
    scripts: scriptsCommand,
    completion: createCompletionCommand(),
    __complete: createInternalCompleteCommand(() => rootCommand),
  },
});

export { rootCommand };
