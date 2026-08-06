import type { AgentReleaseTarget } from './contracts';

export const REQUIRED_COMMON_BUNDLE_PATHS = [
  'layout.json',
  'agent/dist/index.js',
  'agent/environments.json',
  'licenses/NODE_LICENSE',
  'licenses/THIRD_PARTY_NOTICES.txt',
] as const;

export const MUTABLE_AGENT_PATH_SEGMENTS = [
  'environment.json',
  'browser-profiles',
  'logs',
  'config.json',
] as const;

const FORBIDDEN_VERSION_PATH_SEGMENTS = [
  ...MUTABLE_AGENT_PATH_SEGMENTS,
  'agent-secret',
] as const;

export type BundleLayout = {
  readonly layoutVersion: 1;
  readonly releaseVersion: string;
  readonly target: AgentReleaseTarget;
  readonly entryPoints: {
    readonly tray: string;
    readonly node: string;
    readonly agent: 'agent/dist/index.js';
    readonly environmentCatalog: 'agent/environments.json';
  };
  readonly mutableDataRoot: 'external-user-data';
};

export class BundleLayoutError extends Error {
  constructor(
    readonly code:
      | 'MISSING_FILE'
      | 'FORBIDDEN_CONTENT'
      | 'MUTABLE_CONTENT'
      | 'INVALID_PATH',
    message: string,
  ) {
    super(message);
    this.name = 'BundleLayoutError';
  }
}

export function createBundleLayout(
  target: AgentReleaseTarget,
  releaseVersion: string,
): BundleLayout {
  const windows = target === 'windows-x64';
  return {
    layoutVersion: 1,
    releaseVersion,
    target,
    entryPoints: {
      tray: windows
        ? 'bin/cthutool-agent-tray.exe'
        : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
      node: windows ? 'runtime/node/node.exe' : 'runtime/node/bin/node',
      agent: 'agent/dist/index.js',
      environmentCatalog: 'agent/environments.json',
    },
    mutableDataRoot: 'external-user-data',
  };
}

export function validateBundleLayout(input: unknown): BundleLayout {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BundleLayoutError(
      'INVALID_PATH',
      'Bundle layout must be an object',
    );
  }
  const value = input as Partial<BundleLayout> & Record<string, unknown>;
  const keys = Object.keys(value).sort();
  const expectedKeys = [
    'entryPoints',
    'layoutVersion',
    'mutableDataRoot',
    'releaseVersion',
    'target',
  ];
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index]) ||
    value.layoutVersion !== 1 ||
    value.mutableDataRoot !== 'external-user-data' ||
    !SUPPORTED_TARGET_SET.has(value.target as AgentReleaseTarget) ||
    typeof value.releaseVersion !== 'string'
  ) {
    throw new BundleLayoutError(
      'INVALID_PATH',
      'Bundle layout contract is invalid',
    );
  }
  const expected = createBundleLayout(
    value.target as AgentReleaseTarget,
    value.releaseVersion,
  );
  const entryPoints = value.entryPoints;
  if (
    !entryPoints ||
    typeof entryPoints !== 'object' ||
    Array.isArray(entryPoints) ||
    Object.keys(entryPoints).sort().join(',') !==
      ['agent', 'environmentCatalog', 'node', 'tray'].join(',') ||
    Object.entries(expected.entryPoints).some(
      ([key, entryPoint]) =>
        (entryPoints as Record<string, unknown>)[key] !== entryPoint,
    )
  ) {
    throw new BundleLayoutError(
      'INVALID_PATH',
      'Bundle layout entry points do not match the target contract',
    );
  }
  return expected;
}

const SUPPORTED_TARGET_SET = new Set<AgentReleaseTarget>([
  'darwin-arm64',
  'darwin-x64',
  'windows-x64',
]);

export function validateBundleInventory(
  target: AgentReleaseTarget,
  rawPaths: readonly string[],
): readonly string[] {
  const paths = [...new Set(rawPaths.map(normalizeArchivePath))].sort();
  const layout = createBundleLayout(target, '0.0.0');
  const required = [
    ...REQUIRED_COMMON_BUNDLE_PATHS,
    layout.entryPoints.tray,
    layout.entryPoints.node,
    ...(target.startsWith('darwin-')
      ? ['bin/CthuTool Agent.app/Contents/Info.plist']
      : []),
  ];
  for (const expected of required) {
    if (!paths.includes(expected)) {
      throw new BundleLayoutError(
        'MISSING_FILE',
        `Agent bundle is missing ${expected}`,
      );
    }
  }
  for (const browserDependency of ['playwright', 'playwright-core']) {
    if (
      !paths.some(
        (path) =>
          (path.startsWith('agent/node_modules/') &&
            path.endsWith(`/node_modules/${browserDependency}/package.json`)) ||
          path === `agent/node_modules/${browserDependency}/package.json`,
      )
    ) {
      throw new BundleLayoutError(
        'MISSING_FILE',
        `Agent bundle is missing the ${browserDependency} browser dependency`,
      );
    }
  }
  for (const path of paths) {
    const lower = path.toLowerCase();
    const dependencyAsset = lower.startsWith('agent/node_modules/');
    if (
      lower.startsWith('electron/') ||
      lower.includes('/node_modules/electron/') ||
      lower.includes('electron framework') ||
      lower.startsWith('webview/') ||
      lower.includes('/embeddedwebview.framework/') ||
      lower.startsWith('desktop/') ||
      lower.includes('/renderer/') ||
      lower.startsWith('web/') ||
      lower.includes('/_next/') ||
      (!dependencyAsset &&
        (lower.endsWith('.html') || lower.endsWith('.css'))) ||
      (lower.endsWith('.js') && !lower.startsWith('agent/'))
    ) {
      throw new BundleLayoutError(
        'FORBIDDEN_CONTENT',
        `Agent bundle contains local UI runtime or assets: ${path}`,
      );
    }
    if (
      FORBIDDEN_VERSION_PATH_SEGMENTS.some(
        (segment) => path === segment || path.split('/').includes(segment),
      )
    ) {
      throw new BundleLayoutError(
        'MUTABLE_CONTENT',
        `Mutable Agent data must remain outside version contents: ${path}`,
      );
    }
  }
  return paths;
}

export function normalizeArchivePath(input: string): string {
  const path = input.replaceAll('\\', '/').replace(/^\.\//, '');
  if (
    !path ||
    path.startsWith('/') ||
    /^[A-Za-z]:/.test(path) ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new BundleLayoutError(
      'INVALID_PATH',
      `Unsafe Agent archive path: ${input}`,
    );
  }
  return path;
}
