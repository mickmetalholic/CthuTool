import { createHash } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { type Zippable, zipSync } from 'fflate';
import { type AgentReleaseTarget, canonicalJson } from './contracts';
import {
  createBundleLayout,
  normalizeArchivePath,
  validateBundleInventory,
} from './layout';

const REPRODUCIBLE_TIMESTAMP = new Date('1980-01-01T00:00:00.000Z');

export type AssembleAgentBundleInput = {
  readonly target: AgentReleaseTarget;
  readonly releaseVersion: string;
  readonly trayExecutablePath: string;
  readonly setupExecutablePath: string;
  readonly nodeExecutablePath: string;
  readonly nodeLicensePath: string;
  readonly deployedAgentDir: string;
  readonly thirdPartyNoticesPath: string;
  readonly slintLicensePath: string;
  readonly outputDir: string;
  readonly pullRequestMarker?: string;
  readonly stageDir?: string;
};

export type AssembledAgentBundle = {
  readonly archivePath: string;
  readonly archiveName: string;
  readonly archiveSize: number;
  readonly archiveSha256: string;
  readonly inventory: readonly string[];
};

export async function assembleAgentBundle(
  input: AssembleAgentBundleInput,
): Promise<AssembledAgentBundle> {
  const layout = createBundleLayout(input.target, input.releaseVersion);
  const files = new Map<
    string,
    { readonly bytes: Uint8Array; readonly mode: number }
  >();
  files.set('layout.json', {
    bytes: Buffer.from(canonicalJson(layout)),
    mode: 0o644,
  });
  files.set(layout.entryPoints.tray, {
    bytes: await readFile(input.trayExecutablePath),
    mode: 0o755,
  });
  files.set(layout.entryPoints.setup, {
    bytes: await readFile(input.setupExecutablePath),
    mode: 0o755,
  });
  files.set(layout.entryPoints.node, {
    bytes: await readFile(input.nodeExecutablePath),
    mode: 0o755,
  });
  files.set('licenses/NODE_LICENSE', {
    bytes: await readFile(input.nodeLicensePath),
    mode: 0o644,
  });
  files.set('licenses/THIRD_PARTY_NOTICES.txt', {
    bytes: await readFile(input.thirdPartyNoticesPath),
    mode: 0o644,
  });
  files.set('licenses/LICENSE-SLINT.md', {
    bytes: await readFile(input.slintLicensePath),
    mode: 0o644,
  });
  files.set('agent/package.json', {
    bytes: await readFile(join(input.deployedAgentDir, 'package.json')),
    mode: 0o644,
  });
  await collectDirectoryFiles(
    join(input.deployedAgentDir, 'dist'),
    'agent/dist',
    files,
    { exclude: new Set() },
  );
  await collectDirectoryFiles(
    join(input.deployedAgentDir, 'node_modules'),
    'agent/node_modules',
    files,
    {
      exclude: new Set([
        'agent/node_modules/.modules.yaml',
        'agent/node_modules/.pnpm',
      ]),
    },
  );
  await collectDirectoryFiles(
    join(input.deployedAgentDir, 'node_modules/.pnpm/node_modules'),
    'agent/node_modules',
    files,
    {
      exclude: new Set(['agent/node_modules/@cthutool/agent']),
      trustedRoot: join(input.deployedAgentDir, 'node_modules'),
    },
  );
  if (input.target.startsWith('darwin-')) {
    files.set('bin/CthuTool Agent.app/Contents/Info.plist', {
      bytes: Buffer.from(macInfoPlist(input.releaseVersion)),
      mode: 0o644,
    });
  }
  validateBundleInventory(input.target, [...files.keys()]);
  if (input.stageDir) {
    await materializeBundle(files, input.stageDir);
    return archiveBundleDirectory({
      outputDir: input.outputDir,
      pullRequestMarker: input.pullRequestMarker,
      releaseVersion: input.releaseVersion,
      stageDir: input.stageDir,
      target: input.target,
    });
  }
  return archiveBundleFiles(files, {
    outputDir: input.outputDir,
    pullRequestMarker: input.pullRequestMarker,
    releaseVersion: input.releaseVersion,
    target: input.target,
  });
}

export async function archiveBundleDirectory(input: {
  readonly stageDir: string;
  readonly target: AgentReleaseTarget;
  readonly releaseVersion: string;
  readonly outputDir: string;
  readonly pullRequestMarker?: string;
}): Promise<AssembledAgentBundle> {
  const files = new Map<
    string,
    { readonly bytes: Uint8Array; readonly mode: number }
  >();
  await collectDirectoryFiles(input.stageDir, '', files, {
    exclude: new Set(),
  });
  return archiveBundleFiles(files, input);
}

