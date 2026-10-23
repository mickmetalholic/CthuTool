import { expect, test } from 'bun:test';
import {
  createDotfilesRenderer,
  type DotfilesResults,
} from '../../src/command/dotfiles-output';
import type { CliContext } from '../../src/runtime/cli-context';

const ESC = String.fromCharCode(27);
function harness(
  command: keyof DotfilesResults,
  options: {
    tty?: boolean;
    color?: boolean;
    json?: boolean;
    quiet?: boolean;
  } = {},
) {
  let stdout = '';
  let stderr = '';
  const context: CliContext = {
    isTty: false,
    interactive: false,
    json: false,
    quiet: false,
    ...options,
  };
  const renderer = createDotfilesRenderer(context, command, {
    output: {
      stdout: {
        write: (chunk) => {
          stdout += chunk;
        },
      },
      stderr: {
        write: (chunk) => {
          stderr += chunk;
        },
      },
    },
    isOutputTty: () => options.tty ?? false,
    isColorSupported: () => options.color ?? false,
  });
  return { renderer, stdout: () => stdout, stderr: () => stderr };
}
const snapshot: DotfilesResults['notion validate'] = {
  source: '/checkout/CthuTool',
  valid: true,
  hosts: ['darwin-macbook-pro'],
  modelVersion: 1,
  alignmentReviewed: false,
};

test('human rendering never contaminates JSON/quiet channels, including progress and native diff', () => {
  for (const options of [{ json: true }, { quiet: true }]) {
    const h = harness('notion validate', {
      tty: true,
      color: true,
      ...options,
    });
    h.renderer.start();
    h.renderer.progress({
      type: 'environment',
      os: 'linux',
      arch: 'arm64',
      wsl: true,
      node: 'v24.18.0',
    });
    h.renderer.progress({
      type: 'tool_install',
      tool: 'chezmoi',
      installer: 'Homebrew',
    });
    h.renderer.result('notion validate', snapshot);
    h.renderer.result('config diff', { output: 'native diff\n' });
    expect(h.stdout()).toBe('');
    expect(h.stderr()).toBe('');
  }
});

test('colors require a supported output TTY and external text cannot inject terminal escapes', () => {
  for (const tty of [false, true])
    for (const color of [false, true]) {
      const h = harness('notion validate', { tty, color });
      h.renderer.result('notion validate', snapshot);
      expect(h.stdout().includes(ESC)).toBe(tty && color);
    }
  const h = harness('notion validate');
  h.renderer.result('notion validate', {
    ...snapshot,
    source: `${ESC}[2J${snapshot.source}${ESC}]52;c;data\u0007`,
  });
  expect(h.stdout()).toContain(snapshot.source);
  expect(h.stdout()).not.toContain(ESC);
  expect(h.stdout()).not.toContain('52;c;data');
});

test('configuration differences pass through intact and apply summaries account for skipped files', () => {
  const diff =
    'diff --git a/.zshrc b/.zshrc\n--- a/.zshrc\n+++ b/.zshrc\n@@ -1 +1 @@\n-old\n+new\n';
  const h = harness('config diff');
  h.renderer.result('config diff', { output: diff });
  expect(h.stdout()).toContain(diff);
  const applied = harness('config apply');
  applied.renderer.result('config apply', {
    completed: true,
    interactive: true,
    source: snapshot.source,
    host: snapshot.hosts[0],
    next: 'mise install',
  });
  expect(applied.stdout()).toContain('skipped files');
  expect(applied.stdout()).toContain('chc dotfiles config diff');
});

test('doctor does not label optional failures or an unbound host as fully ready', () => {
  const h = harness('env doctor');
  h.renderer.result('env doctor', {
    source: snapshot.source,
    host: null,
    bindingIssue: 'Run chc dotfiles init',
    gitIdentity: {},
    prerequisites: [{ command: 'git', available: true }],
    results: [
      {
        id: 'optional-tool',
        classification: 'package',
        severity: 'optional',
        checks: [
          {
            type: 'command',
            status: 'missing',
            detail: 'optional-tool --version',
          },
        ],
        guidance: undefined,
      },
    ],
    blockingFailures: 0,
  });
  expect(h.stdout()).toContain('Run chc dotfiles init');
  expect(h.stdout()).toContain('missing · optional');
  expect(h.stdout()).toContain('review items above');
  expect(h.stdout()).not.toContain('All checked software is ready');
});

test('Notion comparisons retain before/after contents and surface the publication gate', () => {
  const result: DotfilesResults['notion diff'] = {
    source: snapshot.source,
    generation: 1,
    alignmentReviewed: false,
    published: false,
    hasChanges: true,
    changes: [
      {
        path: 'dotfiles/data/hosts.yaml',
        before: 'shell: bash\n',
        after: 'shell: zsh\n',
      },
    ],
    retired: ['software:old-tool'],
  };
  const h = harness('notion diff');
  h.renderer.result('notion diff', result);
  for (const text of [
    'shell: bash',
    'shell: zsh',
    'software:old-tool',
    '--allow-retire',
    'docs/dotfiles/reconciliation.md',
  ])
    expect(h.stdout()).toContain(text);
  const published = harness('notion pull');
  published.renderer.result('notion pull', {
    ...result,
    published: true,
    alignmentReviewed: true,
  });
  expect(published.stdout()).toContain('git diff -- dotfiles/data');
});
