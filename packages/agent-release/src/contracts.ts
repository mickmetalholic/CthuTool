import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from 'node:crypto';

export const AGENT_RELEASE_MANIFEST_SCHEMA_VERSION = 3;
export const AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION = 1;
export const AGENT_BUNDLE_LAYOUT_VERSION = 1;
export const AGENT_LATEST_RELEASE_TAG = 'agent-latest';
export const SUPPORTED_AGENT_TARGETS = [
  'darwin-arm64',
  'darwin-x64',
  'windows-x64',
] as const;

export type AgentReleaseTarget = (typeof SUPPORTED_AGENT_TARGETS)[number];

export type ReleaseEnvironment = {
  readonly environmentId: string;
  readonly label: string;
  readonly webOrigin: string;
  readonly webAgentUrl: string;
  readonly backendHttpUrl: string;
  readonly backendAgentWsUrl: string;
  readonly namespace: string;
};

export type ReleaseEnvironmentCatalog = {
  readonly schemaVersion: number;
  readonly profiles: readonly ReleaseEnvironment[];
};

export type AgentReleaseArtifact = {
  readonly target: AgentReleaseTarget;
  readonly platform: 'darwin' | 'windows';
  readonly architecture: 'arm64' | 'x64';
  readonly archiveUrl: string;
  readonly archiveSize: number;
  readonly archiveSha256: string;
  readonly trayEntryPoint: string;
  readonly setupEntryPoint: string;
  readonly nodeEntryPoint: string;
  readonly agentEntryPoint: string;
};

export type AgentReleaseProvenanceKind = 'self-use' | 'pull-request-validation';

export type AgentReleaseManifest = {
  readonly schemaVersion: number;
  readonly releaseVersion: string;
  readonly minimumCliVersion: string;
  readonly layoutVersion: number;
  readonly protocols: {
    readonly agentBackend: number;
    readonly agentControl: number;
    readonly localBridge: number;
    readonly trayControl: number;
  };
  readonly provenance: {
    readonly kind: AgentReleaseProvenanceKind;
    readonly signed: false;
  };
  readonly artifacts: readonly AgentReleaseArtifact[];
};

export class AgentReleaseValidationError extends Error {
  constructor(
    readonly code:
      | 'INVALID_CATALOG'
      | 'INVALID_MANIFEST'
      | 'UNSUPPORTED_TARGET'
      | 'INCOMPATIBLE_CLI'
      | 'INCOMPATIBLE_SCHEMA'
      | 'INVALID_SIGNATURE'
      | 'INTEGRITY_MISMATCH',
    message: string,
  ) {
    super(message);
    this.name = 'AgentReleaseValidationError';
  }
}

export function validateEnvironmentCatalog(
  input: unknown,
): ReleaseEnvironmentCatalog {
  const catalog = requireObject(input, 'environment catalog');
  requireExactKeys(catalog, ['schemaVersion', 'profiles'], 'catalog');
  if (
    catalog.schemaVersion !== AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION ||
    !Array.isArray(catalog.profiles) ||
    catalog.profiles.length === 0
  ) {
    invalidCatalog('Catalog schema or environment list is invalid');
  }
  const ids = new Set<string>();
  const namespaces = new Set<string>();
  const profiles = catalog.profiles.map((value, index) => {
    const environment = requireObject(value, `environment ${index}`);
    requireExactKeys(
      environment,
      [
        'environmentId',
        'label',
        'webOrigin',
        'webAgentUrl',
        'backendHttpUrl',
        'backendAgentWsUrl',
        'namespace',
      ],
      `environment ${index}`,
    );
    const environmentId = requirePattern(
      environment.environmentId,
      /^[a-z][a-z0-9-]{0,63}$/,
      'environmentId',
    );
    const namespace = requirePattern(
      environment.namespace,
      /^[a-z][a-z0-9_-]{0,63}$/,
      'namespace',
    );
    if (ids.has(environmentId) || namespaces.has(namespace)) {
      invalidCatalog('Environment ids and namespaces must be unique');
    }
    ids.add(environmentId);
    namespaces.add(namespace);
    const webOrigin = requireExactOrigin(environment.webOrigin, 'webOrigin');
    const webAgentUrl = requireHttpsUrl(environment.webAgentUrl, 'webAgentUrl');
    if (
      webAgentUrl.origin !== webOrigin ||
      webAgentUrl.pathname !== '/agent' ||
      webAgentUrl.search ||
      webAgentUrl.hash
    ) {
      invalidCatalog(
        'webAgentUrl must be the same-origin exact /agent console URL',
      );
    }
    const backendHttpUrl = requireHttpsUrl(
      environment.backendHttpUrl,
      'backendHttpUrl',
    );
    const backendAgentWsUrl = requireUrl(
      environment.backendAgentWsUrl,
      'backendAgentWsUrl',
    );
    if (backendAgentWsUrl.protocol !== 'wss:') {
      invalidCatalog('backendAgentWsUrl must use WSS');
    }
    return {
      environmentId,
      label: requireText(environment.label, 'label'),
      webOrigin,
      webAgentUrl: webAgentUrl.href,
      backendHttpUrl: trimTrailingSlash(backendHttpUrl.href),
      backendAgentWsUrl: trimTrailingSlash(backendAgentWsUrl.href),
      namespace,
    };
  });
  return {
    schemaVersion: AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
    profiles,
  };
}

