import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  AGENT_LATEST_RELEASE_TAG,
  AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
  type AgentReleaseArtifact,
  type AgentReleaseManifest,
  type AgentReleaseProvenanceKind,
  type AgentReleaseTarget,
  assertArchiveBinding,
  SUPPORTED_AGENT_TARGETS,
  sha256,
  validateReleaseManifest,
} from './contracts';
import { validateBundleInventory, validateBundleLayout } from './layout';

export type AgentArtifactReceipt = {
  readonly schemaVersion: 1;
  readonly releaseVersion: string;
  readonly provenance: AgentReleaseProvenanceKind;
  readonly artifact: AgentReleaseArtifact;
  readonly validation: {
    readonly cleanHostSmoke: boolean;
    readonly platformSigned: false;
    readonly notarizationStapled: false;
  };
};

export async function createArtifactReceipt(input: {
  readonly target: AgentReleaseTarget;
  readonly releaseVersion: string;
  readonly archivePath: string;
  readonly bundleRoot: string;
  readonly artifactBaseUrl: string;
  readonly provenance: AgentArtifactReceipt['provenance'];
  readonly cleanHostSmoke: boolean;
}): Promise<AgentArtifactReceipt> {
  const layout = validateBundleLayout(
    JSON.parse(await readFile(join(input.bundleRoot, 'layout.json'), 'utf8')),
  );
  if (
    layout.target !== input.target ||
    layout.releaseVersion !== input.releaseVersion
  ) {
    throw new Error('Artifact receipt does not match the staged bundle layout');
  }
  validateBundleInventory(input.target, await listFiles(input.bundleRoot));
  const archiveBytes = await readFile(input.archivePath);
  const archiveName = basename(input.archivePath);
  const expectedPrefix = `cthutool-agent-${input.releaseVersion}-${input.target}`;
  if (
    !archiveName.startsWith(expectedPrefix) ||
    !archiveName.endsWith('.zip')
  ) {
    throw new Error('Agent archive name does not match its version and target');
  }
  if (
    input.provenance === 'pull-request-validation' &&
    !archiveName.includes('-unsigned-pr-')
  ) {
    throw new Error('Pull-request archives must include an unsigned marker');
  }
  if (
    input.provenance === 'self-use' &&
    archiveName.includes('-unsigned-pr-')
  ) {
    throw new Error('Self-use archives must not include a pull-request marker');
  }
  const baseUrl = requireArtifactBaseUrl(
    input.artifactBaseUrl,
    input.provenance,
    input.releaseVersion,
  );
  const archiveUrl = new URL(archiveName, baseUrl).href;
  const windows = input.target === 'windows-x64';
  const receipt: AgentArtifactReceipt = {
    schemaVersion: 1,
    releaseVersion: input.releaseVersion,
    provenance: input.provenance,
    artifact: {
      target: input.target,
      platform: windows ? 'windows' : 'darwin',
      architecture: input.target.endsWith('arm64') ? 'arm64' : 'x64',
      archiveUrl,
      archiveSize: archiveBytes.byteLength,
      archiveSha256: sha256(archiveBytes),
      trayEntryPoint: layout.entryPoints.tray,
      setupEntryPoint: layout.entryPoints.setup,
      nodeEntryPoint: layout.entryPoints.node,
      agentEntryPoint: layout.entryPoints.agent,
    },
    validation: {
      cleanHostSmoke: input.cleanHostSmoke,
      platformSigned: false,
      notarizationStapled: false,
    },
  };
  validateReceipt(receipt);
  return receipt;
}

