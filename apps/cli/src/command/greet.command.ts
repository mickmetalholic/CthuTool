import { defineCommand } from 'citty';
import { runGreetingFlow } from '../flow/run-greeting-flow';

export const greetCommand = defineCommand({
  meta: {
    name: 'greet',
    description: 'Run interactive greeting demo',
  },
  async run() {
    process.exitCode = await runGreetingFlow();
  },
});
