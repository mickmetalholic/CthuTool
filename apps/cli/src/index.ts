import { defineCommand, runMain } from 'citty';
import { greetCommand } from './command/greet.command';

void 0;

const main = defineCommand({
  meta: {
    name: 'cthutool-cli',
    description: 'CLI greeting demo',
  },
  subCommands: {
    greet: greetCommand,
  },
  async run() {
    await greetCommand.run?.({} as never);
  },
});

runMain(main).catch(() => {
  process.exitCode = 1;
});
