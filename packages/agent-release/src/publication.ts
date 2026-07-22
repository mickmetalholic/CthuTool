import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
  AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
  type AgentReleaseArtifact,
  type AgentReleaseChannelPointer,
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  assertArchiveBinding,
  assertCatalogBinding,
  canonicalJson,
  SUPPORTED_AGENT_TARGETS,
  sha256,
  validateEnvironmentCatalog,
  validateReleaseManifest,
  verifyManifestSignature,
  verifyReleaseBlobSignature,
} from './contracts';
import { validateBundleInventory, validateBundleLayout } from './layout';

export type AgentArtifactReceipt = {
  readonly schemaVersion: 1;
  readonly releaseVersion: string;
  readonly provenance: 'production' | 'pull-request-validation';
  readonly artifact: AgentReleaseArtifact;
  readonly validation: {
    readonly cleanHostSmoke: boolean;
    readonly platformSigned: boolean;
    readonly notarizationStapled: boolean;
  };
};

export async function createArtifactReceipt(input: {
  readonly target: AgentReleaseTarget;
  readonly releaseVersion: string;
  readonly archivePath: string;
  readonly bundleRoot: string;
  readonly immutableBaseUrl: string;
  readonly provenance: AgentArtifactReceipt['provenance'];
  readonly cleanHostSmoke: boolean;
  readonly platformSigned: boolean;
  readonly notarizationStapled: boolean;
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
  const baseUrl = requireImmutableBaseUrl(
    input.immutableBaseUrl,
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
      archiveSignatureUrl: `${archiveUrl}.sig`,
      trayEntryPoint: layout.entryPoints.tray,
      nodeEntryPoint: layout.entryPoints.node,
      agentEntryPoint: layout.entryPoints.agent,
      platformSignature: {
        required: true,
        notarizationRequired: !windows,
      },
    },
    validation: {
      cleanHostSmoke: input.cleanHostSmoke,
      platformSigned: input.platformSigned,
      notarizationStapled: input.notarizationStapled,
    },
  };
  validateReceipt(receipt);
  return receipt;
}

export function createReleaseManifest(input: {
  readonly releaseVersion: string;
  readonly minimumCliVersion: string;
  readonly catalogBytes: Uint8Array;
  readonly receipts: readonly unknown[];
  readonly provenance: AgentArtifactReceipt['provenance'];
}): AgentReleaseManifest {
  const catalog = validateEnvironmentCatalog(
    JSON.parse(Buffer.from(input.catalogBytes).toString('utf8')),
  );
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
    input.provenance === 'production' &&
    receipts.some(
      (receipt) =>
        !receipt.validation.cleanHostSmoke ||
        !receipt.validation.platformSigned ||
        (receipt.artifact.platform === 'darwin' &&
          !receipt.validation.notarizationStapled),
    )
  ) {
    throw new Error(
      'Production artifacts require clean-host smoke, platform signing, and macOS stapling',
    );
  }
  const receiptByTarget = new Map(
    receipts.map((receipt) => [receipt.artifact.target, receipt]),
  );
  if (
    input.provenance === 'production' &&
    !SUPPORTED_AGENT_TARGETS.every((target) => receiptByTarget.has(target))
  ) {
    throw new Error('Production release is missing a supported target');
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
    environmentCatalog: {
      schemaVersion: catalog.schemaVersion,
      sha256: sha256(input.catalogBytes),
    },
    provenance: {
      kind: input.provenance,
      signed: input.provenance === 'production',
    },
    artifacts: SUPPORTED_AGENT_TARGETS.flatMap((target) => {
      const receipt = receiptByTarget.get(target);
      return receipt ? [receipt.artifact] : [];
    }),
  };
  return validateReleaseManifest(manifest, {
    requireProductionMatrix: input.provenance === 'production',
  });
}

export function createChannelPointer(input: {
  readonly channel: 'stable' | 'beta';
  readonly manifest: AgentReleaseManifest;
  readonly manifestUrl: string;
}): AgentReleaseChannelPointer {
  if (input.manifest.provenance.kind !== 'production') {
    throw new Error('A channel cannot point to a pull-request manifest');
  }
  const url = new URL(input.manifestUrl);
  if (
    url.protocol !== 'https:' ||
    !url.pathname.includes(`/${input.manifest.releaseVersion}/`)
  ) {
    throw new Error('Channel target must be an immutable HTTPS manifest URL');
  }
  return {
    schemaVersion: 1,
    channel: input.channel,
    releaseVersion: input.manifest.releaseVersion,
    manifestUrl: url.href,
    manifestSha256: sha256(canonicalJson(input.manifest)),
  };
}

export async function verifyProductionReleaseSet(input: {
  readonly manifestPath: string;
  readonly manifestSignaturePath: string;
  readonly publicKeyPem: string;
  readonly catalogPath: string;
  readonly archivesDir: string;
}): Promise<AgentReleaseManifest> {
  const manifest = validateReleaseManifest(
    JSON.parse(await readFile(input.manifestPath, 'utf8')),
    { requireProductionMatrix: true },
  );
  if (manifest.provenance.kind !== 'production') {
    throw new Error('Production verification requires a production manifest');
  }
  verifyManifestSignature(
    manifest,
    (await readFile(input.manifestSignaturePath, 'utf8')).trim(),
    input.publicKeyPem,
  );
  assertCatalogBinding(manifest, await readFile(input.catalogPath));
  for (const artifact of manifest.artifacts) {
    const archivePath = join(
      input.archivesDir,
      basename(new URL(artifact.archiveUrl).pathname),
    );
    const archiveBytes = await readFile(archivePath);
    assertArchiveBinding(artifact, archiveBytes);
    verifyReleaseBlobSignature(
      archiveBytes,
      (await readFile(`${archivePath}.sig`, 'utf8')).trim(),
      input.publicKeyPem,
    );
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
    (receipt.provenance !== 'production' &&
      receipt.provenance !== 'pull-request-validation') ||
    !receipt.artifact ||
    !receipt.validation ||
    typeof receipt.validation.cleanHostSmoke !== 'boolean' ||
    typeof receipt.validation.platformSigned !== 'boolean' ||
    typeof receipt.validation.notarizationStapled !== 'boolean'
  ) {
    throw new Error('Artifact receipt contract is invalid');
  }
  const validationManifest = validateReleaseManifest(
    {
      schemaVersion: 1,
      releaseVersion: receipt.releaseVersion,
      minimumCliVersion: '0.0.0',
      layoutVersion: 1,
      protocols: {
        agentBackend: 1,
        agentControl: 1,
        localBridge: 1,
        trayControl: 1,
      },
      environmentCatalog: {
        schemaVersion: AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
        sha256: '0'.repeat(64),
      },
      provenance: {
        kind: receipt.provenance,
        signed: receipt.provenance === 'production',
      },
      artifacts: [receipt.artifact],
    },
    { requireProductionMatrix: false },
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

function requireImmutableBaseUrl(value: string, version: string): URL {
  const url = new URL(value.endsWith('/') ? value : `${value}/`);
  if (
    url.protocol !== 'https:' ||
    !url.pathname.includes(`/${version}/`) ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Artifact base URL must be immutable, versioned, and HTTPS',
    );
  }
  return url;
}
