#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { archiveBundleDirectory, assembleAgentBundle } from './assembly';
import {
  type AgentReleaseTarget,
  canonicalJson,
  signManifest,
  signReleaseBlob,
  validateEnvironmentCatalog,
  validateReleaseManifest,
} from './contracts';
import { validateBundleInventory } from './layout';
import { preparePinnedNodeRuntime } from './node-runtime';
import {
  createArtifactReceipt,
  createChannelPointer,
  createReleaseManifest,
  verifyProductionReleaseSet,
} from './publication';
import { smokeExtractedAgentBundle } from './smoke';

async function main(argv: readonly string[]): Promise<void> {
  const command = argv[0];
  const flags = parseFlags(argv.slice(1));
  if (command === 'validate-catalog') {
    validateEnvironmentCatalog(await readJson(required(flags, 'input')));
    return;
  }
  if (command === 'validate-manifest') {
    validateReleaseManifest(await readJson(required(flags, 'input')), {
      requireProductionMatrix: flags.has('production'),
    });
    return;
  }
  if (command === 'validate-inventory') {
    validateBundleInventory(
      releaseTarget(required(flags, 'target')),
      await listFiles(required(flags, 'bundle-root')),
    );
    return;
  }
  if (command === 'assemble') {
    const result = await assembleAgentBundle({
      deployedAgentDir: required(flags, 'agent-dir'),
      environmentCatalogPath: required(flags, 'catalog'),
      nodeExecutablePath: required(flags, 'node'),
      nodeLicensePath: required(flags, 'node-license'),
      outputDir: required(flags, 'output-dir'),
      pullRequestMarker: flags.get('pull-request-marker'),
      releaseVersion: required(flags, 'version'),
      stageDir: flags.get('stage-dir'),
      target: releaseTarget(required(flags, 'target')),
      thirdPartyNoticesPath: required(flags, 'notices'),
      trayExecutablePath: required(flags, 'tray'),
    });
    process.stdout.write(canonicalJson(result));
    return;
  }
  if (command === 'prepare-node') {
    const result = await preparePinnedNodeRuntime({
      lockPath: required(flags, 'lock'),
      outputDir: required(flags, 'output-dir'),
      target: releaseTarget(required(flags, 'target')),
    });
    process.stdout.write(canonicalJson(result));
    return;
  }
  if (command === 'archive-stage') {
    const result = await archiveBundleDirectory({
      outputDir: required(flags, 'output-dir'),
      pullRequestMarker: flags.get('pull-request-marker'),
      releaseVersion: required(flags, 'version'),
      stageDir: required(flags, 'stage-dir'),
      target: releaseTarget(required(flags, 'target')),
    });
    process.stdout.write(canonicalJson(result));
    return;
  }
  if (command === 'smoke') {
    const result = await smokeExtractedAgentBundle({
      bundleRoot: required(flags, 'bundle-root'),
      timeoutMs: flags.has('timeout-ms')
        ? Number(required(flags, 'timeout-ms'))
        : undefined,
      userDataDir: required(flags, 'user-data-dir'),
    });
    process.stdout.write(canonicalJson(result));
    return;
  }
  if (command === 'receipt') {
    const receipt = await createArtifactReceipt({
      archivePath: required(flags, 'archive'),
      bundleRoot: required(flags, 'bundle-root'),
      cleanHostSmoke: flags.has('clean-host-smoke'),
      immutableBaseUrl: required(flags, 'base-url'),
      notarizationStapled: flags.has('notarization-stapled'),
      platformSigned: flags.has('platform-signed'),
      provenance: provenance(required(flags, 'provenance')),
      releaseVersion: required(flags, 'version'),
      target: releaseTarget(required(flags, 'target')),
    });
    await writeJson(required(flags, 'output'), receipt);
    return;
  }
  if (command === 'manifest') {
    const receipts = await Promise.all(
      required(flags, 'receipts').split(',').filter(Boolean).map(readJson),
    );
    const manifest = createReleaseManifest({
      catalogBytes: await readFile(required(flags, 'catalog')),
      minimumCliVersion: required(flags, 'minimum-cli-version'),
      provenance: provenance(required(flags, 'provenance')),
      receipts,
      releaseVersion: required(flags, 'version'),
    });
    await writeJson(required(flags, 'output'), manifest);
    return;
  }
  if (command === 'sign-manifest') {
    const manifest = validateReleaseManifest(
      await readJson(required(flags, 'input')),
      { requireProductionMatrix: true },
    );
    await writeSignature(
      required(flags, 'output'),
      signManifest(
        manifest,
        requiredEnvironment('AGENT_RELEASE_PRIVATE_KEY_PEM'),
      ),
    );
    return;
  }
  if (command === 'sign-blob') {
    await writeSignature(
      required(flags, 'output'),
      signReleaseBlob(
        await readFile(required(flags, 'input')),
        requiredEnvironment('AGENT_RELEASE_PRIVATE_KEY_PEM'),
      ),
    );
    return;
  }
  if (command === 'verify-production-set') {
    await verifyProductionReleaseSet({
      archivesDir: required(flags, 'archives-dir'),
      catalogPath: required(flags, 'catalog'),
      manifestPath: required(flags, 'manifest'),
      manifestSignaturePath: required(flags, 'manifest-signature'),
      publicKeyPem: requiredEnvironment('AGENT_RELEASE_PUBLIC_KEY_PEM'),
    });
    return;
  }
  if (command === 'channel-pointer') {
    const manifest = validateReleaseManifest(
      await readJson(required(flags, 'manifest')),
      { requireProductionMatrix: true },
    );
    const pointer = createChannelPointer({
      channel: channel(required(flags, 'channel')),
      manifest,
      manifestUrl: required(flags, 'manifest-url'),
    });
    await writeJson(required(flags, 'output'), pointer);
    return;
  }
  throw new Error(`Unknown Agent release command: ${command ?? '<missing>'}`);
}

function parseFlags(argv: readonly string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw?.startsWith('--')) {
      throw new Error(`Unexpected argument: ${raw ?? '<missing>'}`);
    }
    const key = raw.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags.set(key, 'true');
    } else {
      flags.set(key, next);
      index += 1;
    }
  }
  return flags;
}

function required(flags: ReadonlyMap<string, string>, name: string): string {
  const value = flags.get(name);
  if (!value) {
    throw new Error(`Missing --${name}`);
  }
  return value;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Protected release environment is missing ${name}`);
  }
  return value;
}

function releaseTarget(value: string): AgentReleaseTarget {
  if (
    value !== 'darwin-arm64' &&
    value !== 'darwin-x64' &&
    value !== 'windows-x64'
  ) {
    throw new Error(`Unsupported Agent release target: ${value}`);
  }
  return value;
}

function provenance(value: string): 'production' | 'pull-request-validation' {
  if (value !== 'production' && value !== 'pull-request-validation') {
    throw new Error(`Invalid release provenance: ${value}`);
  }
  return value;
}

function channel(value: string): 'stable' | 'beta' {
  if (value !== 'stable' && value !== 'beta') {
    throw new Error(`Invalid Agent release channel: ${value}`);
  }
  return value;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, canonicalJson(value), { mode: 0o644 });
}

async function writeSignature(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${value}\n`, { mode: 0o600 });
}

async function listFiles(root: string, directory = root): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listFiles(root, path)));
    } else if (entry.isFile()) {
      output.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    }
  }
  return output;
}

void main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Agent release command failed'}\n`,
  );
  process.exitCode = 1;
});
