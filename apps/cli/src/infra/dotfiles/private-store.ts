import { randomUUID } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { DotfilesSystem } from './system';
import { checkedRun } from './system';

export async function assertNoLinks(path: string, root: string) {
  const rel = relative(resolve(root), resolve(path));
  if (rel.startsWith(`..${sep}`) || rel === '..')
    throw new Error('Private storage must remain under the user home');
  let current = resolve(root);
  for (const part of ['', ...rel.split(sep).filter(Boolean)]) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing linked private storage: ${current}`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
}
async function protect(
  path: string,
  system: DotfilesSystem,
  directory: boolean,
  verifyOnly = false,
) {
  if (system.os !== 'windows') {
    await chmod(path, directory ? 0o700 : 0o600);
    return;
  }
  // Replace the ACL rather than merely adding an allow ACE to an inherited ACL.
  const setup = `$acl=Get-Acl -LiteralPath $p;$acl.SetOwner($sid);$acl.SetAccessRuleProtection($true,$false);foreach($r in @($acl.Access)){$acl.RemoveAccessRuleSpecific($r)};$inherit=if((Get-Item -LiteralPath $p).PSIsContainer){[Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'}else{[Security.AccessControl.InheritanceFlags]::None};$rule=[Security.AccessControl.FileSystemAccessRule]::new($sid,'FullControl',$inherit,'None','Allow');$acl.AddAccessRule($rule);Set-Acl -LiteralPath $p -AclObject $acl;`;
  const script = `$ErrorActionPreference='Stop';$p=$env:CTHU_PRIVATE_PATH;$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User;${verifyOnly ? '' : setup}$a=Get-Acl -LiteralPath $p;if($a.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $sid.Value){throw 'Unexpected private storage owner'};foreach($r in $a.Access){if($r.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $sid.Value){throw 'Unexpected ACL principal'}};if(-not $a.AreAccessRulesProtected){throw 'ACL inheritance is enabled'}`;
  await checkedRun(
    system,
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { env: { ...process.env, CTHU_PRIVATE_PATH: path } },
  );
}
export async function privateDirectory(path: string, system: DotfilesSystem) {
  await assertNoLinks(path, system.home);
  await mkdir(path, { recursive: true, mode: 0o700 });
  // Restrict every private ancestor too, including preexisting directories.
  let current = path;
  while (current !== system.home && relative(system.home, current) !== '..') {
    await protect(current, system, true);
    if (current === join(system.home, '.cthutool')) break;
    current = dirname(current);
  }
}
export async function privateWrite(
  path: string,
  value: string | Uint8Array,
  system: DotfilesSystem,
  replace: typeof rename = rename,
) {
  await privateDirectory(dirname(path), system);
  await assertNoLinks(path, system.home);
  const temp = `${path}.tmp-${randomUUID()}`;
  try {
    const handle = await open(temp, 'wx', 0o600);
    try {
      await protect(temp, system, false);
      await handle.writeFile(value);
      await handle.sync();
    } finally {
      await handle.close();
    }
    // No delete-and-retry fallback: a failed replacement must retain the old file.
    await replace(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
}
export async function privateRead(path: string, system: DotfilesSystem) {
  await assertNoLinks(path, system.home);
  try {
    const info = await lstat(path);
    if (!info.isFile()) throw new Error('Private cache is not a regular file');
    for (const p of [path, dirname(path)]) {
      const st = await lstat(p);
      if (
        system.os !== 'windows' &&
        ((st.mode & 0o077) !== 0 ||
          (process.getuid && st.uid !== process.getuid()))
      )
        throw new Error(`Private storage permissions are unsafe: ${p}`);
    }
    if (system.os === 'windows') {
      await protect(dirname(path), system, true, true);
      await protect(path, system, false, true);
    }
    return await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw e;
  }
}
