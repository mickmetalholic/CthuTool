import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export const REVIEW_TOOL_NAME = 'cthu_notion_review_present';
export const REVIEW_RESOURCE_URI = 'ui://cthu-notion-review/v1.html';
const MIME_TYPE = 'text/html;profile=mcp-app';
const RESOURCE_URL = new URL('../ui/notion-review/v1.html', import.meta.url);
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const MAX_BYTES = 512 * 1024;
const MAX_NOTES = 200;
const STATUS_VALUES = ['Learning', 'Archived'];
const ID_PATTERN = /^[\da-fA-F]{8}(?:-[\da-fA-F]{4}){3}-[\da-fA-F]{12}$/;
const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?)?$/;

const RESOURCE = {
  uri: REVIEW_RESOURCE_URI,
  name: 'Notion review panel',
  mimeType: MIME_TYPE,
};

export const REVIEW_TOOL = {
  name: REVIEW_TOOL_NAME,
  title: 'Show the Notion review panel',
  description:
    'Show categories, due notes, and review choices after notion-review-notes has fetched its queue from Notion. After a submitted result, call again with the refreshed queue and the verified outcome. This tool only presents supplied data.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['notes'],
    properties: {
      notes: {
        type: 'array',
        maxItems: MAX_NOTES,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'title',
            'url',
            'categories',
            'stage',
            'status',
            'lastReviewed',
          ],
          properties: {
            id: { type: 'string', pattern: ID_PATTERN.source },
            title: { type: 'string', minLength: 1, maxLength: 400 },
            url: { type: 'string', maxLength: 1024 },
            categories: {
              type: 'array',
              maxItems: 32,
              items: { type: 'string', minLength: 1, maxLength: 160 },
            },
            stage: { type: ['number', 'null'], maximum: 6 },
            status: { type: 'string', enum: STATUS_VALUES },
            lastReviewed: { type: ['string', 'null'], maxLength: 40 },
          },
        },
      },
      partial: { type: 'boolean' },
      preferredCategory: { type: 'string', maxLength: 160 },
      feedback: {
        type: 'object',
        required: ['kind', 'text'],
        additionalProperties: false,
        properties: {
          kind: { type: 'string', enum: ['success', 'error'] },
          text: { type: 'string', minLength: 1, maxLength: 500 },
        },
      },
    },
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  _meta: {
    ui: { resourceUri: REVIEW_RESOURCE_URI },
    'openai/outputTemplate': REVIEW_RESOURCE_URI,
  },
};

function isText(value, maxLength) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isNotionPageUrl(value, id) {
  if (!isText(value, 1024)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname;
    const pageId = url.pathname
      .replace(/\/$/, '')
      .match(/[\da-f]{32}$|[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i)?.[0];
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (host === 'app.notion.com' ||
        host === 'notion.so' ||
        host.endsWith('.notion.so') ||
        host.endsWith('.notion.site')) &&
      pageId?.replaceAll('-', '').toLowerCase() ===
        id.replaceAll('-', '').toLowerCase()
    );
  } catch {
    return false;
  }
}

function normalizeNote(note) {
  const { id, title, url, categories, stage, status, lastReviewed } =
    note ?? {};
  if (
    typeof id !== 'string' ||
    !ID_PATTERN.test(id) ||
    !isText(title, 400) ||
    !isNotionPageUrl(url, id) ||
    !Array.isArray(categories) ||
    categories.length > 32 ||
    !categories.every((category) => isText(category, 160)) ||
    !(stage === null || (Number.isFinite(stage) && stage <= 6)) ||
    !STATUS_VALUES.includes(status) ||
    (stage === 6 && status === 'Archived') ||
    !(
      lastReviewed === null ||
      (isText(lastReviewed, 40) && DATE_PATTERN.test(lastReviewed))
    )
  ) {
    throw new Error(
      'Each note needs its verified Notion URL, categories, and review snapshot.',
    );
  }
  return {
    id: id.toLowerCase(),
    title,
    url,
    categories: [...new Set(categories)],
    stage,
    status,
    lastReviewed,
  };
}

