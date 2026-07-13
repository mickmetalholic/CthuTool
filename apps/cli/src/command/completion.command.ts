import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { type CommandDef, defineCommand } from 'citty';
import { getCompletionCandidates } from '../domain/completion-candidates';
import { createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';

type RootCommandResolver = () => CommandDef;
type CompletionProfileAction = 'enable' | 'disable' | 'status';

const emptyCompletionWord = '__cthutool_empty_completion_word__';
const powershellProfileEnv = 'CHC_COMPLETION_POWERSHELL_PROFILE';
const zshProfileEnv = 'CHC_COMPLETION_ZSH_PROFILE';
const powershellCompletionLoadLine =
  'chc completion powershell | Out-String | Invoke-Expression';
const powershellCompletionReloadHint = `Restart PowerShell to load it, or run: ${powershellCompletionLoadLine}`;
const legacyPowerShellCompletionComment = '# CthuTool CLI completion';
const completionStartMarker = '# >>> cthutool chc completion >>>';
const completionEndMarker = '# <<< cthutool chc completion <<<';
const powershellCompletionBlock = `${completionStartMarker}
${powershellCompletionLoadLine}
${completionEndMarker}`;
const zshCompletionLoadLine = 'source <(chc completion zsh)';
const zshCompletionBlock = `${completionStartMarker}
if (( ! $+functions[compdef] )); then
  autoload -Uz compinit
  compinit
fi
${zshCompletionLoadLine}
${completionEndMarker}`;
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

const zshScript = `#compdef chc
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
    `${escapeRegExp(completionStartMarker)}\\r?\\n[\\s\\S]*?\\r?\\n${escapeRegExp(completionEndMarker)}\\r?\\n?`,
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

function removeLegacyZshCompletionLine(content: string): string {
  const legacyLinePattern = new RegExp(
    `^${escapeRegExp(zshCompletionLoadLine)}\\r?\\n?`,
    'gm',
  );
  return content.replace(legacyLinePattern, '');
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

  if (platform() === 'win32') {
    return join(
      process.env.USERPROFILE || homedir(),
      'Documents',
      'PowerShell',
      'Microsoft.PowerShell_profile.ps1',
    );
  }

  return join(
    homedir(),
    '.config',
    'powershell',
    'Microsoft.PowerShell_profile.ps1',
  );
}

function resolveZshProfilePath(): string {
  const override = process.env[zshProfileEnv]?.trim();
  if (override) {
    return override;
  }

  const zdotdir = process.env.ZDOTDIR?.trim();
  return join(zdotdir || homedir(), '.zshrc');
}

async function handlePowerShellProfileAction(
  action: CompletionProfileAction,
): Promise<void> {
  const profilePath = await resolvePowerShellProfilePath();
  const content = await readTextIfExists(profilePath);
  const installed =
    content.includes(completionStartMarker) &&
    content.includes(completionEndMarker);

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

async function handleZshProfileAction(
  action: CompletionProfileAction,
): Promise<void> {
  const profilePath = resolveZshProfilePath();
  const content = await readTextIfExists(profilePath);
  const installed =
    content.includes(completionStartMarker) &&
    content.includes(completionEndMarker);
  const reloadHint = `Restart zsh to load it, or run: source ${profilePath}`;

  if (action === 'status') {
    process.stdout.write(
      `zsh completion ${installed ? 'enabled' : 'disabled'}: ${profilePath}\n`,
    );
    if (installed) {
      process.stdout.write(`${reloadHint}\n`);
    }
    process.exitCode = 0;
    return;
  }

  if (action === 'disable') {
    const cleaned = removeManagedCompletionBlock(content);
    if (cleaned.removed) {
      await writeFile(profilePath, cleaned.content);
    }
    process.stdout.write(`zsh completion disabled: ${profilePath}\n`);
    process.exitCode = 0;
    return;
  }

  const cleaned = removeManagedCompletionBlock(content);
  const migratedContent = removeLegacyZshCompletionLine(cleaned.content);
  const prefix =
    migratedContent.length === 0 || migratedContent.endsWith('\n')
      ? migratedContent
      : `${migratedContent}\n`;
  await mkdir(dirname(profilePath), { recursive: true });
  await writeFile(profilePath, `${prefix}${zshCompletionBlock}\n`);
  process.stdout.write(
    `zsh completion ${installed ? 'already enabled' : 'enabled'}: ${profilePath}\n`,
  );
  process.stdout.write(`${reloadHint}\n`);
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
      await runObservedCliCommand(
        args,
        { command: 'completion' },
        async ({ fail }) => {
          const first = rawArgs[0] ?? '';
          if (isCompletionProfileAction(first)) {
            const shell = rawArgs[1] ?? '';
            if (shell !== 'powershell' && shell !== 'zsh') {
              const error = createCliError(
                'invalid_option',
                `unsupported managed completion shell: ${shell || '<missing>'}`,
              );
              fail(error, { details: { action: first, shell } });
              process.stderr.write(`${error.message}\n`);
              process.exitCode = error.exitCode;
              return;
            }
            try {
              if (shell === 'powershell') {
                await handlePowerShellProfileAction(first);
              } else {
                await handleZshProfileAction(first);
              }
            } catch (error) {
              const cliError = createCliError(
                'invalid_option',
                error instanceof Error ? error.message : String(error),
              );
              fail(cliError, { details: { action: first, shell } });
              process.stderr.write(`${cliError.message}\n`);
              process.exitCode = cliError.exitCode;
            }
            return;
          }

          const shell = typeof args.shell === 'string' ? args.shell : '';
          const script = renderShellScript(shell);
          if (!script) {
            const error = createCliError(
              'invalid_option',
              `unsupported shell: ${shell}`,
            );
            fail(error, { details: { shell } });
            process.stderr.write(`${error.message}\n`);
            process.exitCode = error.exitCode;
            return;
          }
          process.stdout.write(script);
          process.exitCode = 0;
        },
      );
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
