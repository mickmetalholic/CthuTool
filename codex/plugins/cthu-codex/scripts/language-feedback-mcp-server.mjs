import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const LANGUAGE_FEEDBACK_VERSION = 1;
export const LANGUAGE_FEEDBACK_TOOL_NAME = 'cthu_language_feedback_present';
export const LANGUAGE_FEEDBACK_RESOURCE_URI =
  'ui://cthu-language-feedback/v1.html';
export const LANGUAGE_FEEDBACK_RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';
export const LANGUAGE_FEEDBACK_NOTE_CATEGORIES = Object.freeze([
  'grammar',
  'naturalness',
  'tone',
  'idiom',
  'clarity',
  'other',
]);

const MAX_PROSE_LENGTH = 8_000;
const MAX_NOTES = 12;
const MAX_NOTE_MESSAGE_LENGTH = 2_000;
const UI_RESOURCE_URL = new URL(
  '../ui/language-feedback/v1.html',
  import.meta.url,
);

const LANGUAGE_FEEDBACK_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'integer', const: LANGUAGE_FEEDBACK_VERSION },
    variant: { type: 'string', enum: ['compact'], default: 'compact' },
    original: {
      type: 'string',
      minLength: 1,
      maxLength: MAX_PROSE_LENGTH,
    },
    bestVersion: {
      type: 'string',
      minLength: 1,
      maxLength: MAX_PROSE_LENGTH,
    },
    notes: {
      type: 'array',
      maxItems: MAX_NOTES,
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: LANGUAGE_FEEDBACK_NOTE_CATEGORIES,
          },
          message: {
            type: 'string',
            minLength: 1,
            maxLength: MAX_NOTE_MESSAGE_LENGTH,
          },
        },
        required: ['category', 'message'],
        additionalProperties: false,
      },
    },
  },
  required: ['version', 'original', 'bestVersion', 'notes'],
  additionalProperties: false,
};

export const LANGUAGE_FEEDBACK_TOOL_DEFINITION = Object.freeze({
  name: LANGUAGE_FEEDBACK_TOOL_NAME,
  title: 'Present English polish',
  description:
    "Present a model-written English correction as a prominent read-only card. Call this before continuing with the user's requested task.",
  inputSchema: LANGUAGE_FEEDBACK_SCHEMA,
  outputSchema: LANGUAGE_FEEDBACK_SCHEMA,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  _meta: {
    ui: { resourceUri: LANGUAGE_FEEDBACK_RESOURCE_URI },
    'openai/outputTemplate': LANGUAGE_FEEDBACK_RESOURCE_URI,
    'openai/toolInvocation/invoking': 'Preparing English polish…',
    'openai/toolInvocation/invoked': 'English polish ready',
  },
});

export class LanguageFeedbackValidationError extends Error {
  constructor(details) {
    super(details.message);
    this.name = 'LanguageFeedbackValidationError';
    this.details = details;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringLength(value) {
  return [...value].length;
}

function addStringIssues(issues, value, path, maxLength) {
  if (typeof value !== 'string') {
    issues.push({
      path,
      code: 'invalid_type',
      message: `${path} must be a string.`,
    });
    return;
  }

  if (value.trim() === '') {
    issues.push({
      path,
      code: 'empty_string',
      message: `${path} must not be empty.`,
    });
  }

  if (stringLength(value) > maxLength) {
    issues.push({
      path,
      code: 'too_long',
      message: `${path} must contain at most ${maxLength} characters.`,
    });
  }
}

function addUnknownKeyIssues(issues, value, allowedKeys, path = '') {
  if (!isPlainObject(value)) {
    return;
  }

  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      const keyPath = path === '' ? key : `${path}.${key}`;
      issues.push({
        path: keyPath,
        code: 'unknown_field',
        message: `${keyPath} is not supported.`,
      });
    }
  }
}

function createValidationDetails(issues) {
  return {
    code: 'invalid_language_feedback',
    message: `Language feedback validation failed with ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}.`,
    issues,
  };
}

