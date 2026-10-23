import { lstat, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  NotionClient,
  NotionError,
  rememberSecret,
} from '../../infra/dotfiles/notion-http';
import {
  assertNoLinks,
  privateRead,
  privateWrite,
} from '../../infra/dotfiles/private-store';
import { readSources } from '../../infra/dotfiles/source';
import type { DotfilesSystem } from '../../infra/dotfiles/system';
export type AuthInteraction = {
  hiddenToken: () => Promise<string | undefined>;
  chooseAuth: () => Promise<'reuse' | 'replace' | 'clear' | undefined>;
};
export const credentialPath = (system: DotfilesSystem) =>
  join(system.home, '.cthutool/credentials/notion.json');
export async function cachedToken(system: DotfilesSystem) {
  let value: string | undefined;
  try {
    value = await privateRead(credentialPath(system), system);
  } catch {
    throw new NotionError(
      'notion_cache_invalid',
      `Cannot read the private Notion cache at ${credentialPath(system)}. Run notion auth to clear it or correct its permissions.`,
    );
  }
  if (value === undefined) return undefined;
  let record: { version: number; token: string };
  try {
    record = JSON.parse(value);
  } catch {
    throw new NotionError(
      'notion_cache_invalid',
      'Invalid credential cache; run notion auth to clear it.',
    );
  }
  if (
    record.version !== 1 ||
    typeof record.token !== 'string' ||
    !record.token.trim()
  )
    throw new NotionError(
      'notion_cache_invalid',
      'Unsupported credential cache; run notion auth to clear it.',
    );
  return rememberSecret(record.token);
}
export async function ensureAuth(input: {
  system: DotfilesSystem;
  source: () => Promise<string>;
  interactive: boolean;
  interaction: AuthInteraction;
  manage?: boolean;
  env?: string;
}) {
  const { system, source, interactive, interaction, manage } = input;
  const env = input.env ?? process.env.NOTION_TOKEN;
  if (env) rememberSecret(env);
  // Clearing remains available without decoding an invalid cache or resolving source.
  if (manage && interactive) {
    let exists = !!env;
    if (!exists) {
      try {
        await lstat(credentialPath(system));
        exists = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    if (exists) {
      const action = await interaction.chooseAuth();
      if (!action)
        throw new NotionError(
          'cancelled',
          'Authentication cancelled; previous cache preserved.',
        );
      if (action === 'clear') {
        await assertNoLinks(dirname(credentialPath(system)), system.home);
        await rm(credentialPath(system), { force: true });
        return { cleared: true, environmentStillActive: !!env } as const;
      }
      if (action === 'replace') {
        if (env)
          throw new NotionError(
            'notion_environment_priority',
            'NOTION_TOKEN takes priority. Unset it before replacing the cached Token.',
          );
        return enter();
      }
    }
  }
  const cached = env ? undefined : await cachedToken(system);
  const token = env || cached;
  if (!token) return enter();
  const client = new NotionClient(
    token,
    await readSources(await source()),
    system.fetch,
  );
  try {
    await client.verify();
    return { client, credentialSource: env ? 'environment' : 'cache' } as const;
  } catch (e) {
    if (!env && interactive && e instanceof NotionError && e.status === 401)
      return enter();
    throw e;
  }
  async function enter() {
    if (!interactive)
      throw new NotionError(
        'notion_auth_required',
        'Notion Token missing. Set NOTION_TOKEN or run chc dotfiles notion auth in an interactive terminal.',
      );
    const raw = await interaction.hiddenToken();
    if (!raw?.trim())
      throw new NotionError(
        'cancelled',
        'Authentication cancelled; previous cache preserved.',
      );
    const token = rememberSecret(raw.trim());
    const client = new NotionClient(
      token,
      await readSources(await source()),
      system.fetch,
    );
    await client.verify();
    await privateWrite(
      credentialPath(system),
      `${JSON.stringify({ version: 1, token })}\n`,
      system,
    );
    return { client, credentialSource: 'cache' } as const;
  }
}
