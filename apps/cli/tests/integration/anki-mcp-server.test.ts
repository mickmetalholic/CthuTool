import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const serverPath = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
  'scripts',
  'anki-mcp-server.mjs',
);

type RecordedRequest = {
  readonly action: string;
  readonly version: number;
  readonly params?: unknown;
};

async function loadServerModule() {
  return await import(`${pathToFileURL(serverPath).href}?t=${Date.now()}`);
}

function createMockFetch(
  handler: (request: RecordedRequest) => unknown | Promise<unknown>,
) {
  const requests: RecordedRequest[] = [];
  const fetchFn = async (_url: string, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body ?? '{}')) as RecordedRequest;
    requests.push(request);
    const result = await handler(request);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetchFn, requests };
}

describe('CthuCodex Anki MCP server tools', () => {
  test('checks AnkiConnect status through version', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      expect(request.action).toBe('version');
      return { result: 6, error: null };
    });

    const tools = createAnkiTools({ fetchFn });
    const result = await tools.cthu_anki_status({});

    expect(result).toEqual({
      ok: true,
      endpoint: 'http://127.0.0.1:8765',
      version: 6,
    });
    expect(requests).toHaveLength(1);
  });

  test('rejects malformed note validation before AnkiConnect call', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch(() => {
      throw new Error('should not be called');
    });

    const tools = createAnkiTools({ fetchFn });
    const result = await tools.cthu_anki_validate_notes({
      notes: [{ deckName: 'Default', modelName: 'Basic' }],
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('invalid_notes');
    expect(requests).toHaveLength(0);
  });

  test('reads schema searches notes gets details and stores media', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      if (request.action === 'deckNames') {
        return { result: ['Default'], error: null };
      }
      if (request.action === 'modelNames') {
        return { result: ['Basic'], error: null };
      }
      if (request.action === 'getTags') {
        return { result: ['cthu'], error: null };
      }
      if (request.action === 'modelFieldNames') {
        return { result: ['Front', 'Back'], error: null };
      }
      if (request.action === 'modelFieldsOnTemplates') {
        return { result: { Card: [['Front'], ['Back']] }, error: null };
      }
      if (request.action === 'findNotes') {
        return { result: [301], error: null };
      }
      if (request.action === 'notesInfo') {
        return {
          result: [{ noteId: 301, modelName: 'Basic', tags: ['cthu'] }],
          error: null,
        };
      }
      if (request.action === 'storeMediaFile') {
        return { result: 'image.png', error: null };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });

    const tools = createAnkiTools({ fetchFn });

    await expect(
      tools.cthu_anki_collection_schema({ noteTypes: ['Basic', 'Missing'] }),
    ).resolves.toMatchObject({
      ok: true,
      decks: ['Default'],
      tags: ['cthu'],
      missingNoteTypes: ['Missing'],
      noteTypes: [
        {
          name: 'Basic',
          fields: ['Front', 'Back'],
          templateFields: { Card: [['Front'], ['Back']] },
        },
      ],
    });
    await expect(
      tools.cthu_anki_find_notes({ query: 'deck:Default' }),
    ).resolves.toMatchObject({ ok: true, noteIds: [301] });
    await expect(
      tools.cthu_anki_get_notes({ noteIds: [301] }),
    ).resolves.toEqual({
      ok: true,
      notes: [{ noteId: 301, modelName: 'Basic', tags: ['cthu'] }],
    });
    await expect(
      tools.cthu_anki_store_media({ filename: 'image.png', data: 'aW1n' }),
    ).resolves.toEqual({ ok: true, filename: 'image.png' });
    expect(requests.map((request) => request.action)).toEqual([
      'deckNames',
      'modelNames',
      'getTags',
      'modelFieldNames',
      'modelFieldsOnTemplates',
      'findNotes',
      'notesInfo',
      'storeMediaFile',
    ]);
  });

  test('validates creates and opens notes when requested', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      if (request.action === 'canAddNotes') {
        return { result: [true, true], error: null };
      }
      if (request.action === 'addNotes') {
        return { result: [101, 102], error: null };
      }
      if (request.action === 'guiBrowse') {
        return { result: [101, 102], error: null };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });

    const tools = createAnkiTools({ fetchFn });
    const result = await tools.cthu_anki_add_notes({
      openAfterCreate: true,
      notes: [
        {
          deckName: 'Default',
          modelName: 'Basic',
          fields: { Front: 'front 1', Back: 'back 1' },
        },
        {
          deckName: 'Default',
          modelName: 'Basic',
          fields: { Front: 'front 2', Back: 'back 2' },
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([
      { index: 0, ok: true, noteId: 101 },
      { index: 1, ok: true, noteId: 102 },
    ]);
    expect(result.openResult).toMatchObject({ ok: true });
    expect(requests.map((request) => request.action)).toEqual([
      'canAddNotes',
      'addNotes',
      'guiBrowse',
    ]);
    expect(requests[2]?.params).toEqual({
      query: 'nid:101 OR nid:102',
    });
  });

  test('keeps created notes successful when browser opening fails', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn } = createMockFetch((request) => {
      if (request.action === 'canAddNotes') {
        return { result: [true], error: null };
      }
      if (request.action === 'addNotes') {
        return { result: [201], error: null };
      }
      if (request.action === 'guiBrowse') {
        return { result: null, error: 'browser unavailable' };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });

    const tools = createAnkiTools({ fetchFn });
    const result = await tools.cthu_anki_add_notes({
      openAfterCreate: true,
      notes: [
        {
          deckName: 'Default',
          modelName: 'Basic',
          fields: { Front: 'front', Back: 'back' },
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([{ index: 0, ok: true, noteId: 201 }]);
    expect(result.warnings[0]).toContain('browser unavailable');
  });

  test('rejects malformed and oversized note updates before AnkiConnect calls', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch(() => {
      throw new Error('should not be called');
    });
    const tools = createAnkiTools({ fetchFn, maxBatchSize: 1 });

    const malformed = await tools.cthu_anki_update_notes({
      updates: [{ noteId: 101 }],
    });
    const oversized = await tools.cthu_anki_update_notes({
      updates: [
        { noteId: 101, fields: { Front: 'new front' } },
        { noteId: 102, fields: { Front: 'another front' } },
      ],
    });

    expect(malformed).toMatchObject({
      ok: false,
      error: { code: 'invalid_updates' },
    });
    expect(oversized).toMatchObject({
      ok: false,
      error: { code: 'invalid_updates', maxBatchSize: 1 },
    });
    expect(requests).toHaveLength(0);
  });

  test('rejects stale note updates before mutation calls', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      expect(request.action).toBe('notesInfo');
      return {
        result: [
          {
            noteId: 301,
            modelName: 'Japanese Sentence',
            fields: {
              文: { value: 'current sentence', order: 0 },
              訳: { value: 'current translation', order: 2 },
            },
          },
        ],
        error: null,
      };
    });
    const tools = createAnkiTools({ fetchFn });

    const result = await tools.cthu_anki_update_notes({
      updates: [
        {
          noteId: 301,
          fields: { 文: 'new sentence' },
          expectedFields: {
            文: 'previewed sentence',
            訳: 'current translation',
          },
        },
      ],
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'stale_note',
        noteId: 301,
        fieldName: '文',
        expected: 'previewed sentence',
        actual: 'current sentence',
      },
    });
    expect(requests.map((request) => request.action)).toEqual(['notesInfo']);
  });

  test('updates requested fields and opens updated notes', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      if (request.action === 'notesInfo') {
        return {
          result: [
            {
              noteId: 401,
              modelName: 'Japanese Sentence',
              tags: ['existing'],
              fields: {
                文: { value: 'old sentence', order: 0 },
                ヒント: { value: 'grammar', order: 1 },
                訳: { value: 'English translation', order: 2 },
                メモ: { value: 'memo', order: 3 },
              },
            },
          ],
          error: null,
        };
      }
      if (request.action === 'updateNoteFields') {
        return { result: null, error: null };
      }
      if (request.action === 'guiBrowse') {
        return { result: [401], error: null };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });
    const tools = createAnkiTools({ fetchFn });

    const result = await tools.cthu_anki_update_notes({
      updates: [
        {
          noteId: 401,
          fields: { 文: 'new sentence' },
          expectedFields: {
            文: 'old sentence',
            訳: 'English translation',
          },
        },
      ],
      openAfterUpdate: true,
    });

    expect(result).toMatchObject({
      ok: true,
      partial: false,
      results: [
        {
          index: 0,
          noteId: 401,
          ok: true,
          fields: { ok: true },
        },
      ],
      openResult: { ok: true, openedNoteIds: [401] },
    });
    expect(requests.map((request) => request.action)).toEqual([
      'notesInfo',
      'updateNoteFields',
      'guiBrowse',
    ]);
    expect(requests[1]?.params).toEqual({
      note: { id: 401, fields: { 文: 'new sentence' } },
    });
  });

  test('reports field partial failures and caps Browser opening', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn, requests } = createMockFetch((request) => {
      const params = request.params as {
        note?: { id?: number };
      };
      if (request.action === 'notesInfo') {
        return {
          result: [501, 502, 503].map((noteId) => ({
            noteId,
            fields: { 文: { value: `old ${noteId}`, order: 0 } },
          })),
          error: null,
        };
      }
      if (request.action === 'updateNoteFields') {
        if (params.note?.id === 502) {
          return { result: null, error: 'field update failed' };
        }
        return { result: null, error: null };
      }
      if (request.action === 'guiBrowse') {
        return { result: [501], error: null };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });
    const tools = createAnkiTools({ fetchFn, maxBatchSize: 3 });

    const result = await tools.cthu_anki_update_notes({
      updates: [501, 502, 503].map((noteId) => ({
        noteId,
        fields: { 文: `new ${noteId}` },
        expectedFields: { 文: `old ${noteId}` },
      })),
      openAfterUpdate: true,
      browserOpenLimit: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.partial).toBe(true);
    expect(result.results).toMatchObject([
      {
        noteId: 501,
        ok: true,
        fields: { ok: true },
      },
      {
        noteId: 502,
        ok: false,
        fields: {
          ok: false,
          error: { code: 'anki_connect_error' },
        },
      },
      {
        noteId: 503,
        ok: true,
        fields: { ok: true },
      },
    ]);
    expect(result.openResult).toMatchObject({
      ok: true,
      openedNoteIds: [501],
    });
    expect(result.warnings[0]).toContain('capped at 1 of 2 notes');
    expect(requests.at(-1)?.params).toEqual({ query: 'nid:501' });
  });

  test('keeps note updates successful when Browser opening fails', async () => {
    const { createAnkiTools } = await loadServerModule();
    const { fetchFn } = createMockFetch((request) => {
      if (request.action === 'notesInfo') {
        return {
          result: [
            {
              noteId: 601,
              fields: { Front: { value: 'old', order: 0 } },
            },
          ],
          error: null,
        };
      }
      if (request.action === 'updateNoteFields') {
        return { result: null, error: null };
      }
      if (request.action === 'guiBrowse') {
        return { result: null, error: 'browser unavailable' };
      }
      throw new Error(`Unexpected action: ${request.action}`);
    });
    const tools = createAnkiTools({ fetchFn });

    const result = await tools.cthu_anki_update_notes({
      updates: [
        {
          noteId: 601,
          fields: { Front: 'new' },
          expectedFields: { Front: 'old' },
        },
      ],
      openAfterUpdate: true,
    });

    expect(result.ok).toBe(true);
    expect(result.results[0]).toMatchObject({
      ok: true,
      fields: { ok: true },
    });
    expect(result.openResult.ok).toBe(false);
    expect(result.warnings[0]).toContain('browser unavailable');
  });

  test('lists MCP tools through stdio JSON-RPC', async () => {
    const proc = Bun.spawn(['node', serverPath], {
      cwd: repoRoot,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    proc.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })}\n`,
    );
    proc.stdin.end();

    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;
    const response = JSON.parse(out.trim());

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(
      response.result.tools.map((tool: { name: string }) => tool.name),
    ).toEqual([
      'cthu_anki_status',
      'cthu_anki_collection_schema',
      'cthu_anki_find_notes',
      'cthu_anki_get_notes',
      'cthu_anki_validate_notes',
      'cthu_anki_add_notes',
      'cthu_anki_update_notes',
      'cthu_anki_store_media',
      'cthu_anki_open_notes',
    ]);
  });

  test('responds to stdio messages before stdin closes', async () => {
    const proc = Bun.spawn(['node', serverPath], {
      cwd: repoRoot,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    proc.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })}\n`,
    );

    const reader = proc.stdout.getReader();
    const read = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timed out waiting for MCP reply')),
          1000,
        ),
      ),
    ]);
    proc.kill();
    proc.stdin.end();

    const text = new TextDecoder().decode(read.value);
    const response = JSON.parse(text.trim());
    expect(response.result.tools[0].name).toBe('cthu_anki_status');
  });

  test('plugin manifest declares separate Anki and language-feedback MCP servers', async () => {
    const pluginRoot = join(repoRoot, 'codex', 'plugins', 'cthu-codex');
    const manifest = JSON.parse(
      await readFile(join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    );
    const mcpConfig = JSON.parse(
      await readFile(join(pluginRoot, '.mcp.json'), 'utf8'),
    );

    expect(manifest.interface.capabilities).toContain('Hooks');
    expect(manifest.interface.capabilities).toContain('MCP');
    expect(manifest.mcpServers).toBe('./.mcp.json');
    expect(mcpConfig.mcpServers.anki.command).toBe('node');
    expect(mcpConfig.mcpServers.anki.args).toEqual([
      './scripts/anki-mcp-server.mjs',
    ]);
    expect(mcpConfig.mcpServers['language-feedback']).toEqual({
      command: 'node',
      args: ['./scripts/language-feedback-mcp-server.mjs'],
      startup_timeout_sec: 10,
      tool_timeout_sec: 30,
    });
  });
});