export function assertSelfUseCatalogConfigured(
  catalog: ReleaseEnvironmentCatalog,
): void {
  const hasPlaceholder = catalog.profiles.some((profile) =>
    [
      profile.webOrigin,
      profile.webAgentUrl,
      profile.backendHttpUrl,
      profile.backendAgentWsUrl,
    ].some((value) => {
      const hostname = new URL(value).hostname;
      return hostname === 'example.com' || hostname.endsWith('.example.com');
    }),
  );
  if (hasPlaceholder) {
    throw new AgentReleaseValidationError(
      'INVALID_CATALOG',
      'Self-use release catalog must use deployed Web and backend origins; example.com placeholders are not publishable',
    );
  }
}

export function validateReleaseManifest(
  input: unknown,
  options: { readonly requireSelfUseMatrix?: boolean } = {},
): AgentReleaseManifest {
  const manifest = requireObject(input, 'release manifest');
  if (
    typeof manifest.schemaVersion !== 'number' ||
    manifest.schemaVersion !== AGENT_RELEASE_MANIFEST_SCHEMA_VERSION
  ) {
    throw new AgentReleaseValidationError(
      'INCOMPATIBLE_SCHEMA',
      'Release manifest schema is unsupported',
    );
  }
  requireExactKeys(
    manifest,
    [
      'schemaVersion',
      'releaseVersion',
      'minimumCliVersion',
      'layoutVersion',
      'protocols',
      'provenance',
      'artifacts',
    ],
    'manifest',
  );
  if (manifest.layoutVersion !== AGENT_BUNDLE_LAYOUT_VERSION) {
    invalidManifest('Bundle layout version is unsupported');
  }
  if ('environmentCatalog' in manifest) {
    invalidManifest(
      'Self-use manifests must not bind a deployment URL catalog digest',
    );
  }
  const releaseVersion = requireGeneratedReleaseVersion(
    manifest.releaseVersion,
    'releaseVersion',
  );
  const minimumCliVersion = requireSemver(
    manifest.minimumCliVersion,
    'minimumCliVersion',
  );
  const protocols = validateProtocolObject(manifest.protocols);
  const provenance = validateProvenance(manifest.provenance);
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    invalidManifest('Release manifest must contain platform artifacts');
  }
  const artifacts = manifest.artifacts.map((artifact) =>
    validateArtifact(artifact, provenance.kind),
  );
  const targets = artifacts.map((artifact) => artifact.target);
  if (new Set(targets).size !== targets.length) {
    invalidManifest('Release manifest target entries must be unique');
  }
  const requiresMatrix =
    options.requireSelfUseMatrix ?? provenance.kind === 'self-use';
  if (
    requiresMatrix &&
    !SUPPORTED_AGENT_TARGETS.every((target) => targets.includes(target))
  ) {
    invalidManifest('Self-use manifest must contain every supported target');
  }
  if (provenance.signed) {
    invalidManifest('Self-use and pull-request manifests must be unsigned');
  }
  if (
    provenance.kind === 'self-use' &&
    artifacts.some((artifact) => artifact.archiveUrl.includes('-unsigned-pr-'))
  ) {
    invalidManifest(
      'Self-use manifest cannot reference pull-request artifacts',
    );
  }
  if (
    provenance.kind === 'pull-request-validation' &&
    artifacts.some((artifact) => !artifact.archiveUrl.includes('-unsigned-pr-'))
  ) {
    invalidManifest('Pull-request artifacts must be unsigned and marked');
  }
  return {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion,
    minimumCliVersion,
    layoutVersion: AGENT_BUNDLE_LAYOUT_VERSION,
    protocols,
    provenance,
    artifacts,
  };
}

