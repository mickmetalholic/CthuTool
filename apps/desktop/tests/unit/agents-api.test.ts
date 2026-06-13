import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchBrowserStatus } from '../../src/renderer/src/agents-api';

describe('agents api browser status', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('loads browser sites, profiles, and pending auth tasks from backend APIs', async () => {
    const fetch = vi.fn(async (url: string) => {
      const body = url.endsWith('/api/browser/sites')
        ? { sites: [{ siteId: 'custom' }] }
        : url.endsWith('/api/browser/profiles')
          ? { profiles: [{ profileName: 'custom-main' }] }
          : { tasks: [{ id: 'agent-1:custom:custom-main' }] };
      return {
        json: async () => body,
        ok: true,
      };
    });
    vi.stubGlobal('fetch', fetch);

    const status = await fetchBrowserStatus('http://backend.local:3000/');

    expect(fetch).toHaveBeenCalledWith(
      'http://backend.local:3000/api/browser/sites',
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://backend.local:3000/api/browser/profiles',
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://backend.local:3000/api/browser/pending-auth-tasks',
    );
    expect(status.sites).toEqual([{ siteId: 'custom' }]);
  });
});
