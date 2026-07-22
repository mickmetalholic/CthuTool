import {
  chmod,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import {
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  activateVersion,
  assertArchiveBinding,
  assertCatalogBinding,
  assertCliCompatibility,
  canonicalJson,
  readActiveVersion,
  releaseTargetFromPlatform,
  selectReleaseArtifact,
  sha256,
  smokeExtractedAgentBundle,
  stageVersion,
  validateBundleInventory,
  validateBundleLayout,
  validateChannelPointer,
  validateReleaseManifest,
  verifyManifestSignature,
  verifyReleaseBlobSignature,
} from '@cthutool/agent-release';
import { unzipSync } from 'fflate';
import type { AgentPaths } from './agent-paths';

const REPOSITORY_RELEASES =
  'https://github.com/mickmetalholic/CthuTool/releases/download';
const MAX_METADATA_BYTES = 2 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 750 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024;
declare const process: NodeJS.Process & {
  env: NodeJS.ProcessEnv & {
    CTHUTOOL_PINNED_AGENT_RELEASE_PUBLIC_KEY_PEM?: string;
  };
};

export type AgentReleaseInstallerDependencies = {
  readonly fetchBytes?: (
    url: string,
    maximumBytes: number,
  ) => Promise<Uint8Array>;
  readonly publicKeyPem?: string;
  readonly platform?: NodeJS.Platform;
  readonly architecture?: string;
  readonly cliVersion: string;
  readonly smoke?: typeof smokeExtractedAgentBundle;
};

export async function installAgentRelease(input: {
  readonly paths: AgentPaths;
  readonly channel?: 'stable' | 'beta';
  readonly version?: string;
  readonly dependencies: AgentReleaseInstallerDependencies;
}): Promise<{
  readonly version: string;
  readonly previousVersion?: string;
  readonly changed: boolean;
}> {
  const fetchBytes = input.dependencies.fetchBytes ?? fetchHttpsBytes;
  const key =
    input.dependencies.publicKeyPem ??
    process.env.CTHUTOOL_PINNED_AGENT_RELEASE_PUBLIC_KEY_PEM;
  if (!key?.trim())
    throw new Error(
      'Agent release verification is unavailable because the CLI has no pinned public key',
    );
  const target = releaseTargetFromPlatform(
    input.dependencies.platform ?? process.platform,
    input.dependencies.architecture ?? process.arch,
  );
  if (!target)
    throw new Error(
      'CthuTool Agent supports macOS arm64/x64 and Windows x64 only',
    );
  const manifest = input.version
    ? await fetchVerifiedManifest(
        `${REPOSITORY_RELEASES}/agent-v${assertVersion(input.version)}/manifest.json`,
        key,
        fetchBytes,
      )
    : await resolveChannel(input.channel ?? 'stable', key, fetchBytes);
  assertCliCompatibility(manifest, input.dependencies.cliVersion);
  assertProtocolCompatibility(manifest);
  const artifact = selectReleaseArtifact(manifest, target);
  const catalogUrl = new URL(
    'environments.json',
    manifestUrlFor(manifest, artifact),
  ).href;
  const [catalogBytes, archiveBytes, archiveSignatureBytes] = await Promise.all(
    [
      fetchBytes(catalogUrl, MAX_METADATA_BYTES),
      fetchBytes(
        artifact.archiveUrl,
        Math.min(MAX_ARCHIVE_BYTES, artifact.archiveSize + 1),
      ),
      fetchBytes(artifact.archiveSignatureUrl, MAX_METADATA_BYTES),
    ],
  );
  assertCatalogBinding(manifest, catalogBytes);
  assertArchiveBinding(artifact, archiveBytes);
  verifyReleaseBlobSignature(
    archiveBytes,
    Buffer.from(archiveSignatureBytes).toString('utf8').trim(),
    key,
  );
  const temporaryRoot = join(
    tmpdir(),
    `cthutool-agent-install-${crypto.randomUUID()}`,
  );
  const extractedRoot = join(temporaryRoot, 'bundle');
  const previous = await readActiveVersion(input.paths.installRoot);
  const versionRoot = join(
    input.paths.installRoot,
    'versions',
    manifest.releaseVersion,
  );
  const versionExisted = await pathExists(versionRoot);
  try {
    await extractVerifiedArchive(archiveBytes, extractedRoot, target);
    const layout = validateBundleLayout(
      JSON.parse(await readFile(join(extractedRoot, 'layout.json'), 'utf8')),
    );
    if (
      layout.releaseVersion !== manifest.releaseVersion ||
      layout.target !== target
    )
      throw new Error(
        'Agent archive layout does not match the signed manifest',
      );
    const embeddedCatalog = await readFile(
      join(extractedRoot, ...layout.entryPoints.environmentCatalog.split('/')),
    );
    if (sha256(embeddedCatalog) !== sha256(catalogBytes))
      throw new Error(
        'Embedded Agent catalog does not match the signed catalog',
      );
    if (versionExisted) {
      await assertDirectoriesMatch(extractedRoot, versionRoot);
    }
    await stageVersion({
      installRoot: input.paths.installRoot,
      extractedRoot,
      target,
      version: manifest.releaseVersion,
    });
    await activateVersion({
      installRoot: input.paths.installRoot,
      version: manifest.releaseVersion,
      smokeCheck: async (root) => {
        await (input.dependencies.smoke ?? smokeExtractedAgentBundle)({
          bundleRoot: root,
          userDataDir: join(temporaryRoot, 'smoke-data'),
        });
      },
    });
    return {
      version: manifest.releaseVersion,
      previousVersion: previous?.version,
      changed: previous?.version !== manifest.releaseVersion,
    };
  } catch (error) {
    if (!versionExisted) {
      await rm(versionRoot, { force: true, recursive: true });
    }
    throw error;
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function resolveChannel(
  channel: 'stable' | 'beta',
  key: string,
  fetchBytes: (url: string, maximumBytes: number) => Promise<Uint8Array>,
): Promise<AgentReleaseManifest> {
  const pointerUrl = `${REPOSITORY_RELEASES}/agent-${channel}/channel-${channel}.json`;
  const [bytes, signature] = await Promise.all([
    fetchBytes(pointerUrl, MAX_METADATA_BYTES),
    fetchBytes(`${pointerUrl}.sig`, MAX_METADATA_BYTES),
  ]);
  verifyReleaseBlobSignature(
    bytes,
    Buffer.from(signature).toString('utf8').trim(),
    key,
  );
  const pointer = validateChannelPointer(
    JSON.parse(Buffer.from(bytes).toString('utf8')),
  );
  const manifestBytes = await fetchBytes(
    pointer.manifestUrl,
    MAX_METADATA_BYTES,
  );
  if (sha256(manifestBytes) !== pointer.manifestSha256)
    throw new Error('Channel manifest digest mismatch');
  return fetchVerifiedManifest(
    pointer.manifestUrl,
    key,
    fetchBytes,
    manifestBytes,
  );
}

async function fetchVerifiedManifest(
  url: string,
  key: string,
  fetchBytes: (url: string, maximumBytes: number) => Promise<Uint8Array>,
  supplied?: Uint8Array,
): Promise<AgentReleaseManifest> {
  const [bytes, signature] = await Promise.all([
    supplied ?? fetchBytes(url, MAX_METADATA_BYTES),
    fetchBytes(`${url}.sig`, MAX_METADATA_BYTES),
  ]);
  const manifest = validateReleaseManifest(
    JSON.parse(Buffer.from(bytes).toString('utf8')),
    { requireProductionMatrix: true },
  );
  if (
    manifest.provenance.kind !== 'production' ||
    !manifest.provenance.signed ||
    canonicalJson(manifest) !== Buffer.from(bytes).toString('utf8')
  )
    throw new Error(
      'Agent release manifest is not canonical production metadata',
    );
  verifyManifestSignature(
    manifest,
    Buffer.from(signature).toString('utf8').trim(),
    key,
  );
  return manifest;
}

async function fetchHttpsBytes(
  url: string,
  maximumBytes: number,
): Promise<Uint8Array> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:')
    throw new Error('Agent release downloads require HTTPS');
  const response = await fetch(parsed, {
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
  });
  if (new URL(response.url).protocol !== 'https:') {
    throw new Error('Agent release redirect must remain on HTTPS');
  }
  if (!response.ok)
    throw new Error(
      `Agent release download failed with HTTP ${response.status}`,
    );
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maximumBytes)
    throw new Error('Agent release download exceeds the size limit');
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    received += item.value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      throw new Error('Agent release download exceeds the size limit');
    }
    chunks.push(item.value);
  }
  return Buffer.concat(chunks, received);
}

