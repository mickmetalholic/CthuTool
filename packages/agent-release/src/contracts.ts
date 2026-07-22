import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from 'node:crypto';

export const AGENT_RELEASE_MANIFEST_SCHEMA_VERSION = 1;
export const AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION = 1;
export const AGENT_BUNDLE_LAYOUT_VERSION = 1;
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
  readonly archiveSignatureUrl: string;
  readonly trayEntryPoint: string;
  readonly nodeEntryPoint: string;
  readonly agentEntryPoint: string;
  readonly platformSignature: {
    readonly required: true;
    readonly notarizationRequired: boolean;
  };
};

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
  readonly environmentCatalog: {
    readonly schemaVersion: number;
    readonly sha256: string;
  };
  readonly provenance: {
    readonly kind: 'production' | 'pull-request-validation';
    readonly signed: boolean;
  };
  readonly artifacts: readonly AgentReleaseArtifact[];
};

export type AgentReleaseChannelPointer = {
  readonly schemaVersion: number;
  readonly channel: 'stable' | 'beta';
  readonly releaseVersion: string;
  readonly manifestUrl: string;
  readonly manifestSha256: string;
};

export class AgentReleaseValidationError extends Error {
  constructor(
    readonly code:
      | 'INVALID_CATALOG'
      | 'INVALID_MANIFEST'
      | 'INVALID_CHANNEL_POINTER'
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

export function validateReleaseManifest(
  input: unknown,
  options: { readonly requireProductionMatrix?: boolean } = {},
): AgentReleaseManifest {
  const manifest = requireObject(input, 'release manifest');
  requireExactKeys(
    manifest,
    [
      'schemaVersion',
      'releaseVersion',
      'minimumCliVersion',
      'layoutVersion',
      'protocols',
      'environmentCatalog',
      'provenance',
      'artifacts',
    ],
    'manifest',
  );
  if (manifest.schemaVersion !== AGENT_RELEASE_MANIFEST_SCHEMA_VERSION) {
    throw new AgentReleaseValidationError(
      'INCOMPATIBLE_SCHEMA',
      'Release manifest schema is unsupported',
    );
  }
  if (manifest.layoutVersion !== AGENT_BUNDLE_LAYOUT_VERSION) {
    invalidManifest('Bundle layout version is unsupported');
  }
  const releaseVersion = requireSemver(
    manifest.releaseVersion,
    'releaseVersion',
  );
  const minimumCliVersion = requireSemver(
    manifest.minimumCliVersion,
    'minimumCliVersion',
  );
  const protocols = validateProtocolObject(manifest.protocols);
  const environmentCatalog = validateCatalogBinding(
    manifest.environmentCatalog,
  );
  const provenance = validateProvenance(manifest.provenance);
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    invalidManifest('Release manifest must contain platform artifacts');
  }
  const artifacts = manifest.artifacts.map(validateArtifact);
  const targets = artifacts.map((artifact) => artifact.target);
  if (new Set(targets).size !== targets.length) {
    invalidManifest('Release manifest target entries must be unique');
  }
  const requiresMatrix =
    options.requireProductionMatrix ?? provenance.kind === 'production';
  if (
    requiresMatrix &&
    !SUPPORTED_AGENT_TARGETS.every((target) => targets.includes(target))
  ) {
    invalidManifest('Production manifest must contain every supported target');
  }
  if (provenance.kind === 'production' && !provenance.signed) {
    invalidManifest('Production manifest must be signed');
  }
  if (
    provenance.kind === 'production' &&
    artifacts.some((artifact) => artifact.archiveUrl.includes('-unsigned-pr-'))
  ) {
    invalidManifest(
      'Production manifest cannot reference pull-request artifacts',
    );
  }
  if (
    provenance.kind === 'pull-request-validation' &&
    (provenance.signed ||
      artifacts.some(
        (artifact) => !artifact.archiveUrl.includes('-unsigned-pr-'),
      ))
  ) {
    invalidManifest('Pull-request artifacts must be unsigned and marked');
  }
  return {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion,
    minimumCliVersion,
    layoutVersion: AGENT_BUNDLE_LAYOUT_VERSION,
    protocols,
    environmentCatalog,
    provenance,
    artifacts,
  };
}

export function validateChannelPointer(
  input: unknown,
): AgentReleaseChannelPointer {
  const pointer = requireObject(input, 'channel pointer');
  requireExactKeys(
    pointer,
    [
      'schemaVersion',
      'channel',
      'releaseVersion',
      'manifestUrl',
      'manifestSha256',
    ],
    'channel pointer',
  );
  if (
    pointer.schemaVersion !== 1 ||
    (pointer.channel !== 'stable' && pointer.channel !== 'beta')
  ) {
    invalidChannel('Channel pointer schema or channel is invalid');
  }
  const releaseVersion = requireSemver(
    pointer.releaseVersion,
    'releaseVersion',
  );
  const manifestUrl = requireManifestHttpsUrl(
    pointer.manifestUrl,
    'manifestUrl',
  );
  if (!manifestUrl.pathname.includes(`/${releaseVersion}/`)) {
    invalidChannel('Channel pointer must reference an immutable version URL');
  }
  return {
    schemaVersion: 1,
    channel: pointer.channel,
    releaseVersion,
    manifestUrl: manifestUrl.href,
    manifestSha256: requireSha256(pointer.manifestSha256, 'manifestSha256'),
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

export function assertCatalogBinding(
  manifest: AgentReleaseManifest,
  catalogBytes: Uint8Array,
): ReleaseEnvironmentCatalog {
  const catalog = validateEnvironmentCatalog(
    JSON.parse(Buffer.from(catalogBytes).toString('utf8')),
  );
  if (
    catalog.schemaVersion !== manifest.environmentCatalog.schemaVersion ||
    sha256(catalogBytes) !== manifest.environmentCatalog.sha256
  ) {
    throw new AgentReleaseValidationError(
      'INTEGRITY_MISMATCH',
      'Environment catalog does not match the release manifest',
    );
  }
  return catalog;
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

function validateArtifact(input: unknown): AgentReleaseArtifact {
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
      'archiveSignatureUrl',
      'trayEntryPoint',
      'nodeEntryPoint',
      'agentEntryPoint',
      'platformSignature',
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
  const signature = requireObject(
    artifact.platformSignature,
    'platformSignature',
  );
  requireExactKeys(
    signature,
    ['required', 'notarizationRequired'],
    'platformSignature',
  );
  if (
    signature.required !== true ||
    typeof signature.notarizationRequired !== 'boolean' ||
    signature.notarizationRequired !== (expected.platform === 'darwin')
  ) {
    invalidManifest('Platform signing requirements are invalid');
  }
  const entryPoints = targetEntryPoints(artifact.target as AgentReleaseTarget);
  const trayEntryPoint = requireRelativePath(
    artifact.trayEntryPoint,
    'trayEntryPoint',
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
    nodeEntryPoint !== entryPoints.node ||
    agentEntryPoint !== entryPoints.agent
  ) {
    invalidManifest('Artifact entry points do not match the target layout');
  }
  return {
    target: artifact.target as AgentReleaseTarget,
    platform: expected.platform,
    architecture: expected.architecture,
    archiveUrl: requireManifestHttpsUrl(artifact.archiveUrl, 'archiveUrl').href,
    archiveSize: artifact.archiveSize as number,
    archiveSha256: requireSha256(artifact.archiveSha256, 'archiveSha256'),
    archiveSignatureUrl: requireManifestHttpsUrl(
      artifact.archiveSignatureUrl,
      'archiveSignatureUrl',
    ).href,
    trayEntryPoint,
    nodeEntryPoint,
    agentEntryPoint,
    platformSignature: {
      required: true,
      notarizationRequired: signature.notarizationRequired as boolean,
    },
  };
}

function targetEntryPoints(target: AgentReleaseTarget): {
  readonly tray: string;
  readonly node: string;
  readonly agent: string;
} {
  return {
    tray:
      target === 'windows-x64'
        ? 'bin/cthutool-agent-tray.exe'
        : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
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

function validateCatalogBinding(input: unknown) {
  const binding = requireObject(input, 'environmentCatalog');
  requireExactKeys(binding, ['schemaVersion', 'sha256'], 'environmentCatalog');
  if (binding.schemaVersion !== AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION) {
    invalidManifest('Environment catalog schema is unsupported');
  }
  return {
    schemaVersion: AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
    sha256: requireSha256(binding.sha256, 'environmentCatalog.sha256'),
  };
}

function validateProvenance(input: unknown) {
  const provenance = requireObject(input, 'provenance');
  requireExactKeys(provenance, ['kind', 'signed'], 'provenance');
  if (
    (provenance.kind !== 'production' &&
      provenance.kind !== 'pull-request-validation') ||
    typeof provenance.signed !== 'boolean'
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

function invalidChannel(message: string): never {
  throw new AgentReleaseValidationError('INVALID_CHANNEL_POINTER', message);
}