export function selectReleaseArtifact(
  manifest: AgentReleaseManifest,
  target: string,
): AgentReleaseArtifact {
  const artifact = manifest.artifacts.find(
    (candidate) => candidate.target === target,
  );
  if (!artifact) {
    throw new AgentReleaseValidationError(
      'UNSUPPORTED_TARGET',
      `Agent release does not support target "${target}"`,
    );
  }
  return artifact;
}

export function assertCliCompatibility(
  manifest: AgentReleaseManifest,
  cliVersion: string,
): void {
  const running = parseSemver(requireSemver(cliVersion, 'cliVersion'));
  const minimum = parseSemver(manifest.minimumCliVersion);
  if (compareSemver(running, minimum) < 0) {
    throw new AgentReleaseValidationError(
      'INCOMPATIBLE_CLI',
      `Agent release requires chc ${manifest.minimumCliVersion} or newer`,
    );
  }
}

export function assertArchiveBinding(
  artifact: AgentReleaseArtifact,
  archiveBytes: Uint8Array,
): void {
  if (
    archiveBytes.byteLength !== artifact.archiveSize ||
    sha256(archiveBytes) !== artifact.archiveSha256
  ) {
    throw new AgentReleaseValidationError(
      'INTEGRITY_MISMATCH',
      'Agent archive size or digest does not match the release manifest',
    );
  }
}

export function assertSelfUseProvenance(manifest: AgentReleaseManifest): void {
  if (manifest.provenance.kind !== 'self-use' || manifest.provenance.signed) {
    throw new AgentReleaseValidationError(
      'INCOMPATIBLE_SCHEMA',
      'Agent install requires an unsigned self-use release manifest',
    );
  }
}

export function signManifest(
  manifest: AgentReleaseManifest,
  privateKeyPem: string,
): string {
  return sign(
    null,
    Buffer.from(canonicalJson(manifest)),
    createPrivateKey(privateKeyPem),
  ).toString('base64');
}

export function verifyManifestSignature(
  manifest: AgentReleaseManifest,
  signatureBase64: string,
  publicKeyPem: string,
): void {
  const accepted = verify(
    null,
    Buffer.from(canonicalJson(manifest)),
    createPublicKey(publicKeyPem),
    Buffer.from(signatureBase64, 'base64'),
  );
  if (!accepted) {
    throw new AgentReleaseValidationError(
      'INVALID_SIGNATURE',
      'Agent release manifest signature is invalid',
    );
  }
}

export function signReleaseBlob(
  bytes: Uint8Array,
  privateKeyPem: string,
): string {
  return sign(null, bytes, createPrivateKey(privateKeyPem)).toString('base64');
}

export function verifyReleaseBlobSignature(
  bytes: Uint8Array,
  signatureBase64: string,
  publicKeyPem: string,
): void {
  if (
    !verify(
      null,
      bytes,
      createPublicKey(publicKeyPem),
      Buffer.from(signatureBase64, 'base64'),
    )
  ) {
    throw new AgentReleaseValidationError(
      'INVALID_SIGNATURE',
      'Agent release blob signature is invalid',
    );
  }
}

export function canonicalJson(input: unknown): string {
  return `${JSON.stringify(sortJson(input))}\n`;
}

