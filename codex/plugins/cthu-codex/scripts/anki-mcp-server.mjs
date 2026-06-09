import { fileURLToPath } from 'node:url';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:8765';
const ANKI_CONNECT_VERSION = 6;
const DEFAULT_MAX_BATCH_SIZE = 20;
const DEFAULT_BROWSER_OPEN_LIMIT = 20;
const MAX_BROWSER_OPEN_LIMIT = 50;

const TOOL_DEFINITIONS = [
  {
    name: 'cthu_anki_status',
    description: 'Check whether the local AnkiConnect service is reachable.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_collection_schema',
    description:
      'Read decks, note types, note fields, template field usage, and tags from the Anki collection.',
    inputSchema: {
      type: 'object',
      properties: {
        noteTypes: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_find_notes',
    description: 'Find Anki note IDs with an Anki browser search query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_get_notes',
    description: 'Read Anki note details by note ID.',
    inputSchema: {
      type: 'object',
      properties: {
        noteIds: {
          type: 'array',
          items: { type: 'number' },
        },
      },
      required: ['noteIds'],
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_validate_notes',
    description: 'Validate candidate notes with AnkiConnect before writing.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['notes'],
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_add_notes',
    description:
      'Validate and add notes to Anki, optionally opening created notes in the Browser.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'object' },
        },
        openAfterCreate: { type: 'boolean' },
        browserOpenLimit: { type: 'number' },
      },
      required: ['notes'],
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_store_media',
    description: 'Store a media file in Anki for note fields to reference.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        data: { type: 'string' },
        content: { type: 'string' },
        path: { type: 'string' },
        url: { type: 'string' },
        deleteExisting: { type: 'boolean' },
        skipHash: { type: 'string' },
      },
      required: ['filename'],
      additionalProperties: false,
    },
  },
  {
    name: 'cthu_anki_open_notes',
    description: 'Open existing Anki notes in the Browser by note ID.',
    inputSchema: {
      type: 'object',
      properties: {
        noteIds: {
          type: 'array',
          items: { type: 'number' },
        },
        limit: { type: 'number' },
      },
      required: ['noteIds'],
      additionalProperties: false,
    },
  },
];

class AnkiConnectError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'AnkiConnectError';
    this.details = details;
  }
}

