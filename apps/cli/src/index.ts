import { type ArgsDef, type CommandDef, renderUsage, runMain } from 'citty';
import pc from 'picocolors';
import {
  type AnyCommandDef,
  getCommandHelpAppendixProvider,
  getCommandRegistration,
  getCommandRegistrations,
  normalizeRegisteredArgs,
} from './command/command-discovery';
import { rootCommand } from './command/root.command';
import { getCliVersion } from './domain/self-update-manager';

function formatUsageForStdout(
  value: string,
  hiddenCommands: ReadonlySet<string> = new Set(),
): string {
  return normalizeCommandRows(
    value.replace(/`([^`]+)`/g, '$1').replace(/[ \t]+$/gm, ''),
    hiddenCommands,
  );
}

function stripAnsi(value: string): string {
  const sgrPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
  return value.replace(sgrPattern, '');
}

function filterUsageCommandChoices(
  line: string,
  hiddenCommands: ReadonlySet<string>,
): string {
  const match =
    /^(\s*USAGE\s+\S+\s+)([A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)+)(.*)$/.exec(line);
  if (!match) {
    return line;
  }
  const [, prefix, choices, suffix] = match;
  const visibleChoices = choices
    .split('|')
    .filter((choice) => !hiddenCommands.has(choice));
  return `${prefix}${visibleChoices.join('|')}${suffix}`;
}

function normalizeCommandRows(
  value: string,
  hiddenCommands: ReadonlySet<string>,
): string {
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
    const visibleRows = pendingRows.filter(
      (row) => row.name !== '__complete' && !hiddenCommands.has(row.name),
    );
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
    const visibleLine = filterUsageCommandChoices(line, hiddenCommands);
    const plain = stripAnsi(visibleLine).trim();
    if (plain === 'COMMANDS') {
      flushRows();
      inCommands = true;
      normalized.push(visibleLine);
      continue;
    }

    const commandRow = inCommands
      ? stripAnsi(visibleLine).match(/^\s{2,}([A-Za-z0-9_-]+)\s{2,}(.+)$/)
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
    normalized.push(visibleLine);
  }

  flushRows();
  return normalized.join('\n');
}

async function showNativeUsage<T extends ArgsDef = ArgsDef>(
  command: CommandDef<T>,
  parent?: CommandDef<T>,
): Promise<void> {
  const hiddenCommands = new Set(
    getCommandRegistrations(command as AnyCommandDef)
      ?.filter((registration) => registration.visibility !== 'public')
      .map((registration) => registration.name) ?? [],
  );
  const appendix = await getCommandHelpAppendixProvider(
    command as AnyCommandDef,
  )?.();
  const rendered = formatUsageForStdout(
    await renderUsage(command, parent),
    hiddenCommands,
  );
  process.stdout.write(`${rendered}${appendix ? `\n\n${appendix}` : ''}\n`);
}

async function resolveBareTopLevelHelpCommand(
  rawArgs: readonly string[],
): Promise<CommandDef | undefined> {
  if (rawArgs.length !== 1) {
    return undefined;
  }

  const [name] = rawArgs;
  if (!name || name.startsWith('-') || name === '__complete') {
    return undefined;
  }
  const registration = getCommandRegistration(rootCommand, name);
  return registration?.bareBehavior === 'help'
    ? registration.command
    : undefined;
}

const rawArgs = normalizeRegisteredArgs(rootCommand, process.argv.slice(2));
const bareTopLevelHelpCommand = await resolveBareTopLevelHelpCommand(rawArgs);
if (rawArgs.length === 1 && rawArgs[0] === '--version') {
  process.stdout.write(`chc ${getCliVersion()}\n`);
  process.exitCode = 0;
} else if (rawArgs.length === 0) {
  await showNativeUsage(rootCommand);
  process.exitCode = 0;
} else if (bareTopLevelHelpCommand) {
  await showNativeUsage(bareTopLevelHelpCommand, rootCommand);
  process.exitCode = 0;
} else {
  await runMain(rootCommand, { rawArgs, showUsage: showNativeUsage }).catch(
    () => {
      process.exitCode = 1;
    },
  );
}
