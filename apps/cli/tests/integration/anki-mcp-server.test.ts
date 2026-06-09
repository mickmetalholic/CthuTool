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

  test('plugin manifest declares the Anki MCP server', async () => {
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
  });
});