export function presentNotionReview(input) {
  try {
    const { notes, partial = false, preferredCategory, feedback } = input ?? {};
    if (
      !Array.isArray(notes) ||
      notes.length > MAX_NOTES ||
      typeof partial !== 'boolean' ||
      (preferredCategory !== undefined && !isText(preferredCategory, 160)) ||
      (feedback !== undefined &&
        (!['success', 'error'].includes(feedback?.kind) ||
          !isText(feedback.text, 500)))
    ) {
      throw new Error(
        `Provide up to ${MAX_NOTES} due notes and optional display feedback.`,
      );
    }
    const reviewNotes = notes.map(normalizeNote);
    if (
      new Set(reviewNotes.map((note) => note.id)).size !== reviewNotes.length
    ) {
      throw new Error(
        'Merge duplicate Notion page IDs before presenting the review queue.',
      );
    }
    const categories = [
      ...new Set(
        reviewNotes.flatMap((note) =>
          note.categories.length ? note.categories : ['未分类'],
        ),
      ),
    ];
    const count = partial
      ? `Showing ${notes.length} due notes with incomplete coverage.`
      : `${notes.length} due notes.`;
    return {
      content: [
        { type: 'text', text: feedback ? `${feedback.text}\n${count}` : count },
      ],
      structuredContent: {
        notes: reviewNotes,
        categories,
        partial,
        ...(preferredCategory === undefined ? {} : { preferredCategory }),
        ...(feedback
          ? { feedback: { kind: feedback.kind, text: feedback.text } }
          : {}),
      },
    };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export async function handleReviewMessage(message) {
  if (message?.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return rpcError(null, -32600, 'Invalid Request');
  }
  if (message.id === undefined) return undefined;
  const reply = (result) => ({ jsonrpc: '2.0', id: message.id, result });
  switch (message.method) {
    case 'initialize':
      return reply({
        protocolVersion: VERSIONS.includes(message.params?.protocolVersion)
          ? message.params.protocolVersion
          : VERSIONS[0],
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'cthu-notion-review', version: '1.0.0' },
      });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: [REVIEW_TOOL] });
    case 'tools/call':
      return message.params?.name === REVIEW_TOOL_NAME
        ? reply(presentNotionReview(message.params.arguments))
        : rpcError(message.id, -32602, 'Unknown tool');
    case 'resources/list':
      return reply({ resources: [RESOURCE] });
    case 'resources/read': {
      if (message.params?.uri !== REVIEW_RESOURCE_URI)
        return rpcError(message.id, -32002, 'Resource not found');
      try {
        return reply({
          contents: [
            {
              uri: REVIEW_RESOURCE_URI,
              mimeType: MIME_TYPE,
              text: await readFile(RESOURCE_URL, 'utf8'),
              _meta: {
                ui: {
                  prefersBorder: false,
                  csp: { connectDomains: [], resourceDomains: [] },
                },
              },
            },
          ],
        });
      } catch {
        return rpcError(message.id, -32603, 'Review panel unavailable');
      }
    }
    default:
      return rpcError(message.id, -32601, 'Method not found');
  }
}

export function createReviewHttpServer({ allowedOrigins = [] } = {}) {
  const origins = new Set(allowedOrigins);
  return createServer({ requestTimeout: 15000 }, async (request, response) => {
    if (request.headers.origin && !origins.has(request.headers.origin)) {
      response.writeHead(403).end();
      return;
    }
    if (request.url !== '/mcp') {
      response.writeHead(404).end();
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' }).end();
      return;
    }
    if (
      request.headers['content-type']?.split(';')[0].trim() !==
      'application/json'
    ) {
      response.writeHead(415).end();
      return;
    }
    const version = request.headers['mcp-protocol-version'];
    if (version && !VERSIONS.includes(version)) {
      response.writeHead(400).end();
      return;
    }

    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of request.iterator({ destroyOnReturn: false })) {
        size += chunk.length;
        if (size > MAX_BYTES) {
          response.writeHead(413, { Connection: 'close' }).end();
          return;
        }
        chunks.push(chunk);
      }
    } catch {
      response.destroy();
      return;
    }

    let message;
    try {
      message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      response
        .writeHead(400, { 'Content-Type': 'application/json' })
        .end(JSON.stringify(rpcError(null, -32700, 'Parse error')));
      return;
    }
    const result = await handleReviewMessage(message);
    if (result === undefined) {
      response.writeHead(202).end();
    } else {
      response
        .writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        })
        .end(JSON.stringify(result));
    }
  });
}

async function runStdioServer() {
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let result;
    try {
      result = await handleReviewMessage(JSON.parse(line));
    } catch {
      result = rpcError(null, -32700, 'Parse error');
    }
    if (result !== undefined)
      process.stdout.write(`${JSON.stringify(result)}\n`);
  }
}

function isDirectExecution() {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  if (process.argv.includes('--http')) {
    const allowedOrigins = (
      process.env.CTHU_REVIEW_ALLOWED_ORIGINS ?? 'https://chatgpt.com'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    createReviewHttpServer({ allowedOrigins }).listen({
      host: process.env.CTHU_REVIEW_HOST ?? '127.0.0.1',
      port: Number(process.env.CTHU_REVIEW_PORT ?? 8787),
    });
  } else {
    await runStdioServer();
  }
}
