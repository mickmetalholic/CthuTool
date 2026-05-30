import {
  type ArgsDef,
  type CommandDef,
  defineCommand,
  renderUsage,
  runMain,
} from 'citty';
import pc from 'picocolors';
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

function formatUsageForStdout(value: string): string {
  return normalizeCommandRows(
    value.replace(/`([^`]+)`/g, '$1').replace(/[ \t]+$/gm, ''),
  );
}

function stripAnsi(value: string): string {
  const sgrPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
  return value.replace(sgrPattern, '');
}

function normalizeCommandRows(value: string): string {
  const lines = value.split('\n');
  const normalized: string[] = [];
  let inCommands = false;
  let pendingRows: Array<{
    readonly name: string;
    readonly description: string;
  }> = [];

  const flushRows = () => {
    if (pendingRows.length === 0) {
      return;
    }
    const width = Math.max(...pendingRows.map((row) => row.name.length));
    for (const row of pendingRows) {
      normalized.push(
        `  ${pc.bold(pc.cyan(row.name.padEnd(width + 2)))}${row.description}`,
      );
    }
    pendingRows = [];
  };

  for (const line of lines) {
    const plain = stripAnsi(line).trim();
    if (plain === 'COMMANDS') {
      flushRows();
      inCommands = true;
      normalized.push(line);
      continue;
    }

    const commandRow = inCommands
      ? stripAnsi(line).match(/^\s{2,}([A-Za-z0-9_-]+)\s{2,}(.+)$/)
      : null;
    if (commandRow) {
      pendingRows.push({
        name: commandRow[1],
        description: commandRow[2],
      });
      continue;
    }

    flushRows();
    if (inCommands && plain.length > 0) {
      inCommands = false;
    }
    normalized.push(line);
  }

  flushRows();
  return normalized.join('\n');
}

async function showNativeUsage<T extends ArgsDef = ArgsDef>(
  command: CommandDef<T>,
  parent?: CommandDef<T>,
): Promise<void> {
  process.stdout.write(
    `${formatUsageForStdout(await renderUsage(command, parent))}\n`,
  );
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) {
  await showNativeUsage(main);
  process.exitCode = 0;
} else if (rawArgs.length === 1 && rawArgs[0] === 'codex') {
  await showNativeUsage(codexCommand, main);
  process.exitCode = 0;
} else {
  runMain(main, { showUsage: showNativeUsage }).catch(() => {
    process.exitCode = 1;
  });
}