async function extractVerifiedArchive(
  bytes: Uint8Array,
  destination: string,
  target: AgentReleaseTarget,
): Promise<void> {
  let declaredExtractedBytes = 0;
  const archive = unzipSync(bytes, {
    filter: (file) => {
      declaredExtractedBytes += file.originalSize;
      if (declaredExtractedBytes > MAX_EXTRACTED_BYTES) {
        throw new Error('Agent archive exceeds the extracted size limit');
      }
      return true;
    },
  });
  const paths = Object.keys(archive).filter((path) => !path.endsWith('/'));
  validateBundleInventory(target, paths);
  let extractedBytes = 0;
  await mkdir(destination, { mode: 0o700, recursive: true });
  for (const rawPath of paths) {
    const fileBytes = archive[rawPath];
    if (!fileBytes)
      throw new Error(`Agent archive entry is unreadable: ${rawPath}`);
    extractedBytes += fileBytes.byteLength;
    if (extractedBytes > MAX_EXTRACTED_BYTES)
      throw new Error('Agent archive exceeds the extracted size limit');
    const path = resolve(destination, rawPath.replaceAll('\\', '/'));
    if (path !== destination && !path.startsWith(`${destination}${sep}`))
      throw new Error(`Unsafe Agent archive path: ${rawPath}`);
    await mkdir(join(path, '..'), { mode: 0o700, recursive: true });
    await writeFile(path, fileBytes, {
      mode: executableArchivePath(rawPath) ? 0o755 : 0o644,
      flag: 'wx',
    });
    if (process.platform !== 'win32' && executableArchivePath(rawPath))
      await chmod(path, 0o755);
  }
}

