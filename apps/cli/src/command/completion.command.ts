import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { type CommandDef, defineCommand } from 'citty';
import { getCompletionCandidates } from '../domain/completion-candidates';

type RootCommandResolver = () => CommandDef;
type CompletionProfileAction = 'enable' | 'disable' | 'status';

const emptyCompletionWord = '__cthutool_empty_completion_word__';
const powershellProfileEnv = 'CHC_COMPLETION_POWERSHELL_PROFILE';
const powershellCompletionLoadLine =
  'chc completion powershell | Out-String | Invoke-Expression';
const powershellCompletionReloadHint = `Restart PowerShell to load it, or run: ${powershellCompletionLoadLine}`;
const legacyPowerShellCompletionComment = '# CthuTool CLI completion';
const powershellCompletionStartMarker = '# >>> cthutool chc completion >>>';
const powershellCompletionEndMarker = '# <<< cthutool chc completion <<<';
const powershellCompletionBlock = `${powershellCompletionStartMarker}
${powershellCompletionLoadLine}
${powershellCompletionEndMarker}`;
const execFileAsync = promisify(execFile);

const powershellScript = `Register-ArgumentCompleter -Native -CommandName chc -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $words = @($commandAst.CommandElements | Select-Object -Skip 1 | ForEach-Object { $_.Extent.Text })
  if ($words.Count -eq 0 -or $words[-1] -ne $wordToComplete) {
    if ($wordToComplete -eq '') {
      $words += '__cthutool_empty_completion_word__'
    } else {
      $words += $wordToComplete
    }
  }
  chc __complete @words | ForEach-Object {
    $completionText = if ($_.StartsWith('-')) { $_ } else { "$_ " }
    [System.Management.Automation.CompletionResult]::new($completionText, $_, 'ParameterValue', $_)
  }
}
`;

const zshScript = String.raw`#compdef chc
_chc_completion() {
  local -a candidates
  candidates=("\${(@f)$(chc __complete "\${words[@]:1}")}")
  compadd -- "\${candidates[@]}"
}
compdef _chc_completion chc
`;

function renderShellScript(shell: string): string | undefined {
  if (shell === 'powershell') {
    return powershellScript;
  }
  if (shell === 'zsh') {
    return zshScript;
  }
  return undefined;
}

function isCompletionProfileAction(
  value: string,
): value is CompletionProfileAction {
  return value === 'enable' || value === 'disable' || value === 'status';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeManagedCompletionBlock(content: string): {
  readonly content: string;
  readonly removed: boolean;
} {
  const pattern = new RegExp(
    `${escapeRegExp(powershellCompletionStartMarker)}\\r?\\n[\\s\\S]*?\\r?\\n${escapeRegExp(powershellCompletionEndMarker)}\\r?\\n?`,
    'g',
  );
  const nextContent = content.replace(pattern, '');
  return { content: nextContent, removed: nextContent !== content };
}

function removeLegacyCompletionBlock(content: string): string {
  const legacyBlockPattern = new RegExp(
    `${escapeRegExp(legacyPowerShellCompletionComment)}\\r?\\n${escapeRegExp(powershellCompletionLoadLine)}\\r?\\n?`,
    'g',
  );
  return content.replace(legacyBlockPattern, '');
}

async function readTextIfExists(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return '';
    }
    throw error;
  }
}

async function resolvePowerShellProfilePath(): Promise<string> {
  const override = process.env[powershellProfileEnv]?.trim();
  if (override) {
    return override;
  }

  for (const executable of ['pwsh', 'powershell']) {
    try {
      const { stdout } = await execFileAsync(executable, [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '$PROFILE.CurrentUserCurrentHost',
      ]);
      const profilePath = stdout.trim();
      if (profilePath.length > 0) {
        return profilePath;
      }
    } catch {}
  }

  throw new Error(
    `unable to resolve PowerShell profile path; load completion manually with "${powershellCompletionLoadLine}"`,
  );
}

async function handlePowerShellProfileAction(
  action: CompletionProfileAction,
): Promise<void> {
  const profilePath = await resolvePowerShellProfilePath();
  const content = await readTextIfExists(profilePath);
  const installed =
    content.includes(powershellCompletionStartMarker) &&
    content.includes(powershellCompletionEndMarker);

  if (action === 'status') {
    process.stdout.write(
      `PowerShell completion ${installed ? 'enabled' : 'disabled'}: ${profilePath}\n`,
    );
    if (installed) {
      process.stdout.write(`${powershellCompletionReloadHint}\n`);
    }
    process.exitCode = 0;
    return;
  }

  if (action === 'disable') {
    const cleaned = removeManagedCompletionBlock(content);
    if (cleaned.removed) {
      await writeFile(profilePath, cleaned.content);
    }
    process.stdout.write(`PowerShell completion disabled: ${profilePath}\n`);
    process.exitCode = 0;
    return;
  }

  const cleaned = removeManagedCompletionBlock(content);
  const migratedContent = removeLegacyCompletionBlock(cleaned.content);
  const prefix =
    migratedContent.length === 0 || migratedContent.endsWith('\n')
      ? migratedContent
      : `${migratedContent}\n`;
  await mkdir(dirname(profilePath), { recursive: true });
  await writeFile(profilePath, `${prefix}${powershellCompletionBlock}\n`);
  process.stdout.write(
    `PowerShell completion ${installed ? 'already enabled' : 'enabled'}: ${profilePath}\n`,
  );
  process.stdout.write(`${powershellCompletionReloadHint}\n`);
  process.exitCode = 0;
}

export function createCompletionCommand() {
  return defineCommand({
    meta: {
      name: 'completion',
      description: 'Print or manage shell completion setup.',
    },
    args: {
      shell: {
        type: 'positional',
        description:
          'Shell to generate completion for (powershell or zsh), or action to manage persistent completion',
        required: true,
      },
    },
    async run({ args, rawArgs }) {
      const first = rawArgs[0] ?? '';
      if (isCompletionProfileAction(first)) {
        const shell = rawArgs[1] ?? '';
        if (shell !== 'powershell') {
          process.stderr.write(
            `managed persistent completion currently supports PowerShell only: ${shell || '<missing>'}\n`,
          );
          process.exitCode = 1;
          return;
        }
        try {
          await handlePowerShellProfileAction(first);
        } catch (error) {
          process.stderr.write(
            `${error instanceof Error ? error.message : String(error)}\n`,
          );
          process.exitCode = 1;
        }
        return;
      }

      const shell = typeof args.shell === 'string' ? args.shell : '';
      const script = renderShellScript(shell);
      if (!script) {
        process.stderr.write(`unsupported shell: ${shell}\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write(script);
      process.exitCode = 0;
    },
  });
}

export function createInternalCompleteCommand(
  resolveRootCommand: RootCommandResolver,
) {
  return defineCommand({
    meta: {
      name: '__complete',
      description: 'Internal shell completion protocol.',
    },
    async run({ rawArgs }) {
      try {
        const words = rawArgs.map((word) =>
          word === emptyCompletionWord ? '' : word,
        );
        const candidates = await getCompletionCandidates({
          rootCommand: resolveRootCommand(),
          words,
        });
        if (candidates.length > 0) {
          process.stdout.write(`${candidates.join('\n')}\n`);
        }
        process.exitCode = 0;
      } catch {
        process.exitCode = 0;
      }
    },
  });
}
