import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  digest,
  GENERATED_FILES,
  MANIFEST,
  parseCatalog,
  TRANSACTION,
  validateManifest,
  validateSnapshotReferences,
} from './source';
import { readOptional } from './system';

const allowed = [...GENERATED_FILES, MANIFEST];
type Item = { path: string; before: string; after: string };
type Journal = { version: 1; items: Item[] };
async function durableWrite(path: string, text: string) {
  const f = await open(path, 'wx', 0o600);
  try {
    await f.writeFile(text);
    await f.sync();
  } finally {
    await f.close();
  }
}
export async function withSourceLock<T>(
  source: string,
  fn: () => Promise<T>,
): Promise<T> {
  const path = join(source, 'dotfiles/notion/.sync-lock');
  const owner = JSON.stringify({ pid: process.pid, nonce: randomUUID() });
  try {
    await mkdir(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error(`Unsafe source lock: ${path}`);
    const oldOwner = await readFile(join(path, 'owner.json'), 'utf8');
    const old = JSON.parse(oldOwner);
    let alive = true;
    try {
      process.kill(old.pid, 0);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ESRCH') alive = false;
    }
    if (alive)
      throw new Error(
        `Notion source is busy (PID ${old.pid}). Do not remove an active writer's lock.`,
      );
    const claim = join(path, 'takeover');
    try {
      await mkdir(claim);
    } catch {
      throw new Error(
        'Another process is checking a stale source lock; retry later.',
      );
    }
    if ((await readFile(join(path, 'owner.json'), 'utf8')) !== oldOwner) {
      await rm(claim, { recursive: true });
      throw new Error(
        'Source lock changed during stale-lock recovery; retry later.',
      );
    }
    const stale = `${path}.stale-${randomUUID()}`;
    await rename(path, stale);
    try {
      await mkdir(path);
    } catch (error) {
      await rm(stale, { recursive: true, force: true });
      throw error;
    }
    await rm(stale, { recursive: true });
  }
  await durableWrite(join(path, 'owner.json'), owner);
  try {
    return await fn();
  } finally {
    if ((await readOptional(join(path, 'owner.json'))) === owner)
      await rm(path, { recursive: true });
  }
}
export async function recoverTransaction(source: string) {
  const dir = join(source, TRANSACTION);
  let info: Awaited<ReturnType<typeof lstat>>;
  try {
    info = await lstat(dir);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw e;
  }
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error(`Unsafe transaction directory: ${dir}`);
  const j: Journal = JSON.parse(
    await readFile(join(dir, 'journal.json'), 'utf8'),
  );
  if (
    j.version !== 1 ||
    j.items.length !== allowed.length ||
    j.items.some(
      (it, i) =>
        it.path !== allowed[i] ||
        !/^[a-f0-9]{64}$/.test(it.before) ||
        !/^[a-f0-9]{64}$/.test(it.after),
    )
  )
    throw new Error(`Invalid recovery material; inspect ${dir}`);
  const backups: Record<string, string> = {};
  for (const [i, item] of j.items.entries()) {
    const old = await readFile(join(dir, `${i}.before`), 'utf8');
    if (digest(old) !== item.before)
      throw new Error(`Backup digest mismatch; preserve ${dir}`);
    backups[item.path] = old;
    const current = await readOptional(join(source, item.path));
    if (
      current === undefined ||
      ![item.before, item.after].includes(digest(current))
    )
      throw new Error(
        `Recovery conflicts with local edits to ${item.path}; preserve and inspect ${dir}`,
      );
  }
  const catalog = parseCatalog(backups);
  const m = validateManifest(JSON.parse(backups[MANIFEST]));
  validateSnapshotReferences(catalog, m);
  for (const f of GENERATED_FILES)
    if (m.files[f] !== digest(backups[f]))
      throw new Error(`Previous generation is invalid; inspect ${dir}`);
  // Validate every target before restoring any. Manifest is last in allowed.
  for (const [i, item] of j.items.entries()) {
    if ((await lstat(join(source, item.path))).isSymbolicLink())
      throw new Error(`Recovery target is linked: ${item.path}`);
    const target = join(source, item.path);
    const temp = `${target}.restore-${randomUUID()}`;
    await durableWrite(temp, backups[item.path]);
    try {
      await rename(temp, target);
    } finally {
      await rm(temp, { force: true });
    }
    void i;
  }
  await rm(dir, { recursive: true });
  return true;
}
export async function publishSnapshot(
  source: string,
  files: Record<string, string>,
  baseline: Record<string, string>,
  fault?: (index: number) => void,
) {
  if (Object.keys(files).sort().join() !== [...allowed].sort().join())
    throw new Error('Publication outside generated-file allowlist');
  const dir = join(source, TRANSACTION);
  await mkdir(dir, { mode: 0o700 });
  const journal: Journal = { version: 1, items: [] };
  let ready = false;
  try {
    for (const [i, path] of allowed.entries()) {
      const before = await readFile(join(source, path), 'utf8');
      if (before !== baseline[path])
        throw new Error(`Source changed since review: ${path}`);
      if ((await lstat(join(source, path))).isSymbolicLink())
        throw new Error(`Linked generated target: ${path}`);
      await durableWrite(join(dir, `${i}.before`), before);
      await durableWrite(join(dir, `${i}.after`), files[path]);
      journal.items.push({
        path,
        before: digest(before),
        after: digest(files[path]),
      });
    }
    await durableWrite(join(dir, 'journal.json'), JSON.stringify(journal));
    ready = true;
    for (const [i, path] of allowed.entries()) {
      if ((await readFile(join(source, path), 'utf8')) !== baseline[path])
        throw new Error(`Concurrent source edit: ${path}`);
      fault?.(i);
      await rename(join(dir, `${i}.after`), join(source, path));
    }
    await rm(dir, { recursive: true });
  } catch (error) {
    if (ready) {
      try {
        await recoverTransaction(source);
      } catch (recovery) {
        throw new Error(
          `Publication failed and recovery needs attention: ${String(recovery)}. Backups: ${dir}`,
        );
      }
    } else await rm(dir, { recursive: true });
    throw error;
  }
}
