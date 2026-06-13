import { type CommandDef, defineCommand } from 'citty';
import { getCompletionCandidates } from '../domain/completion-candidates';

type RootCommandResolver = () => CommandDef;

const emptyCompletionWord = '__cthutool_empty_completion_word__';

const powershellScript = String.raw`Register-ArgumentCompleter -Native -CommandName chc -ScriptBlock {
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

export function createCompletionCommand() {
  return defineCommand({
    meta: {
      name: 'completion',
      description: 'Print shell completion setup scripts.',
    },
    args: {
      shell: {
        type: 'positional',
        description: 'Shell to generate completion for (powershell or zsh)',
        required: true,
      },
    },
    run({ args }) {
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
