import type { Sources } from './source';
import type { HttpFetch } from './system';
export class NotionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}
const secrets = new Set<string>();
export function rememberSecret(value: string) {
  if (value) secrets.add(value);
  return value;
}
export function redactSecrets(value: string) {
  let s = value;
  for (const token of secrets) s = s.split(token).join('[REDACTED]');
  return s.replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]');
}
export type NotionProperty = {
  id: string;
  type: string;
  title?: { plain_text?: string; text?: { content: string } }[];
  rich_text?: { plain_text?: string; text?: { content: string } }[];
  select?: { name: string } | null;
  status?: { name: string } | null;
  multi_select?: { name: string }[];
  url?: string | null;
  number?: number | null;
  relation?: { id: string }[];
  has_more?: boolean;
};
export type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};
export type NotionSchema = { properties: Record<string, { type: string }> };
export class NotionClient {
  constructor(
    private token: string,
    readonly config: Sources,
    private requestFetch: HttpFetch = fetch,
    private sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
    private now = Date.now,
  ) {
    rememberSecret(token);
  }
  async request<T>(path: string, body?: unknown): Promise<T> {
    const start = this.now();
    const budget = 30000;
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await this.requestFetch(
          `https://api.notion.com/v1/${path}`,
          {
            method: body === undefined ? 'GET' : 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Notion-Version': this.config.apiVersion,
              'Content-Type': 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(
              Math.max(1, budget - (this.now() - start)),
            ),
          },
        );
      } catch {
        throw new NotionError(
          'notion_transport',
          'Notion request timed out or could not connect; credentials were preserved.',
        );
      }
      if (response.ok) {
        try {
          return (await response.json()) as T;
        } catch {
          throw new NotionError(
            'notion_response',
            'Invalid Notion JSON response',
          );
        }
      }
      if (
        [429, 500, 502, 503, 504, 529].includes(response.status) &&
        attempt < 3
      ) {
        const header = response.headers.get('retry-after');
        const seconds =
          header === null ? Math.min(2 ** attempt, 8) : Number(header);
        const delay = Number.isFinite(seconds)
          ? Math.max(0, seconds * 1000)
          : Math.max(0, Date.parse(header ?? '') - this.now());
        if (!Number.isFinite(delay) || this.now() - start + delay >= budget)
          throw new NotionError(
            'notion_rate_limited',
            'Notion requested a wait beyond this request budget; retry later.',
            response.status,
          );
        await response.body?.cancel();
        await this.sleep(delay);
        continue;
      }
      // Do not print upstream bodies: they may reflect Authorization or request contents.
      const code =
        response.status === 401
          ? 'notion_auth_required'
          : response.status === 403 || response.status === 404
            ? 'notion_permission'
            : response.status === 429 || response.status >= 500
              ? 'notion_rate_limited'
              : 'notion_response';
      throw new NotionError(
        code,
        `Notion HTTP ${response.status} reading ${path.split('?')[0]}. ${code === 'notion_permission' ? 'Grant the integration read access to every configured data source.' : code === 'notion_auth_required' ? 'Run chc dotfiles notion auth or set NOTION_TOKEN.' : 'Retry after checking API availability.'}`,
        response.status,
      );
    }
  }
  async verify() {
    await this.request('users/me');
    for (const id of Object.values(this.config.sources))
      await this.metadata(id);
  }
  metadata(id: string) {
    return this.request<NotionSchema>(`data_sources/${id}`);
  }
  async pages(id: string) {
    const pages: NotionPage[] = [];
    let cursor: string | undefined;
    const cursors = new Set<string>();
    do {
      const page = await this.request<{
        results: NotionPage[];
        has_more: boolean;
        next_cursor?: string;
      }>(`data_sources/${id}/query`, {
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      if (!Array.isArray(page.results))
        throw new NotionError('notion_response', 'Invalid query results');
      pages.push(...page.results);
      cursor = page.has_more ? page.next_cursor : undefined;
      if (page.has_more && (!cursor || cursors.has(cursor)))
        throw new NotionError(
          'notion_response',
          'Invalid/repeated query cursor',
        );
      if (cursor) cursors.add(cursor);
    } while (cursor);
    for (const page of pages)
      for (const p of Object.values(page.properties))
        if (p.type === 'relation' && p.has_more) {
          if (
            !/^[A-Za-z0-9%._~!$&'()*+,;=:@+-]+$/.test(p.id) ||
            p.id === '.' ||
            p.id === '..'
          )
            throw new NotionError(
              'notion_response',
              'Invalid relation property ID',
            );
          // Notion returns URL-encoded property IDs; preserve them without a second encoding.
          const ids: { id: string }[] = [];
          let next: string | undefined;
          const seen = new Set<string>();
          do {
            const q = new URLSearchParams({
              page_size: '100',
              ...(next ? { start_cursor: next } : {}),
            });
            const result = await this.request<{
              results: { relation: { id: string } }[];
              has_more: boolean;
              next_cursor?: string;
            }>(`pages/${page.id}/properties/${p.id}?${q}`);
            ids.push(...result.results.map((r) => r.relation));
            next = result.has_more ? result.next_cursor : undefined;
            if (result.has_more && (!next || seen.has(next)))
              throw new NotionError(
                'notion_response',
                'Invalid/repeated relation cursor',
              );
            if (next) seen.add(next);
          } while (next);
          p.relation = ids;
          p.has_more = false;
        }
    return pages;
  }
}
