import type { ArgDef, ArgsDef, Resolvable } from 'citty';
import {
  type AnyCommandDef,
  getCommandRegistrations,
  getPositionalCandidateProvider,
} from '../command/command-discovery';

export type CompletionCandidateInput = {
  readonly rootCommand: AnyCommandDef;
  readonly words: readonly string[];
};

type CompletionState = {
  readonly command: AnyCommandDef;
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
  command: AnyCommandDef,
): Promise<Record<string, AnyCommandDef>> {
  const subCommands = await resolveValue(command.subCommands);
  if (!subCommands) {
    return {};
  }

  const entries = await Promise.all(
    Object.entries(subCommands).map(
      async ([name, value]): Promise<[string, AnyCommandDef]> => [
        name,
        (await resolveValue(value)) as AnyCommandDef,
      ],
    ),
  );
  const publicNames = new Set(
    getCommandRegistrations(command)
      ?.filter((registration) => registration.visibility === 'public')
      .map((registration) => registration.name),
  );
  return Object.fromEntries(
    publicNames.size === 0
      ? entries
      : entries.filter(([name]) => publicNames.has(name)),
  );
}

async function getArgs(command: AnyCommandDef): Promise<ArgsDef> {
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
  rootCommand: AnyCommandDef,
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
  command: AnyCommandDef,
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

  const positionalCandidates = getPositionalCandidateProvider(state.command);
  const subCommands = await getSubCommands(state.command);
  const dynamicCandidates = positionalCandidates
    ? await positionalCandidates({
        currentWord,
        completedWords,
        path: state.path,
      })
    : [];
  const staticCandidates =
    completedWords.length === state.path.length ? Object.keys(subCommands) : [];
  return filterByPrefix(
    [...staticCandidates, ...dynamicCandidates],
    currentWord,
  );
}
