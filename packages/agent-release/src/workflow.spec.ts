import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const repositoryRoot = resolve(__dirname, '../../..');

describe('Agent release workflow contract', () => {
  test('uses the exact supported target matrix and pinned runtimes', async () => {
    const matrix = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'release/agent/supported-targets.json'),
        'utf8',
      ),
    ) as {
      readonly schemaVersion: number;
      readonly targets: readonly {
        readonly target: string;
        readonly runner: string;
        readonly rustTarget: string;
      }[];
    };
    expect(matrix).toEqual({
      schemaVersion: 1,
      targets: [
        {
          archiveFormat: 'zip',
          runner: 'macos-14',
          rustTarget: 'aarch64-apple-darwin',
          target: 'darwin-arm64',
        },
        {
          archiveFormat: 'zip',
          runner: 'macos-15-intel',
          rustTarget: 'x86_64-apple-darwin',
          target: 'darwin-x64',
        },
        {
          archiveFormat: 'zip',
          runner: 'windows-2025',
          rustTarget: 'x86_64-pc-windows-msvc',
          target: 'windows-x64',
        },
      ],
    });
    const action = await readFile(
      resolve(repositoryRoot, '.github/actions/build-agent-bundle/action.yml'),
      'utf8',
    );
    expect(action).toContain('node-version: "24.14.1"');
    expect(action).toContain('release/agent/node-runtime.lock.json');
    expect(action).toContain('cargo build --locked');
  });

  test('fails production closed around signing, notarization, verification, and publication', async () => {
    const action = await readFile(
      resolve(repositoryRoot, '.github/actions/build-agent-bundle/action.yml'),
      'utf8',
    );
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/agent-release.yml'),
      'utf8',
    );
    for (const requirement of [
      'codesign --verify --deep --strict',
      'notarytool submit',
      'stapler validate',
      'Get-AuthenticodeSignature',
      'signtool verify',
      'clean-host-smoke',
      'sign-blob',
    ]) {
      expect(action).toContain(requirement);
    }
    for (const requirement of [
      'environment: agent-production',
      'verify-production-set',
      'Immutable Agent release',
      'rollback-channel',
      '--clobber',
    ]) {
      expect(workflow).toContain(requirement);
    }
  });

  test('tracks every local Agent release dependency in the PR scope detector', async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/agent-release.yml'),
      'utf8',
    );
    for (const dependency of [
      '.github/actions/build-agent-bundle/',
      '.github/workflows/agent-release.yml',
      'apps/agent/',
      'apps/agent-tray/',
      'apps/cli/',
      'packages/agent-bridge-protocol/',
      'packages/agent-protocol/',
      'packages/agent-release/',
      'packages/agent-runtime/',
      'packages/browser-runtime-protocol/',
      'release/agent/',
      'pnpm-lock.yaml',
      'Cargo.lock',
    ]) {
      expect(workflow).toContain(`'${dependency}'`);
    }
  });

  test('keeps PR validation identity stable across partial reruns', async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/agent-release.yml'),
      'utf8',
    );
    const expression = (value: string) => ['$', '{{ ', value, ' }}'].join('');
    expect(workflow).toContain(
      `0.0.0-pr.${expression('github.event.pull_request.number')}.run${expression('github.run_id')}`,
    );
    expect(workflow).not.toContain('github.run_attempt');
  });
});