export function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function validateArtifact(
  input: unknown,
  provenance: AgentReleaseProvenanceKind,
): AgentReleaseArtifact {
  const artifact = requireObject(input, 'artifact');
  requireExactKeys(
    artifact,
    [
      'target',
      'platform',
      'architecture',
      'archiveUrl',
      'archiveSize',
      'archiveSha256',
      'trayEntryPoint',
      'setupEntryPoint',
      'nodeEntryPoint',
      'agentEntryPoint',
    ],
    'artifact',
  );
  if (
    !SUPPORTED_AGENT_TARGETS.includes(artifact.target as AgentReleaseTarget)
  ) {
    invalidManifest('Artifact target is unsupported');
  }
  const expected = targetParts(artifact.target as AgentReleaseTarget);
  if (
    artifact.platform !== expected.platform ||
    artifact.architecture !== expected.architecture ||
    !Number.isSafeInteger(artifact.archiveSize) ||
    (artifact.archiveSize as number) <= 0
  ) {
    invalidManifest('Artifact platform, architecture, or size is invalid');
  }
  if ('archiveSignatureUrl' in artifact || 'platformSignature' in artifact) {
    invalidManifest(
      'Self-use artifacts must not declare detached signatures or platform signing requirements',
    );
  }
  const entryPoints = targetEntryPoints(artifact.target as AgentReleaseTarget);
  const trayEntryPoint = requireRelativePath(
    artifact.trayEntryPoint,
    'trayEntryPoint',
  );
  const setupEntryPoint = requireRelativePath(
    artifact.setupEntryPoint,
    'setupEntryPoint',
  );
  const nodeEntryPoint = requireRelativePath(
    artifact.nodeEntryPoint,
    'nodeEntryPoint',
  );
  const agentEntryPoint = requireRelativePath(
    artifact.agentEntryPoint,
    'agentEntryPoint',
  );
  if (
    trayEntryPoint !== entryPoints.tray ||
    setupEntryPoint !== entryPoints.setup ||
    nodeEntryPoint !== entryPoints.node ||
    agentEntryPoint !== entryPoints.agent
  ) {
    invalidManifest('Artifact entry points do not match the target layout');
  }
  const archiveUrl = requireManifestHttpsUrl(artifact.archiveUrl, 'archiveUrl');
  if (provenance === 'self-use') {
    assertSelfUseArchiveUrl(archiveUrl, artifact.target as AgentReleaseTarget);
  }
  return {
    target: artifact.target as AgentReleaseTarget,
    platform: expected.platform,
    architecture: expected.architecture,
    archiveUrl: archiveUrl.href,
    archiveSize: artifact.archiveSize as number,
    archiveSha256: requireSha256(artifact.archiveSha256, 'archiveSha256'),
    trayEntryPoint,
    setupEntryPoint,
    nodeEntryPoint,
    agentEntryPoint,
  };
}

function assertSelfUseArchiveUrl(url: URL, target: AgentReleaseTarget): void {
  const name = url.pathname.split('/').at(-1) ?? '';
  if (
    !name.startsWith('cthutool-agent-') ||
    !name.includes(`-${target}.zip`) ||
    name.includes('-unsigned-pr-')
  ) {
    invalidManifest(
      'Self-use archive URL must use a versioned target archive name',
    );
  }
  if (!url.pathname.includes(`/${AGENT_LATEST_RELEASE_TAG}/`)) {
    invalidManifest(
      `Self-use archive URL must be published under ${AGENT_LATEST_RELEASE_TAG}`,
    );
  }
}

function targetEntryPoints(target: AgentReleaseTarget): {
  readonly tray: string;
  readonly setup: string;
  readonly node: string;
  readonly agent: string;
} {
  return {
    tray:
      target === 'windows-x64'
        ? 'bin/cthutool-agent-tray.exe'
        : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
    setup:
      target === 'windows-x64'
        ? 'bin/cthutool-agent-setup.exe'
        : 'bin/cthutool-agent-setup',
    node:
      target === 'windows-x64'
        ? 'runtime/node/node.exe'
        : 'runtime/node/bin/node',
    agent: 'agent/dist/index.js',
  };
}

function validateProtocolObject(input: unknown) {
  const protocols = requireObject(input, 'protocols');
  const keys = ['agentBackend', 'agentControl', 'localBridge', 'trayControl'];
  requireExactKeys(protocols, keys, 'protocols');
  if (
    keys.some(
      (key) => !Number.isSafeInteger(protocols[key]) || protocols[key] !== 1,
    )
  ) {
    invalidManifest('Release protocol compatibility is unsupported');
  }
  return protocols as AgentReleaseManifest['protocols'];
}