async function archiveBundleFiles(
  files: ReadonlyMap<
    string,
    { readonly bytes: Uint8Array; readonly mode: number }
  >,
  input: {
    readonly target: AgentReleaseTarget;
    readonly releaseVersion: string;
    readonly outputDir: string;
    readonly pullRequestMarker?: string;
  },
): Promise<AssembledAgentBundle> {
  const inventory = validateBundleInventory(input.target, [...files.keys()]);
  const zipInput: Zippable = {};
  for (const path of inventory) {
    const file = files.get(path);
    if (!file) {
      throw new Error(`Bundle assembly lost inventory entry ${path}`);
    }
    zipInput[path] = [
      file.bytes,
      {
        attrs: file.mode << 16,
        mtime: REPRODUCIBLE_TIMESTAMP,
        os: 3,
      },
    ];
  }
  const archiveBytes = zipSync(zipInput, {
    level: 9,
    mtime: REPRODUCIBLE_TIMESTAMP,
  });
  await mkdir(input.outputDir, { recursive: true });
  const marker = input.pullRequestMarker
    ? `-unsigned-pr-${sanitizeMarker(input.pullRequestMarker)}`
    : '';
  const archiveName = `cthutool-agent-${input.releaseVersion}-${input.target}${marker}.zip`;
  const archivePath = join(input.outputDir, archiveName);
  await writeFile(archivePath, archiveBytes);
  await chmod(archivePath, 0o644);
  return {
    archivePath,
    archiveName,
    archiveSize: archiveBytes.byteLength,
    archiveSha256: createHash('sha256').update(archiveBytes).digest('hex'),
    inventory,
  };
}

async function materializeBundle(
  files: ReadonlyMap<
    string,
    { readonly bytes: Uint8Array; readonly mode: number }
  >,
  stageDir: string,
): Promise<void> {
  await mkdir(stageDir, { recursive: true });
  if ((await readdir(stageDir)).length > 0) {
    throw new Error(
      `Agent bundle staging directory must be empty: ${stageDir}`,
    );
  }
  for (const [archivePath, file] of files) {
    const destination = join(stageDir, ...archivePath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.bytes, { mode: file.mode });
    await chmod(destination, file.mode);
  }
}

async function collectDirectoryFiles(
  root: string,
  archiveRoot: string,
  files: Map<string, { readonly bytes: Uint8Array; readonly mode: number }>,
  options: {
    readonly exclude: ReadonlySet<string>;
    readonly trustedRoot?: string;
  },
): Promise<void> {
  const resolvedRoot = await realpath(resolve(root));
  const trustedRoot = await realpath(resolve(options.trustedRoot ?? root));
  await collectTree(
    trustedRoot,
    resolvedRoot,
    archiveRoot,
    files,
    options,
    new Set(),
  );
}

async function collectTree(
  trustedRoot: string,
  source: string,
  archivePath: string,
  files: Map<string, { readonly bytes: Uint8Array; readonly mode: number }>,
  options: {
    readonly exclude: ReadonlySet<string>;
    readonly trustedRoot?: string;
  },
  ancestors: ReadonlySet<string>,
): Promise<void> {
  const normalizedArchivePath = archivePath
    ? normalizeArchivePath(archivePath)
    : '';
  if (normalizedArchivePath && options.exclude.has(normalizedArchivePath)) {
    return;
  }
  const metadata = await lstat(source);
  const resolvedSource = metadata.isSymbolicLink()
    ? await realpath(source)
    : source;
  if (metadata.isSymbolicLink()) {
    const targetRelative = relative(trustedRoot, resolvedSource);
    if (targetRelative === '..' || targetRelative.startsWith(`..${sep}`)) {
      throw new Error(`Agent deployment symlink escapes its root: ${source}`);
    }
  }
  const followed = await stat(source);
  if (followed.isFile()) {
    if (!normalizedArchivePath) {
      throw new Error('Agent bundle file is missing an archive path');
    }
    files.set(normalizedArchivePath, {
      bytes: await readFile(source),
      mode: followed.mode & 0o111 ? 0o755 : 0o644,
    });
    return;
  }
  if (!followed.isDirectory()) {
    return;
  }
  const directoryIdentity = await realpath(source);
  if (ancestors.has(directoryIdentity)) {
    throw new Error(`Agent deployment contains a recursive symlink: ${source}`);
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(directoryIdentity);
  for (const entry of (await readdir(source, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  )) {
    await collectTree(
      trustedRoot,
      join(source, entry.name),
      archivePath ? `${archivePath}/${entry.name}` : entry.name,
      files,
      options,
      nextAncestors,
    );
  }
}

function sanitizeMarker(value: string): string {
  const marker = value.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 64);
  if (!marker) {
    throw new Error('Pull-request marker is invalid');
  }
  return marker;
}

function macInfoPlist(version: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>CthuTool Agent</string>
<key>CFBundleExecutable</key><string>cthutool-agent-tray</string>
<key>CFBundleIdentifier</key><string>dev.cthutool.agent</string>
<key>CFBundleName</key><string>CthuTool Agent</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${version}</string>
<key>LSUIElement</key><true/>
<key>NSLocalNetworkUsageDescription</key><string>Connect the deployed CthuTool console to this local Agent.</string>
</dict></plist>
`;
}

export function releaseTargetFromPlatform(
  platform: NodeJS.Platform,
  architecture: string,
): AgentReleaseTarget | undefined {
  if (platform === 'darwin' && architecture === 'arm64') {
    return 'darwin-arm64';
  }
  if (platform === 'darwin' && architecture === 'x64') {
    return 'darwin-x64';
  }
  if (platform === 'win32' && architecture === 'x64') {
    return 'windows-x64';
  }
  return undefined;
}

export function archiveBasename(path: string): string {
  return basename(path);
}
