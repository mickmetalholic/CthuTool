import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export function createWorktreeSourceId(path: string): string {
  const digest = createHash('sha256')
    .update(normalizeSourcePath(path))
    .digest('hex')
    .slice(0, 12);
  return `worktree:${digest}`;
}

export function normalizeSourcePath(path: string): string {
  const normalized = resolve(path);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function sameSourcePath(left: string, right: string): boolean {
  return normalizeSourcePath(left) === normalizeSourcePath(right);
}