export function validateLanguageFeedbackPayload(input) {
  const issues = [];

  if (!isPlainObject(input)) {
    issues.push({
      path: '$',
      code: 'invalid_type',
      message: 'Language feedback must be an object.',
    });
    return { ok: false, error: createValidationDetails(issues) };
  }

  addUnknownKeyIssues(issues, input, [
    'version',
    'variant',
    'original',
    'bestVersion',
    'notes',
  ]);

  if (input.version !== LANGUAGE_FEEDBACK_VERSION) {
    issues.push({
      path: 'version',
      code: 'unsupported_version',
      message: `version must be ${LANGUAGE_FEEDBACK_VERSION}.`,
    });
  }

  const variant = input.variant ?? 'compact';
  if (variant !== 'compact') {
    issues.push({
      path: 'variant',
      code: 'unsupported_variant',
      message: 'variant must be compact when provided.',
    });
  }

  addStringIssues(issues, input.original, 'original', MAX_PROSE_LENGTH);
  addStringIssues(issues, input.bestVersion, 'bestVersion', MAX_PROSE_LENGTH);

  if (!Array.isArray(input.notes)) {
    issues.push({
      path: 'notes',
      code: 'invalid_type',
      message: 'notes must be an array.',
    });
  } else {
    if (input.notes.length > MAX_NOTES) {
      issues.push({
        path: 'notes',
        code: 'too_many_items',
        message: `notes must contain at most ${MAX_NOTES} items.`,
      });
    }

    for (const [index, note] of input.notes.entries()) {
      const notePath = `notes[${index}]`;
      if (!isPlainObject(note)) {
        issues.push({
          path: notePath,
          code: 'invalid_type',
          message: `${notePath} must be an object.`,
        });
        continue;
      }

      addUnknownKeyIssues(issues, note, ['category', 'message'], notePath);

      if (!LANGUAGE_FEEDBACK_NOTE_CATEGORIES.includes(note.category)) {
        issues.push({
          path: `${notePath}.category`,
          code: 'unsupported_category',
          message: `${notePath}.category must be one of ${LANGUAGE_FEEDBACK_NOTE_CATEGORIES.join(', ')}.`,
        });
      }

      addStringIssues(
        issues,
        note.message,
        `${notePath}.message`,
        MAX_NOTE_MESSAGE_LENGTH,
      );
    }
  }

  if (issues.length > 0) {
    return { ok: false, error: createValidationDetails(issues) };
  }

  return {
    ok: true,
    value: {
      version: LANGUAGE_FEEDBACK_VERSION,
      variant,
      original: input.original,
      bestVersion: input.bestVersion,
      notes: input.notes.map((note) => ({
        category: note.category,
        message: note.message,
      })),
    },
  };
}

export function normalizeLanguageFeedbackPayload(input) {
  const validation = validateLanguageFeedbackPayload(input);
  if (!validation.ok) {
    throw new LanguageFeedbackValidationError(validation.error);
  }
  return validation.value;
}