export function createAnkiTools(options = {}) {
  const endpoint =
    options.endpoint ??
    process.env.CTHU_ANKI_CONNECT_URL ??
    process.env.ANKI_CONNECT_URL ??
    DEFAULT_ENDPOINT;
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
  const defaultBrowserOpenLimit =
    options.browserOpenLimit ?? DEFAULT_BROWSER_OPEN_LIMIT;

  const invoke = async (action, params) =>
    invokeAnkiConnect({ endpoint, fetchFn, action, params });

  return {
    async cthu_anki_status() {
      try {
        const version = await invoke('version');
        return { ok: true, endpoint, version };
      } catch (error) {
        return {
          ok: false,
          endpoint,
          error: summarizeError(error),
        };
      }
    },

    async cthu_anki_collection_schema(args = {}) {
      const requestedNoteTypes = Array.isArray(args.noteTypes)
        ? args.noteTypes.filter((name) => typeof name === 'string')
        : undefined;
      const [decks, models, tags] = await Promise.all([
        invoke('deckNames'),
        invoke('modelNames'),
        invoke('getTags'),
      ]);
      const modelNames = Array.isArray(models) ? models : [];
      const selectedModels = requestedNoteTypes ?? modelNames;
      const missingNoteTypes = selectedModels.filter(
        (name) => !modelNames.includes(name),
      );
      const presentModels = selectedModels.filter((name) =>
        modelNames.includes(name),
      );
      const noteTypes = [];

      for (const modelName of presentModels) {
        const [fields, templateFields] = await Promise.all([
          invoke('modelFieldNames', { modelName }),
          invoke('modelFieldsOnTemplates', { modelName }).catch((error) => ({
            error: summarizeError(error),
          })),
        ]);
        noteTypes.push({ name: modelName, fields, templateFields });
      }

      return {
        ok: true,
        decks,
        noteTypes,
        tags,
        missingNoteTypes,
      };
    },

    async cthu_anki_find_notes(args = {}) {
      const query = requireString(args.query, 'query');
      const noteIds = await invoke('findNotes', { query });
      return { ok: true, query, noteIds };
    },

    async cthu_anki_get_notes(args = {}) {
      const notes = validateNoteIds(args.noteIds);
      const result = await invoke('notesInfo', { notes });
      return { ok: true, notes: result };
    },

    async cthu_anki_validate_notes(args = {}) {
      const validation = validateNotes(args.notes, maxBatchSize);
      if (!validation.ok) {
        return validation;
      }

      const results = await invoke('canAddNotes', { notes: validation.notes });
      return {
        ok: true,
        results: normalizeValidationResults(results),
      };
    },

    async cthu_anki_add_notes(args = {}) {
      const validation = validateNotes(args.notes, maxBatchSize);
      if (!validation.ok) {
        return validation;
      }

      const canAddResults = normalizeValidationResults(
        await invoke('canAddNotes', { notes: validation.notes }),
      );
      const failedValidation = canAddResults.filter((result) => !result.ok);
      if (failedValidation.length > 0) {
        return {
          ok: false,
          error: {
            code: 'validation_failed',
            message: 'One or more notes cannot be added.',
          },
          results: canAddResults,
        };
      }

      const noteIds = await invoke('addNotes', { notes: validation.notes });
      const results = normalizeAddResults(noteIds);
      const response = { ok: true, results, warnings: [] };

      if (args.openAfterCreate === true) {
        const createdNoteIds = results
          .filter((result) => result.ok)
          .map((result) => result.noteId);
        const openResult = await openNotes({
          invoke,
          noteIds: createdNoteIds,
          limit: args.browserOpenLimit ?? defaultBrowserOpenLimit,
        });
        response.openResult = openResult;
        if (openResult.warning) {
          response.warnings.push(openResult.warning);
        }
        if (!openResult.ok && openResult.error?.message) {
          response.warnings.push(openResult.error.message);
        }
      }

      return response;
    },

    async cthu_anki_store_media(args = {}) {
      const params = validateMediaPayload(args);
      const result = await invoke('storeMediaFile', params);
      return { ok: true, filename: result ?? params.filename };
    },

    async cthu_anki_open_notes(args = {}) {
      const noteIds = validateNoteIds(args.noteIds);
      return await openNotes({
        invoke,
        noteIds,
        limit: args.limit ?? defaultBrowserOpenLimit,
      });
    },
  };
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

async function invokeAnkiConnect({ endpoint, fetchFn, action, params }) {
  if (typeof fetchFn !== 'function') {
    throw new AnkiConnectError('No fetch implementation is available.');
  }

  let response;
  try {
    response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        version: ANKI_CONNECT_VERSION,
        ...(params === undefined ? {} : { params }),
      }),
    });
  } catch (error) {
    throw new AnkiConnectError(`Unable to reach AnkiConnect: ${error.message}`, {
      cause: error,
      action,
      endpoint,
    });
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new AnkiConnectError(
      `AnkiConnect returned invalid JSON: ${error.message}`,
      { cause: error, action, endpoint },
    );
  }

  if (payload?.error) {
    throw new AnkiConnectError(String(payload.error), { action, endpoint });
  }

  return payload?.result;
}

function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UserInputError(name, `${name} is required.`);
  }
  return value;
}

function validateNoteIds(noteIds) {
  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    throw new UserInputError('noteIds', 'noteIds must contain at least one ID.');
  }

  return noteIds.map((id) => {
    const number = Number(id);
    if (!Number.isSafeInteger(number) || number <= 0) {
      throw new UserInputError('noteIds', `Invalid note ID: ${id}`);
    }
    return number;
  });
}

function validateNotes(notes, maxBatchSize) {
  if (!Array.isArray(notes) || notes.length === 0) {
    return invalidNotes('notes must contain at least one note.');
  }
  if (notes.length > maxBatchSize) {
    return invalidNotes(`notes exceeds maximum batch size of ${maxBatchSize}.`, {
      maxBatchSize,
    });
  }

  const normalized = [];
  for (const [index, note] of notes.entries()) {
    if (!isObject(note)) {
      return invalidNotes(`note at index ${index} must be an object.`);
    }
    if (typeof note.deckName !== 'string' || note.deckName.trim() === '') {
      return invalidNotes(`note at index ${index} is missing deckName.`);
    }
    if (typeof note.modelName !== 'string' || note.modelName.trim() === '') {
      return invalidNotes(`note at index ${index} is missing modelName.`);
    }
    if (!isObject(note.fields) || Object.keys(note.fields).length === 0) {
      return invalidNotes(`note at index ${index} is missing fields.`);
    }

    normalized.push({
      deckName: note.deckName,
      modelName: note.modelName,
      fields: stringifyFields(note.fields),
      ...(Array.isArray(note.tags) ? { tags: note.tags.map(String) } : {}),
      ...(isObject(note.options) ? { options: note.options } : {}),
      ...(Array.isArray(note.audio) ? { audio: note.audio } : {}),
      ...(Array.isArray(note.video) ? { video: note.video } : {}),
      ...(Array.isArray(note.picture) ? { picture: note.picture } : {}),
    });
  }

  return { ok: true, notes: normalized };
}

function stringifyFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([name, value]) => [name, String(value)]),
  );
}

function invalidNotes(message, extra = {}) {
  return {
    ok: false,
    error: {
      code: 'invalid_notes',
      message,
      ...extra,
    },
  };
}

function normalizeValidationResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }
  return results.map((ok, index) => ({ index, ok: ok === true }));
}

function normalizeAddResults(noteIds) {
  if (!Array.isArray(noteIds)) {
    return [];
  }
  return noteIds.map((noteId, index) =>
    Number.isSafeInteger(Number(noteId))
      ? { index, ok: true, noteId: Number(noteId) }
      : { index, ok: false, error: 'AnkiConnect did not return a note ID.' },
  );
}

function validateMediaPayload(args) {
  const filename = requireString(args.filename, 'filename');
  const params = { filename };
  const data = args.data ?? args.content;
  if (typeof data === 'string' && data.length > 0) {
    params.data = data;
  }
  if (typeof args.path === 'string' && args.path.length > 0) {
    params.path = args.path;
  }
  if (typeof args.url === 'string' && args.url.length > 0) {
    params.url = args.url;
  }
  if (!params.data && !params.path && !params.url) {
    throw new UserInputError(
      'media',
      'One of data, content, path, or url is required.',
    );
  }
  if (typeof args.deleteExisting === 'boolean') {
    params.deleteExisting = args.deleteExisting;
  }
  if (typeof args.skipHash === 'string') {
    params.skipHash = args.skipHash;
  }
  return params;
}

async function openNotes({ invoke, noteIds, limit }) {
  if (noteIds.length === 0) {
    return {
      ok: false,
      error: { code: 'empty_note_ids', message: 'No note IDs to open.' },
    };
  }

  const normalizedLimit = Math.min(
    Math.max(1, Number(limit) || DEFAULT_BROWSER_OPEN_LIMIT),
    MAX_BROWSER_OPEN_LIMIT,
  );
  const openedNoteIds = noteIds.slice(0, normalizedLimit);
  const query = openedNoteIds.map((id) => `nid:${id}`).join(' OR ');
  const response = {
    ok: true,
    query,
    openedNoteIds,
  };
  if (openedNoteIds.length < noteIds.length) {
    response.warning = `Browser query capped at ${openedNoteIds.length} of ${noteIds.length} notes.`;
  }

  try {
    const result = await invoke('guiBrowse', { query });
    response.result = result;
    return response;
  } catch (error) {
    return {
      ...response,
      ok: false,
      error: summarizeError(error),
    };
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

class UserInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'UserInputError';
    this.code = code;
  }
}

function summarizeError(error) {
  if (error instanceof UserInputError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof AnkiConnectError) {
    return {
      code: 'anki_connect_error',
      message: error.message,
    };
  }
  return {
    code: 'unexpected_error',
    message: error instanceof Error ? error.message : String(error),
  };
}

function createToolContent(value, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
    isError,
  };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleJsonRpcMessage(message, tools) {
  if (!message || typeof message !== 'object' || !message.method) {
    return undefined;
  }

  if (message.method === 'notifications/initialized') {
    return undefined;
  }

  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'cthu-codex-anki',
          version: '0.1.0',
        },
        instructions:
          'Use these Anki tools to inspect local collection schema, validate candidate notes, create notes, and open created notes for review. Do not use them for destructive Anki operations.',
      },
    };
  }

  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools: TOOL_DEFINITIONS },
    };
  }

  if (message.method === 'tools/call') {
    const name = message.params?.name;
    const args = message.params?.arguments ?? {};
    const tool = tools[name];
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Unknown tool: ${name}`,
        },
      };
    }

    try {
      const result = await tool(args);
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: createToolContent(result),
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: createToolContent(summarizeError(error), true),
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id: message.id,
    error: {
      code: -32601,
      message: `Method not found: ${message.method}`,
    },
  };
}

export async function runStdioServer(options = {}) {
  const tools = createAnkiTools(options);
  let buffer = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      await processLine(line, tools);
    }
  }

  if (buffer.trim() !== '') {
    await processLine(buffer, tools);
  }
}

async function processLine(line, tools) {
  if (line.trim() === '') {
    return;
  }
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    writeMessage({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`,
      },
    });
    return;
  }

  const response = await handleJsonRpcMessage(message, tools);
  if (response) {
    writeMessage(response);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runStdioServer().catch((error) => {
    process.stderr.write(
      `CthuCodex Anki MCP server failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  });
}
