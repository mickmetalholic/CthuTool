import { defineCommand, runMain } from 'citty';
import { greetCommand } from './command/greet.command';
import { scriptsCommand } from './command/run-scripts.command';

const main = defineCommand({
  meta: {
    name: 'cthutool-cli',
    description: 'CthuTool monorepo CLI (greet demo and bundled scripts)',
  },
  subCommands: {
    greet: greetCommand,
    scripts: scriptsCommand,
  },
});

runMain(main).catch(() => {
  process.exitCode = 1;
});