function titleCaseCategory(category) {
  return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

export function createLanguageFeedbackFallbackText(input) {
  const feedback = normalizeLanguageFeedbackPayload(input);
  const notes =
    feedback.notes.length === 0
      ? '- No additional notes.'
      : feedback.notes
          .map(
            (note) => `- ${titleCaseCategory(note.category)}: ${note.message}`,
          )
          .join('\n');

  return `English polish\n\nBest version:\n${feedback.bestVersion}\n\nOriginal:\n${feedback.original}\n\nNotes:\n${notes}`;
}

export function summarizeLanguageFeedbackError(error) {
  if (error instanceof LanguageFeedbackValidationError) {
    return error.details;
  }
  return {
    code: 'unexpected_error',
    message: error instanceof Error ? error.message : String(error),
    issues: [],
  };
}

export function presentLanguageFeedback(input) {
  try {
    const feedback = normalizeLanguageFeedbackPayload(input);
    return {
      content: [
        {
          type: 'text',
          text: createLanguageFeedbackFallbackText(feedback),
        },
      ],
      structuredContent: feedback,
      isError: false,
    };
  } catch (error) {
    const details = summarizeLanguageFeedbackError(error);
    return {
      content: [
        {
          type: 'text',
          text: `English polish could not be presented: ${details.message}`,
        },
      ],
      structuredContent: {
        ok: false,
        error: details,
      },
      isError: true,
    };
  }
}

export async function readLanguageFeedbackResource() {
  return await readFile(UI_RESOURCE_URL, 'utf8');
}

function createJsonRpcError(id, code, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
}

export async function handleJsonRpcMessage(message, options = {}) {
  if (
    !isPlainObject(message) ||
    message.jsonrpc !== '2.0' ||
    typeof message.method !== 'string'
  ) {
    return createJsonRpcError(message?.id ?? null, -32600, 'Invalid Request');
  }

  if (message.method === 'notifications/initialized') {
    return undefined;
  }

  if (message.id === undefined) {
    return undefined;
  }

  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {}, resources: {} },
        serverInfo: {
          name: 'cthu-codex-language-feedback',
          version: '1.0.0',
        },
        instructions:
          'Use the presentation tool only to display model-written English feedback. It validates and renders locally without generating corrections, network access, or persistent writes.',
      },
    };
  }

  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools: [LANGUAGE_FEEDBACK_TOOL_DEFINITION] },
    };
  }

  if (message.method === 'tools/call') {
    const name = message.params?.name;
    if (name !== LANGUAGE_FEEDBACK_TOOL_NAME) {
      return createJsonRpcError(
        message.id,
        -32601,
        `Unknown tool: ${String(name)}`,
      );
    }

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: presentLanguageFeedback(message.params?.arguments ?? {}),
    };
  }

  if (message.method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        resources: [
          {
            uri: LANGUAGE_FEEDBACK_RESOURCE_URI,
            name: 'CthuCodex language feedback',
            title: 'English polish card',
            description:
              'Self-contained compact UI for read-only English language feedback.',
            mimeType: LANGUAGE_FEEDBACK_RESOURCE_MIME_TYPE,
          },
        ],
      },
    };
  }

  if (message.method === 'resources/read') {
    const uri = message.params?.uri;
    if (uri !== LANGUAGE_FEEDBACK_RESOURCE_URI) {
      return createJsonRpcError(
        message.id,
        -32002,
        `Unknown resource: ${String(uri)}`,
      );
    }

    const loadResource = options.readResource ?? readLanguageFeedbackResource;
    try {
      const html = await loadResource();
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          contents: [
            {
              uri: LANGUAGE_FEEDBACK_RESOURCE_URI,
              mimeType: LANGUAGE_FEEDBACK_RESOURCE_MIME_TYPE,
              text: html,
              _meta: {
                ui: {
                  prefersBorder: false,
                  csp: {
                    connectDomains: [],
                    resourceDomains: [],
                  },
                },
              },
            },
          ],
        },
      };
    } catch (error) {
      const details = summarizeLanguageFeedbackError(error);
      return createJsonRpcError(message.id, -32603, details.message);
    }
  }

  return createJsonRpcError(
    message.id,
    -32601,
    `Method not found: ${message.method}`,
  );
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function processLine(line, options) {
  if (line.trim() === '') {
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    writeMessage(createJsonRpcError(null, -32700, 'Parse error'));
    return;
  }

  const response = await handleJsonRpcMessage(message, options);
  if (response !== undefined) {
    writeMessage(response);
  }
}

export async function runStdioServer(options = {}) {
  let buffer = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      await processLine(line, options);
    }
  }

  if (buffer.trim() !== '') {
    await processLine(buffer, options);
  }
}

function isDirectExecution() {
  if (process.argv[1] === undefined) {
    return false;
  }
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) ===
      realpathSync(process.argv[1])
    );
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  runStdioServer().catch((error) => {
    process.stderr.write(
      `CthuCodex language-feedback MCP server failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