export function createReleaseManifest(input: {
  readonly releaseVersion: string;
  readonly minimumCliVersion: string;
  readonly receipts: readonly unknown[];
  readonly provenance: AgentArtifactReceipt['provenance'];
}): AgentReleaseManifest {
  const receipts = input.receipts.map(validateReceipt);
  if (
    new Set(receipts.map((receipt) => receipt.artifact.target)).size !==
    receipts.length
  ) {
    throw new Error('Artifact receipts contain duplicate targets');
  }
  if (
    receipts.some(
      (receipt) =>
        receipt.releaseVersion !== input.releaseVersion ||
        receipt.provenance !== input.provenance,
    )
  ) {
    throw new Error('Artifact receipts have mixed versions or provenance');
  }
  if (
    receipts.some(
      (receipt) =>
        receipt.validation.platformSigned ||
        receipt.validation.notarizationStapled,
    )
  ) {
    throw new Error(
      'Self-use and pull-request receipts must not claim platform signing or notarization',
    );
  }
  if (
    input.provenance === 'self-use' &&
    receipts.some((receipt) => !receipt.validation.cleanHostSmoke)
  ) {
    throw new Error('Self-use artifacts require clean-host smoke validation');
  }
  const receiptByTarget = new Map(
    receipts.map((receipt) => [receipt.artifact.target, receipt]),
  );
  if (
    input.provenance === 'self-use' &&
    !SUPPORTED_AGENT_TARGETS.every((target) => receiptByTarget.has(target))
  ) {
    throw new Error('Self-use release is missing a supported target');
  }
  const manifest: AgentReleaseManifest = {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion: input.releaseVersion,
    minimumCliVersion: input.minimumCliVersion,
    layoutVersion: 1,
    protocols: {
      agentBackend: 1,
      agentControl: 1,
      localBridge: 1,
      trayControl: 1,
    },
    provenance: {
      kind: input.provenance,
      signed: false,
    },
    artifacts: SUPPORTED_AGENT_TARGETS.flatMap((target) => {
      const receipt = receiptByTarget.get(target);
      return receipt ? [receipt.artifact] : [];
    }),
  };
  return validateReleaseManifest(manifest, {
    requireSelfUseMatrix: input.provenance === 'self-use',
  });
}

export async function verifySelfUseReleaseSet(input: {
  readonly manifestPath: string;
  readonly archivesDir: string;
}): Promise<AgentReleaseManifest> {
  const manifest = validateReleaseManifest(
    JSON.parse(await readFile(input.manifestPath, 'utf8')),
    { requireSelfUseMatrix: true },
  );
  if (manifest.provenance.kind !== 'self-use' || manifest.provenance.signed) {
    throw new Error(
      'Self-use verification requires an unsigned self-use manifest',
    );
  }
  for (const artifact of manifest.artifacts) {
    const archivePath = join(
      input.archivesDir,
      basename(new URL(artifact.archiveUrl).pathname),
    );
    const archiveBytes = await readFile(archivePath);
    assertArchiveBinding(artifact, archiveBytes);
  }
  return manifest;
}

export function validateReceipt(input: unknown): AgentArtifactReceipt {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Artifact receipt must be an object');
  }
  const receipt = input as Partial<AgentArtifactReceipt>;
  if (
    receipt.schemaVersion !== 1 ||
    typeof receipt.releaseVersion !== 'string' ||
    (receipt.provenance !== 'self-use' &&
      receipt.provenance !== 'pull-request-validation') ||
    !receipt.artifact ||
    !receipt.validation ||
    typeof receipt.validation.cleanHostSmoke !== 'boolean' ||
    receipt.validation.platformSigned !== false ||
    receipt.validation.notarizationStapled !== false
  ) {
    throw new Error('Artifact receipt contract is invalid');
  }
  const validationManifest = validateReleaseManifest(
    {
      schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
      releaseVersion: receipt.releaseVersion,
      minimumCliVersion: '0.0.0',
      layoutVersion: 1,
      protocols: {
        agentBackend: 1,
        agentControl: 1,
        localBridge: 1,
        trayControl: 1,
      },
      provenance: {
        kind: receipt.provenance,
        signed: false,
      },
      artifacts: [receipt.artifact],
    },
    { requireSelfUseMatrix: false },
  );
  return {
    schemaVersion: 1,
    releaseVersion: receipt.releaseVersion,
    provenance: receipt.provenance,
    artifact: validationManifest.artifacts[0],
    validation: receipt.validation,
  };
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

function requireArtifactBaseUrl(
  value: string,
  provenance: AgentReleaseProvenanceKind,
  version: string,
): URL {
  const url = new URL(value.endsWith('/') ? value : `${value}/`);
  if (url.protocol !== 'https:' || url.search || url.hash) {
    throw new Error(
      'Artifact base URL must be HTTPS without query or fragment',
    );
  }
  if (provenance === 'self-use') {
    if (!url.pathname.includes(`/${AGENT_LATEST_RELEASE_TAG}/`)) {
      throw new Error(
        `Self-use artifact base URL must publish under ${AGENT_LATEST_RELEASE_TAG}`,
      );
    }
    return url;
  }
  if (!url.pathname.includes(`/${version}/`)) {
    throw new Error(
      'Pull-request artifact base URL must be versioned and HTTPS',
    );
  }
  return url;
}
