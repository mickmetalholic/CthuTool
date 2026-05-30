import type { ArgDef, ArgsDef, CommandDef, Resolvable } from 'citty';
import { getBundledScriptsRoot } from '../infra/bundled-scripts-root';
import { discoverScripts } from '../infra/discover-scripts';
import { listSelectable } from './script-catalog';

export type CompletionCandidateInput = {
  readonly rootCommand: CommandDef;
  readonly words: readonly string[];
};

type CompletionState = {
  readonly command: CommandDef;
  readonly path: readonly string[];
};

async function resolveValue<T>(
  value: Resolvable<T> | undefined,
): Promise<T | undefined> {
  if (typeof value === 'function') {
    return await (value as () => T | Promise<T>)();
  }
  return await value;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

async function getSubCommands(
  command: CommandDef,
): Promise<Record<string, CommandDef>> {
  const subCommands = await resolveValue(command.subCommands);
  if (!subCommands) {
    return {};
  }

  const entries = await Promise.all(
    Object.entries(subCommands).map(async ([name, value]) => [
      name,
      (await resolveValue(value)) as CommandDef,
    ]),
  );
  return Object.fromEntries(entries);
}

async function getArgs(command: CommandDef): Promise<ArgsDef> {
  return (await resolveValue(command.args)) ?? {};
}

function isFlag(word: string): boolean {
  return word.startsWith('-');
}

function isCompleteFlag(word: string): boolean {
  return word.startsWith('--') && word.length > 2 && !word.includes('=');
}

function flagName(name: string, _arg: ArgDef): string {
  return `--${toKebabCase(name)}`;
}

async function traverseCommand(
  rootCommand: CommandDef,
  completedWords: readonly string[],
): Promise<CompletionState | undefined> {
  let command = rootCommand;
  const path: string[] = [];
  let skipFlagValue = false;

  for (const word of completedWords) {
    if (skipFlagValue) {
      skipFlagValue = false;
      continue;
    }
    if (isFlag(word)) {
      const args = await getArgs(command);
      const arg = Object.entries(args).find(
        ([name]) => flagName(name, args[name]) === word,
      )?.[1];
      skipFlagValue = arg?.type === 'string';
      continue;
    }

    const subCommands = await getSubCommands(command);
    const next = subCommands[word];
    if (!next) {
      return { command, path };
    }
    command = next;
    path.push(word);
  }

  return { command, path };
}

function filterByPrefix(
  candidates: readonly string[],
  prefix: string,
): string[] {
  return [...new Set(candidates)]
    .filter((candidate) => candidate.startsWith(prefix))
    .sort((a, b) => a.localeCompare(b));
}

async function getFlagCandidates(
  command: CommandDef,
  completedWords: readonly string[],
  prefix: string,
): Promise<string[]> {
  const args = await getArgs(command);
  const used = new Set(completedWords.filter(isCompleteFlag));
  const candidates = Object.entries(args)
    .filter(([, arg]) => arg.type !== 'positional')
    .map(([name, arg]) => flagName(name, arg))
    .filter((candidate) => !used.has(candidate));
  return filterByPrefix(candidates, prefix);
}

async function getScriptCandidates(prefix: string): Promise<string[]> {
  const discovered = await discoverScripts(getBundledScriptsRoot());
  if (discovered.isErr()) {
    return [];
  }
  return filterByPrefix(
    listSelectable(discovered.value).map((row) => row.id),
    prefix,
  );
}

function shouldCompleteScriptId(
  path: readonly string[],
  completedWords: readonly string[],
): boolean {
  if (path.join(' ') !== 'scripts') {
    return false;
  }
  const hasScriptFlag = completedWords.at(-1) === '--script';
  const hasExplicitId = completedWords.some((word, index) => {
    if (index === 0 || isFlag(word)) {
      return false;
    }
    const previous = completedWords[index - 1];
    return previous !== '--script';
  });
  return hasScriptFlag || !hasExplicitId;
}

function shouldCompleteShellName(
  path: readonly string[],
  completedWords: readonly string[],
): boolean {
  return path.join(' ') === 'completion' && completedWords.length === 1;
}

export async function getCompletionCandidates({
  rootCommand,
  words,
}: CompletionCandidateInput): Promise<string[]> {
  const currentWord = words.at(-1) ?? '';
  const completedWords = words.slice(0, -1);
  const state = await traverseCommand(rootCommand, completedWords);
  if (!state) {
    return [];
  }

  if (currentWord.startsWith('-')) {
    return getFlagCandidates(state.command, completedWords, currentWord);
  }

  if (shouldCompleteScriptId(state.path, completedWords)) {
    return getScriptCandidates(currentWord);
  }

  if (shouldCompleteShellName(state.path, completedWords)) {
    return filterByPrefix(['powershell', 'zsh'], currentWord);
  }

  const subCommands = await getSubCommands(state.command);
  return filterByPrefix(
    Object.keys(subCommands).filter((candidate) => candidate !== '__complete'),
    currentWord,
  );
}
