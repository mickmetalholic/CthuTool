import { mkdir, open } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const API = 'https://api.notion.com/v1';
const LIMIT = 20 * 1024 * 1024;
const uuid = /^[\da-f]{8}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{12}$/i;

function imageType(b) {
  if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.toString('ascii', 12, 16) === 'IHDR' && b.readUInt32BE(16) && b.readUInt32BE(20)) return ['png', 'image/png'];
  if (b.length > 4 && b[0] === 255 && b[1] === 216 && b[2] === 255 && b[b.length - 2] === 255 && b[b.length - 1] === 217) return ['jpg', 'image/jpeg'];
  if (b.length >= 14 && /^GIF8[79]a$/.test(b.toString('ascii', 0, 6)) && b.readUInt16LE(6) && b.readUInt16LE(8) && b[b.length - 1] === 59) return ['gif', 'image/gif'];
  if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' && b.readUInt32LE(4) + 8 === b.length) return ['webp', 'image/webp'];
  throw new Error('invalid_image');
}

function coverKey(cover) {
  if (!cover) return null;
  const raw = cover[cover.type]?.url;
  if (!raw) return JSON.stringify(cover);
  const u = new URL(raw);
  // Uploaded-file signatures expire; external URL queries can identify the image.
  return cover.type === 'file' ? `file:${u.origin}${u.pathname}` : `external:${u.href}`;
}

/** The caller must verify image identity and wait for template completion first. */
export async function setCover(input, { fetchImpl = fetch, token = process.env.NOTION_TOKEN, directory = join(homedir(), 'downloads') } = {}) {
  if (!input || !uuid.test(input.page_id ?? '') || typeof input.image_url !== 'string' || (input.replace !== undefined && typeof input.replace !== 'boolean')) throw new Error('invalid_input');
  const source = new URL(input.image_url);
  if (source.protocol !== 'https:' || source.username || source.password) throw new Error('invalid_image_url');
  const pageId = input.page_id.replaceAll('-', '');
  const result = { page_url: `https://www.notion.so/${pageId}` };
  async function request(url, options = {}) {
    return fetchImpl(url, { ...options, signal: AbortSignal.timeout(30000) });
  }
  async function api(path, method = 'GET', body, multipart = false) {
    const response = await request(`${API}${path}`, {
      method, redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2026-03-11', ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`notion_http_${response.status}`);
    return response.json();
  }
  let before;
  let apiFailure;
  if (token) {
    try {
      before = await api(`/pages/${pageId}`);
      if (!Object.hasOwn(before, 'cover')) throw new Error('cover_state_unknown');
      if (before.cover && !input.replace) return { ...result, status: 'preserved_existing' };
    } catch (error) { apiFailure = safeReason(error); }
  }
  let file;
  let bytes;
  let mime;
  try {
    // No Notion authorization headers are sent to the image origin.
    const response = await request(source.href, { redirect: 'follow' });
    if (!response.ok) throw new Error(`image_http_${response.status}`);
    if (Number(response.headers.get('content-length')) > LIMIT) throw new Error('image_too_large');
    if (!response.body) throw new Error('empty_image');
    const parts = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > LIMIT) throw new Error('image_too_large');
      parts.push(chunk);
    }
    bytes = Buffer.concat(parts);
    const [extension, contentType] = imageType(bytes);
    mime = contentType;
    const stem = basename(String(input.filename || 'cover')).replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^\.+/, '').slice(0, 80) || 'cover';
    await mkdir(directory, { recursive: true });
    file = join(directory, `${stem}-${randomUUID()}.${extension}`);
    const handle = await open(file, 'wx', 0o600);
    try { await handle.writeFile(bytes); } finally { await handle.close(); }
    result.local_path = file;
  } catch (error) {
    return { ...result, status: 'download_failed', reason: safeReason(error) };
  }
  const fallback = (reason) => ({ ...result, status: 'manual_required', reason });
  if (!token) return fallback('missing_token');
  if (apiFailure) return fallback(apiFailure);
  try {
    const upload = await api('/file_uploads', 'POST', { mode: 'single_part', filename: basename(file), content_type: mime });
    if (!uuid.test(upload.id ?? '')) throw new Error('invalid_upload_response');
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: mime }), basename(file));
    const sent = await api(`/file_uploads/${upload.id}/send`, 'POST', form, true);
    if (sent.status !== 'uploaded') throw new Error('upload_not_ready');
    // Recheck after download/upload so a new or changed cover is not overwritten.
    const current = await api(`/pages/${pageId}`);
    if (!Object.hasOwn(current, 'cover')) throw new Error('cover_state_unknown');
    if (coverKey(current.cover) !== coverKey(before.cover)) return fallback('cover_changed');
    let patched;
    try {
      patched = await api(`/pages/${pageId}`, 'PATCH', { cover: { type: 'file_upload', file_upload: { id: upload.id } } });
    } catch {
      // Reconcile an uncertain outcome, but do not infer upload identity from any file cover.
      try { await api(`/pages/${pageId}`); } catch { /* No mutation retry. */ }
      return fallback('cover_update_uncertain');
    }
    const verified = await api(`/pages/${pageId}`);
    if (patched.cover?.type !== 'file' || !patched.cover.file?.url || verified.cover?.type !== 'file' || coverKey(patched.cover) !== coverKey(verified.cover)) return fallback('cover_verification_failed');
    return { ...result, status: 'uploaded_cover_set' };
  } catch (error) { return fallback(safeReason(error)); }
}

function safeReason(error) {
  const message = String(error?.message ?? '');
  return /^(?:notion_http_\d{3}|image_http_\d{3}|image_too_large|invalid_image|empty_image|cover_state_unknown|invalid_upload_response|upload_not_ready)$/.test(message) ? message : 'operation_failed';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    let data = '';
    for await (const chunk of process.stdin) data += chunk;
    console.log(JSON.stringify(await setCover(JSON.parse(data))));
  } catch { console.log(JSON.stringify({ status: 'invalid_request' })); process.exitCode = 1; }
}