async function assertDirectoriesMatch(
  expectedRoot: string,
  actualRoot: string,
): Promise<void> {
  const [expected, actual] = await Promise.all([
    directoryFingerprint(expectedRoot),
    directoryFingerprint(actualRoot),
  ]);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(
      'Installed Agent version content differs from the verified release archive',
    );
  }
}

async function directoryFingerprint(
  root: string,
  directory = root,
): Promise<readonly string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await directoryFingerprint(root, path)));
    } else if (entry.isFile()) {
      const relative = path.slice(root.length + 1).replaceAll('\\', '/');
      output.push(`${relative}:${sha256(await readFile(path))}`);
    } else {
      throw new Error(
        `Agent version contains unsupported entry: ${entry.name}`,
      );
    }
  }
  return output.sort();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function executableArchivePath(path: string): boolean {
  return (
    path === 'runtime/node/bin/node' ||
    path.endsWith('/cthutool-agent-tray') ||
    path.endsWith('.exe')
  );
}

function assertProtocolCompatibility(manifest: AgentReleaseManifest): void {
  if (Object.values(manifest.protocols).some((version) => version !== 1))
    throw new Error(
      'Agent release protocol versions are incompatible with this CLI',
    );
}

function assertVersion(version: string): string {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    throw new Error('Agent release version is invalid');
  return version;
}

function manifestUrlFor(
  _manifest: AgentReleaseManifest,
  artifact: { readonly archiveUrl: string },
): URL {
  return new URL('.', artifact.archiveUrl);
}
