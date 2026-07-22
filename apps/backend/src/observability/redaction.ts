const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'html',
  'localStorage',
  'password',
  'profileDir',
  'profileDirectory',
  'profilePath',
  'screenshot',
  'screenshotBase64',
  'secret',
  'storageState',
  'token',
]);

const MAX_STRING_LENGTH = 512;
const MAX_ARRAY_LENGTH = 20;

export function redactDetails(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    return truncate(input);
  }
  if (typeof input !== 'object') {
    return input;
  }
  if (Buffer.isBuffer(input)) {
    return '[redacted:buffer]';
  }
  if (Array.isArray(input)) {
    return input.slice(0, MAX_ARRAY_LENGTH).map((item) => redactDetails(item));
  }
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? '[redacted]' : redactDetails(value),
    ]),
  );
}

function isSensitiveKey(key: string): boolean {
  return (
    SENSITIVE_KEYS.has(key) ||
    /authorization|bridge.?ticket|token|secret|cookie|password|session/i.test(
      key,
    )
  );
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
}
