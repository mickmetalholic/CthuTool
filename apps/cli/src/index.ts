import { defineCommand, runMain } from 'citty';
import { codexCommand } from './command/codex.command';
import { scriptsCommand } from './command/run-scripts.command';

const main = defineCommand({
  meta: {
    name: 'chc',
    description: 'CthuTool monorepo CLI',
  },
  subCommands: {
    codex: codexCommand,
    scripts: scriptsCommand,
  },
});

runMain(main).catch(() => {
  process.exitCode = 1;
});
