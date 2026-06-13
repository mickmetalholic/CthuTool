import { readFile } from 'node:fs/promises';

export type BrowserResourceType =
  | 'document'
  | 'font'
  | 'image'
  | 'media'
  | 'script'
  | 'stylesheet'
  | 'xhr'
  | 'fetch';

export type BrowserAuthPolicy = 'anonymous' | 'required';

export type BrowserSiteConfig = {
  readonly siteId: string;
  readonly displayName: string;
  readonly allowedOrigins: readonly string[];
  readonly authPolicy: BrowserAuthPolicy;
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly defaultBlockResources?: readonly BrowserResourceType[];
  readonly defaultTimeoutMs?: number;
};

export type BrowserSitesJsonConfig = {
  readonly version: 1;
  readonly sites: readonly Record<string, unknown>[];
};

export type ConfigIssue = {
  readonly path: string;
  readonly message: string;
};

export type ConfigErrorCode = 'FILE_READ' | 'PARSE' | 'VALIDATION';

export class ConfigError extends Error {
  constructor(
    readonly code: ConfigErrorCode,
    message: string,
    readonly issues: readonly ConfigIssue[] = [],
    readonly path?: string,
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

const SITE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const PROFILE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const RESOURCE_TYPES = new Set<BrowserResourceType>([
  'document',
  'font',
  'image',
  'media',
  'script',
  'stylesheet',
  'xhr',
  'fetch',
]);

export async function loadBrowserSitesFile(
  path: string,
): Promise<BrowserSiteConfig[]> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    throw new ConfigError(
      'FILE_READ',
      `Unable to read browser sites config file "${path}": ${formatUnknownError(error)}`,
      [{ path: 'file', message: formatUnknownError(error) }],
      path,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new ConfigError(
      'PARSE',
      `PARSE: Browser sites config file "${path}" is not valid JSON: ${formatUnknownError(error)}`,
      [{ path: 'file', message: formatUnknownError(error) }],
      path,
    );
  }

  try {
    return parseBrowserSitesConfig(value);
  } catch (error) {
    if (error instanceof ConfigError) {
      throw new ConfigError(
        error.code,
        `Browser sites config file "${path}" is invalid: ${error.message}`,
        error.issues,
        path,
      );
    }
    throw error;
  }
}

export function parseBrowserSitesConfig(value: unknown): BrowserSiteConfig[] {
  const issues: ConfigIssue[] = [];
  if (!isRecord(value)) {
    throw validationError([
      { path: 'configuration', message: 'must be an object' },
    ]);
  }
  if (value.version !== 1) {
    issues.push({ path: 'version', message: 'must be 1' });
  }
  if (!Array.isArray(value.sites)) {
    issues.push({ path: 'sites', message: 'must be an array' });
  }
  if (issues.length > 0) {
    throw validationError(issues);
  }

  const siteIds = new Set<string>();
  const sites = (value.sites as readonly unknown[]).map((site, index) => {
    const parsed = parseSite(site, `sites.${index}`, false);
    if (siteIds.has(parsed.siteId)) {
      throw validationError([
        { path: `sites.${index}.siteId`, message: 'must be unique' },
      ]);
    }
    siteIds.add(parsed.siteId);
    return parsed;
  });

  return sortSites(sites);
}

export function mergeBrowserSites(
  defaults: readonly BrowserSiteConfig[],
  overrides: readonly BrowserSiteConfig[],
): BrowserSiteConfig[] {
  const bySiteId = new Map<string, BrowserSiteConfig>();
  for (const site of defaults) {
    bySiteId.set(site.siteId, copySite(site));
  }

  for (const override of overrides) {
    const current = bySiteId.get(override.siteId);
    bySiteId.set(
      override.siteId,
      copySite({
        ...(current ?? {}),
        ...override,
        allowedOrigins: override.allowedOrigins ?? current?.allowedOrigins,
        defaultBlockResources:
          override.defaultBlockResources ?? current?.defaultBlockResources,
      }),
    );
  }

  const sites = [...bySiteId.values()];
  const issues = collectSiteIssues(sites);
  if (issues.length > 0) {
    throw validationError(issues);
  }
  return sortSites(sites);
}

function parseSite(
  value: unknown,
  basePath: string,
  requireRequiredAuthFields: boolean,
): BrowserSiteConfig {
  const issues: ConfigIssue[] = [];
  if (!isRecord(value)) {
    throw validationError([{ path: basePath, message: 'must be an object' }]);
  }

  const siteId = readString(value, `${basePath}.siteId`, 'siteId', issues);
  const displayName = readString(
    value,
    `${basePath}.displayName`,
    'displayName',
    issues,
  );
  const authPolicy = readAuthPolicy(value, `${basePath}.authPolicy`, issues);
  const allowedOrigins = readUrlArray(
    value,
    `${basePath}.allowedOrigins`,
    'allowedOrigins',
    issues,
  );
  const profileName = readOptionalString(
    value,
    `${basePath}.profileName`,
    'profileName',
    issues,
  );
  const loginUrl = readOptionalUrl(
    value,
    `${basePath}.loginUrl`,
    'loginUrl',
    issues,
  );
  const verifyUrl = readOptionalUrl(
    value,
    `${basePath}.verifyUrl`,
    'verifyUrl',
    issues,
  );
  const defaultBlockResources = readOptionalResourceArray(
    value,
    `${basePath}.defaultBlockResources`,
    issues,
  );
  const defaultTimeoutMs = readOptionalPositiveInteger(
    value,
    `${basePath}.defaultTimeoutMs`,
    'defaultTimeoutMs',
    issues,
  );

  if (siteId && !SITE_ID_PATTERN.test(siteId)) {
    issues.push({
      path: `${basePath}.siteId`,
      message: 'must match ^[a-z][a-z0-9_-]{0,63}$',
    });
  }
  if (profileName && !PROFILE_NAME_PATTERN.test(profileName)) {
    issues.push({
      path: `${basePath}.profileName`,
      message: 'must match ^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$',
    });
  }
  if (authPolicy === 'required' && requireRequiredAuthFields) {
    if (!profileName) {
      issues.push({ path: `${basePath}.profileName`, message: 'is required' });
    }
    if (!loginUrl) {
      issues.push({ path: `${basePath}.loginUrl`, message: 'is required' });
    }
    if (!verifyUrl) {
      issues.push({ path: `${basePath}.verifyUrl`, message: 'is required' });
    }
  }
  if (allowedOrigins && allowedOrigins.length === 0) {
    issues.push({
      path: `${basePath}.allowedOrigins`,
      message: 'must contain at least one origin',
    });
  }

  if (issues.length > 0) {
    throw validationError(issues);
  }

  return copySite({
    allowedOrigins: uniqueSorted(allowedOrigins ?? []),
    authPolicy: authPolicy ?? 'anonymous',
    displayName: displayName ?? '',
    ...(defaultBlockResources
      ? { defaultBlockResources: uniqueSorted(defaultBlockResources) }
      : {}),
    ...(defaultTimeoutMs !== undefined ? { defaultTimeoutMs } : {}),
    ...(loginUrl ? { loginUrl } : {}),
    ...(profileName ? { profileName } : {}),
    siteId: siteId ?? '',
    ...(verifyUrl ? { verifyUrl } : {}),
  });
}

function collectSiteIssues(sites: readonly BrowserSiteConfig[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const siteIds = new Set<string>();
  sites.forEach((site, index) => {
    try {
      parseSite(site, `sites.${index}`, true);
    } catch (error) {
      if (error instanceof ConfigError) {
        issues.push(...error.issues);
      } else {
        throw error;
      }
    }
    if (siteIds.has(site.siteId)) {
      issues.push({ path: `sites.${index}.siteId`, message: 'must be unique' });
    }
    siteIds.add(site.siteId);
  });
  return issues;
}

function readString(
  value: Record<string, unknown>,
  path: string,
  key: string,
  issues: ConfigIssue[],
): string | undefined {
  const raw = value[key];
  if (typeof raw !== 'string' || raw.trim() === '') {
    issues.push({ path, message: 'must be a non-empty string' });
    return undefined;
  }
  return raw;
}

function readOptionalString(
  value: Record<string, unknown>,
  path: string,
  key: string,
  issues: ConfigIssue[],
): string | undefined {
  const raw = value[key];
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'string' || raw.trim() === '') {
    issues.push({ path, message: 'must be a non-empty string' });
    return undefined;
  }
  return raw;
}

function readAuthPolicy(
  value: Record<string, unknown>,
  path: string,
  issues: ConfigIssue[],
): BrowserAuthPolicy | undefined {
  const raw = value.authPolicy;
  if (raw !== 'anonymous' && raw !== 'required') {
    issues.push({ path, message: 'must be anonymous or required' });
    return undefined;
  }
  return raw;
}

function readUrlArray(
  value: Record<string, unknown>,
  path: string,
  key: string,
  issues: ConfigIssue[],
): string[] | undefined {
  const raw = value[key];
  if (!Array.isArray(raw)) {
    issues.push({ path, message: 'must be an array' });
    return undefined;
  }
  return raw.flatMap((item, index) => {
    if (typeof item !== 'string' || !isValidUrl(item)) {
      issues.push({ path: `${path}.${index}`, message: 'must be a valid URL' });
      return [];
    }
    return [new URL(item).origin];
  });
}

function readOptionalUrl(
  value: Record<string, unknown>,
  path: string,
  key: string,
  issues: ConfigIssue[],
): string | undefined {
  const raw = value[key];
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'string' || !isValidUrl(raw)) {
    issues.push({ path, message: 'must be a valid URL' });
    return undefined;
  }
  return raw;
}

