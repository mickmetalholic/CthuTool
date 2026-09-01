import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import {
  AGENT_LATEST_RELEASE_TAG,
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  activateVersion,
  assertArchiveBinding,
  assertCliCompatibility,
  assertSelfUseProvenance,
  readActiveVersion,
  releaseTargetFromPlatform,
  selectReleaseArtifact,
  sha256,
  smokeExtractedAgentBundle,
  stageVersion,
  validateBundleInventory,
  validateBundleLayout,
  validateReleaseManifest,
} from '@cthutool/agent-release';
import { unzipSync } from 'fflate';
import type { AgentPaths } from './agent-paths';

const REPOSITORY_RELEASES =
  'https://github.com/mickmetalholic/CthuTool/releases/download';
const LATEST_MANIFEST_URL = `${REPOSITORY_RELEASES}/${AGENT_LATEST_RELEASE_TAG}/manifest.json`;
const MAX_METADATA_BYTES = 2 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 750 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024;

export type AgentReleaseInstallerDependencies = {
  readonly fetchBytes?: (
    url: string,
    maximumBytes: number,
  ) => Promise<Uint8Array>;
  readonly manifestUrl?: string;
  readonly platform?: NodeJS.Platform;
  readonly architecture?: string;
  readonly cliVersion: string;
  readonly smoke?: typeof smokeExtractedAgentBundle;
};

export async function installAgentRelease(input: {
  readonly paths: AgentPaths;
  readonly dependencies: AgentReleaseInstallerDependencies;
}): Promise<{
  readonly version: string;
  readonly previousVersion?: string;
  readonly changed: boolean;
}> {
  const fetchBytes = input.dependencies.fetchBytes ?? fetchHttpsBytes;
  const target = releaseTargetFromPlatform(
    input.dependencies.platform ?? process.platform,
    input.dependencies.architecture ?? process.arch,
  );
  if (!target)
    throw new Error(
      'CthuTool Agent supports macOS arm64/x64 and Windows x64 only',
    );
  const manifest = await fetchSelfUseManifest(
    input.dependencies.manifestUrl ?? LATEST_MANIFEST_URL,
    fetchBytes,
  );
  assertCliCompatibility(manifest, input.dependencies.cliVersion);
  assertProtocolCompatibility(manifest);
  const artifact = selectReleaseArtifact(manifest, target);
  const archiveBytes = await fetchBytes(
    artifact.archiveUrl,
    Math.min(MAX_ARCHIVE_BYTES, artifact.archiveSize + 1),
  );
  assertArchiveBinding(artifact, archiveBytes);
  // Keep the smoke user-data path short enough for macOS Unix-domain sockets.
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'cth-agent-'));
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
        'Agent archive layout does not match the self-use manifest',
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
          userDataDir: join(temporaryRoot, 's'),
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

async function fetchSelfUseManifest(
  url: string,
  fetchBytes: (url: string, maximumBytes: number) => Promise<Uint8Array>,
): Promise<AgentReleaseManifest> {
  let bytes: Uint8Array;
  try {
    bytes = await fetchBytes(url, MAX_METADATA_BYTES);
  } catch (error) {
    throw new Error(
      `Latest Agent release is unavailable: ${
        error instanceof Error ? error.message : 'download failed'
      }`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(bytes).toString('utf8'));
  } catch {
    throw new Error('Latest Agent release manifest is not valid JSON');
  }
  const manifest = validateReleaseManifest(parsed, {
    requireSelfUseMatrix: true,
  });
  assertSelfUseProvenance(manifest);
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
    path.endsWith('/cthutool-agent-setup') ||
    path === 'bin/cthutool-agent-setup' ||
    path.endsWith('.exe')
  );
}

function assertProtocolCompatibility(manifest: AgentReleaseManifest): void {
  if (Object.values(manifest.protocols).some((version) => version !== 1))
    throw new Error(
      'Agent release protocol versions are incompatible with this CLI',
    );
}
