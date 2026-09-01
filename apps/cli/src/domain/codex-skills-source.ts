export type GitHubSkillSource = {
  readonly kind: 'github';
  readonly repository: string;
  readonly ref?: string;
  readonly subpath?: string;
  readonly locator: string;
};

export type SkillSource = GitHubSkillSource;

export class SkillSourceError extends Error {
  readonly code = 'unsupported-source';

  constructor(message: string) {
    super(message);
    this.name = 'SkillSourceError';
  }
}

export function parseSkillSource(input: string): SkillSource {
  const value = input.trim();
  if (value.length === 0) {
    throw new SkillSourceError('A skill source is required.');
  }

  if (isGitHubShorthand(value)) {
    return {
      kind: 'github',
      repository: normalizeRepository(value),
      locator: normalizeRepository(value),
    };
  }

  if (looksLikeUrl(value)) {
    return parseGitHubUrl(value);
  }

  if (looksLikeGitTransport(value)) {
    throw unsupportedSource(value);
  }

  throw unsupportedSource(value);
}

export function formatSkillSource(source: GitHubSkillSource): string {
  return source.locator;
}

function parseGitHubUrl(value: string): GitHubSkillSource {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw unsupportedSource(value);
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'github.com' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw unsupportedSource(value);
  }

  const segments = url.pathname
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => decodeSegment(segment, value));
  if (segments.length < 2) {
    throw unsupportedSource(value);
  }

  const owner = segments[0];
  const repositoryName = segments[1].replace(/\.git$/u, '');
  const repository = normalizeRepository(`${owner}/${repositoryName}`);
  if (segments.length === 2) {
    return {
      kind: 'github',
      repository,
      locator: repository,
    };
  }

  if (segments[2] !== 'tree' || segments.length < 4) {
    throw unsupportedSource(value);
  }
  const ref = validatePathSegment(segments[3], 'GitHub ref', value);
  const subpath = segments.slice(4).join('/');
  if (subpath.length > 0) {
    validateRelativePath(subpath, 'GitHub tree path', value);
  }
  const encodedRef = encodeURIComponent(ref);
  const locator = subpath
    ? `https://github.com/${repository}/tree/${encodedRef}/${subpath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')}`
    : `https://github.com/${repository}/tree/${encodedRef}`;
  return {
    kind: 'github',
    repository,
    ref,
    ...(subpath ? { subpath } : {}),
    locator,
  };
}

function isGitHubShorthand(value: string): boolean {
  return (
    /^[^/\s]+\/[^/\s]+$/u.test(value) &&
    !value.includes('..') &&
    !value.includes(':') &&
    !value.includes('@') &&
    !value.startsWith('.') &&
    !value.startsWith('/')
  );
}

function normalizeRepository(value: string): string {
  const repository = value.replace(/\.git$/u, '').trim();
  if (!/^[^/\s]+\/[^/\s]+$/u.test(repository) || repository.includes('..')) {
    throw unsupportedSource(value);
  }
  return repository;
}

function validatePathSegment(
  value: string,
  label: string,
  original: string,
): string {
  if (!value || value === '.' || value === '..' || value.includes('\\')) {
    throw new SkillSourceError(`${label} is invalid in source: ${original}`);
  }
  return value;
}

function validateRelativePath(
  value: string,
  label: string,
  original: string,
): void {
  const segments = value.split('/');
  if (
    value.startsWith('/') ||
    segments.some(
      (segment) => segment.length === 0 || segment === '.' || segment === '..',
    ) ||
    value.includes('\\')
  ) {
    throw new SkillSourceError(`${label} is invalid in source: ${original}`);
  }
}

function decodeSegment(value: string, original: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new SkillSourceError(`Invalid URL encoding in source: ${original}`);
  }
}

function looksLikeUrl(value: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\//iu.test(value);
}

function looksLikeGitTransport(value: string): boolean {
  return /^(?:git@|git\+|git:|ssh:|file:|[^/\s]+@[^/\s]+:)/iu.test(value);
}

function unsupportedSource(value: string): SkillSourceError {
  return new SkillSourceError(
    `Unsupported skill source "${value}". Supported forms are GitHub owner/repo, a GitHub repository URL, or a GitHub tree URL. Local paths, GitLab, and arbitrary Git URLs are not supported. Use the repository-owned codex-skill-promoter skill for locally authored or Hermes-absorbed skills.`,
  );
}