function validateProvenance(input: unknown) {
  const provenance = requireObject(input, 'provenance');
  requireExactKeys(provenance, ['kind', 'signed'], 'provenance');
  if (
    (provenance.kind !== 'self-use' &&
      provenance.kind !== 'pull-request-validation') ||
    provenance.signed !== false
  ) {
    invalidManifest('Manifest provenance is invalid');
  }
  return provenance as AgentReleaseManifest['provenance'];
}

function targetParts(target: AgentReleaseTarget): {
  readonly platform: 'darwin' | 'windows';
  readonly architecture: 'arm64' | 'x64';
} {
  const [platform, architecture] = target.split('-');
  return {
    platform: platform as 'darwin' | 'windows',
    architecture: architecture as 'arm64' | 'x64',
  };
}

function requireObject(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AgentReleaseValidationError(
      label.includes('catalog') || label.includes('environment')
        ? 'INVALID_CATALOG'
        : 'INVALID_MANIFEST',
      `${label} must be an object`,
    );
  }
  return input as Record<string, unknown>;
}

function requireExactKeys(
  input: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    const message = `${label} has unknown or missing fields`;
    if (label.includes('catalog') || label.includes('environment')) {
      invalidCatalog(message);
    }
    invalidManifest(message);
  }
}

function requireText(input: unknown, label: string): string {
  if (typeof input !== 'string' || !input.trim() || input.length > 256) {
    invalidCatalog(`${label} must be non-empty text`);
  }
  return input.trim();
}

function requirePattern(
  input: unknown,
  pattern: RegExp,
  label: string,
): string {
  if (typeof input !== 'string' || !pattern.test(input)) {
    invalidCatalog(`${label} is invalid`);
  }
  return input;
}

function requireUrl(input: unknown, label: string): URL {
  if (typeof input !== 'string') {
    invalidCatalog(`${label} must be a URL`);
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    invalidCatalog(`${label} must be a URL`);
  }
  if (url.username || url.password || url.hash) {
    invalidCatalog(`${label} must not contain credentials or a fragment`);
  }
  return url;
}

function requireHttpsUrl(input: unknown, label: string): URL {
  const url = requireUrl(input, label);
  if (url.protocol !== 'https:') {
    invalidCatalog(`${label} must use HTTPS`);
  }
  return url;
}

function requireManifestHttpsUrl(input: unknown, label: string): URL {
  if (typeof input !== 'string') {
    invalidManifest(`${label} must be a URL`);
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    invalidManifest(`${label} must be a URL`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    invalidManifest(
      `${label} must be an HTTPS URL without credentials or fragment`,
    );
  }
  return url;
}

function requireExactOrigin(input: unknown, label: string): string {
  const url = requireHttpsUrl(input, label);
  if (url.href !== `${url.origin}/`) {
    invalidCatalog(`${label} must be an exact origin without path or query`);
  }
  return url.origin;
}

function requireSemver(input: unknown, label: string): string {
  if (
    typeof input !== 'string' ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(input)
  ) {
    invalidManifest(`${label} must be a semantic version`);
  }
  return input;
}

function requireGeneratedReleaseVersion(input: unknown, label: string): string {
  return requireSemver(input, label);
}

function requireSha256(input: unknown, label: string): string {
  if (typeof input !== 'string' || !/^[a-f0-9]{64}$/.test(input)) {
    invalidManifest(`${label} must be a lowercase SHA-256 digest`);
  }
  return input;
}

function requireRelativePath(input: unknown, label: string): string {
  if (
    typeof input !== 'string' ||
    !input ||
    input.startsWith('/') ||
    input.includes('\\') ||
    input.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    invalidManifest(`${label} must be a safe relative path`);
  }
  return input;
}

function parseSemver(version: string): readonly number[] {
  return version
    .split('-', 1)[0]
    .split('.')
    .map((value) => Number.parseInt(value, 10));
}

function compareSemver(
  left: readonly number[],
  right: readonly number[],
): number {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return (left[index] ?? 0) - (right[index] ?? 0);
    }
  }
  return 0;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJson(child)]),
    );
  }
  return value;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function invalidCatalog(message: string): never {
  throw new AgentReleaseValidationError('INVALID_CATALOG', message);
}

function invalidManifest(message: string): never {
  throw new AgentReleaseValidationError('INVALID_MANIFEST', message);
}