function readOptionalResourceArray(
  value: Record<string, unknown>,
  path: string,
  issues: ConfigIssue[],
): BrowserResourceType[] | undefined {
  const raw = value.defaultBlockResources;
  if (raw === undefined) {
    return undefined;
  }
  if (!Array.isArray(raw)) {
    issues.push({ path, message: 'must be an array' });
    return undefined;
  }
  return raw.flatMap((item, index) => {
    if (
      typeof item !== 'string' ||
      !RESOURCE_TYPES.has(item as BrowserResourceType)
    ) {
      issues.push({
        path: `${path}.${index}`,
        message: 'must be a supported browser resource type',
      });
      return [];
    }
    return [item as BrowserResourceType];
  });
}

function readOptionalPositiveInteger(
  value: Record<string, unknown>,
  path: string,
  key: string,
  issues: ConfigIssue[],
): number | undefined {
  const raw = value[key];
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) {
    issues.push({ path, message: 'must be a positive integer' });
    return undefined;
  }
  return raw;
}

function validationError(issues: readonly ConfigIssue[]): ConfigError {
  return new ConfigError(
    'VALIDATION',
    issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '),
    issues,
  );
}

function sortSites(sites: readonly BrowserSiteConfig[]): BrowserSiteConfig[] {
  return sites
    .map(copySite)
    .sort((left, right) => left.siteId.localeCompare(right.siteId));
}

function copySite(site: BrowserSiteConfig): BrowserSiteConfig {
  return {
    allowedOrigins: [...site.allowedOrigins],
    authPolicy: site.authPolicy,
    displayName: site.displayName,
    ...(site.defaultBlockResources
      ? { defaultBlockResources: [...site.defaultBlockResources] }
      : {}),
    ...(site.defaultTimeoutMs !== undefined
      ? { defaultTimeoutMs: site.defaultTimeoutMs }
      : {}),
    ...(site.loginUrl ? { loginUrl: site.loginUrl } : {}),
    ...(site.profileName ? { profileName: site.profileName } : {}),
    siteId: site.siteId,
    ...(site.verifyUrl ? { verifyUrl: site.verifyUrl } : {}),
  };
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
