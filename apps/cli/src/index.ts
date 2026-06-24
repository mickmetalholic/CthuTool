import {
  type ArgsDef,
  type CommandDef,
  type Resolvable,
  renderUsage,
  runMain,
} from 'citty';
import pc from 'picocolors';
import { rootCommand } from './command/root.command';
import { getCliVersion } from './domain/self-update-manager';

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
    const visibleRows = pendingRows.filter((row) => row.name !== '__complete');
    if (visibleRows.length === 0) {
      pendingRows = [];
      return;
    }
    const width = Math.max(...visibleRows.map((row) => row.name.length));
    for (const row of visibleRows) {
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

async function resolveValue<T>(
  value: Resolvable<T> | undefined,
): Promise<T | undefined> {
  if (typeof value === 'function') {
    return await (value as () => T | Promise<T>)();
  }
  return await value;
}

async function resolveOmittedTopLevelCommand(
  rawArgs: readonly string[],
): Promise<CommandDef | undefined> {
  if (rawArgs.length !== 1) {
    return undefined;
  }

  const [name] = rawArgs;
  if (!name || name.startsWith('-') || name === '__complete') {
    return undefined;
  }
  if (!new Set(['codex', 'scripts', 'completion']).has(name)) {
    return undefined;
  }

  const subCommands = await resolveValue(rootCommand.subCommands);
  return await resolveValue(subCommands?.[name]);
}

const rawArgs = process.argv.slice(2);
const omittedTopLevelCommand = await resolveOmittedTopLevelCommand(rawArgs);
if (rawArgs.length === 1 && rawArgs[0] === '--version') {
  process.stdout.write(`chc ${getCliVersion()}\n`);
  process.exitCode = 0;
} else if (rawArgs.length === 0) {
  await showNativeUsage(rootCommand);
  process.exitCode = 0;
} else if (omittedTopLevelCommand) {
  await showNativeUsage(omittedTopLevelCommand, rootCommand);
  process.exitCode = 0;
} else {
  await runMain(rootCommand, { showUsage: showNativeUsage }).catch(() => {
    process.exitCode = 1;
  });
}
