import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, open, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setCover } from '../skills/notion-manage/scripts/set-cover.mjs';

const id = '12345678-1234-1234-1234-123456789abc';
const input = { page_id: id, image_url: 'https://images.example/cover', filename: '../../作品.png' };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2uoAAAAASUVORK5CYII=', 'base64');
const fileCover = { type: 'file', file: { url: 'https://files.example/cover.png?signature=1' } };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
async function run(t, handler, token = 'test-secret', extra = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'notion-cover-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  const result = await setCover({ ...input, ...extra }, { directory, token, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url.startsWith('https://images.example')) {
      assert.equal(options.headers?.Authorization, undefined);
      return handler.image ? handler.image() : new Response(png);
    }
    assert.ok(url.startsWith('https://api.notion.com/v1/'));
    assert.equal(options.redirect, 'error');
    return handler(url, options, calls);
  } });
  assert.ok(!JSON.stringify(result).includes('test-secret'));
  return { result, calls, directory };
}
test('no token saves a correctly typed local image without API calls', async t => {
  const { result, calls, directory } = await run(t, () => assert.fail(), '');
  assert.equal(result.status, 'manual_required');
  assert.equal(result.reason, 'missing_token');
  assert.ok(result.local_path.startsWith(directory + '/'));
  assert.deepEqual(await readFile(result.local_path), png);
  assert.equal(calls.length, 1);
});
test('preserves existing covers without downloading or uploading', async t => {
  const { result, calls } = await run(t, () => json({ cover: fileCover }));
  assert.equal(result.status, 'preserved_existing');
  assert.equal(calls.length, 1);
});
test('rejects an HTML response, not saving a pretend image', async t => {
  const handler = () => json({ cover: null });
  handler.image = () => new Response('<html>blocked</html>');
  const { result } = await run(t, handler);
  assert.equal(result.status, 'download_failed');
  assert.equal(result.local_path, undefined);
});
test('API denied retains downloaded image for manual setup', async t => {
  const { result, calls } = await run(t, () => json({}, 403));
  assert.equal(result.reason, 'notion_http_403');
  assert.deepEqual(await readFile(result.local_path), png);
  assert.equal(calls.filter(c => c.options.method === 'POST').length, 0);
});
function uploadFlow({ changed = false, uncertain = false, mismatch = false, uploadFailure = false, initial = null } = {}) {
  let gets = 0;
  return (url, options) => {
    if (url.endsWith('/send')) {
      assert.ok(options.body instanceof FormData);
      assert.equal(options.body.get('file').type, 'image/png');
      return json({ status: uploadFailure ? 'pending' : 'uploaded' });
    }
    if (url.endsWith('/file_uploads')) return json({ id });
    if (options.method === 'PATCH') {
      assert.deepEqual(JSON.parse(options.body), { cover: { type: 'file_upload', file_upload: { id } } });
      if (uncertain) throw new Error('test-secret');
      return json({ cover: fileCover });
    }
    gets++;
    return json({ cover: gets >= 3 ? (mismatch ? null : { type: 'file', file: { url: 'https://files.example/cover.png?signature=2' } }) : changed && gets === 2 ? fileCover : initial });
  };
}
test('uploads then patches only cover and verifies refreshed signed URL', async t => {
  const { result, calls } = await run(t, uploadFlow());
  assert.equal(result.status, 'uploaded_cover_set');
  assert.equal(calls.filter(c => c.options.method === 'PATCH').length, 1);
});
test('explicit replacement permits replacing the observed cover', async t => {
  const { result } = await run(t, uploadFlow({ initial: { type: 'external', external: { url: 'https://example.com/old.jpg' } } }), 'test-secret', { replace: true });
  assert.equal(result.status, 'uploaded_cover_set');
});
for (const [option, reason] of [['changed', 'cover_changed'], ['uncertain', 'cover_update_uncertain'], ['mismatch', 'cover_verification_failed'], ['uploadFailure', 'upload_not_ready']]) {
  test(`${option} returns manual fallback without blind retries`, async t => {
    const { result, calls } = await run(t, uploadFlow({ [option]: true }));
    assert.equal(result.status, 'manual_required');
    assert.equal(result.reason, reason);
    assert.ok(calls.filter(c => c.options.method === 'PATCH').length <= 1);
    assert.deepEqual(await readFile(result.local_path), png);
  });
}
test('oversize responses are rejected before file save', async t => {
  const handler = () => json({ cover: null });
  handler.image = () => new Response(png, { headers: { 'content-length': String(21 * 1024 * 1024) } });
  const { result } = await run(t, handler);
  assert.equal(result.reason, 'image_too_large');
  assert.equal(result.local_path, undefined);
});
test('script imports from a copied installation without repository dependencies', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'notion-installed-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = join(directory, 'set-cover.mjs');
  await cp(new URL('../skills/notion-manage/scripts/set-cover.mjs', import.meta.url), target);
  const installed = await import(pathToFileURL(target).href);
  assert.equal(typeof installed.setCover, 'function');
  await assert.rejects(installed.setCover({ ...input, page_id: 'bad' }), /invalid_input/);
});

async function localImage(t, bytes = png) {
  const directory = await mkdtemp(join(tmpdir(), 'notion-browser-cover-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'browser-download.jpg');
  await writeFile(file, bytes);
  return file;
}
test('browser file uploads without contacting image origin and preserves original', async t => {
  const file = await localImage(t);
  const { result, calls } = await run(t, uploadFlow(), 'test-secret', { image_url: undefined, local_path: file });
  assert.equal(result.status, 'uploaded_cover_set');
  assert.ok(calls.every(c => c.url.startsWith('https://api.notion.com/')));
  assert.notEqual(result.local_path, file);
  assert.deepEqual(await readFile(file), png);
  assert.deepEqual(await readFile(result.local_path), png);
});
test('local file without token returns validated download copy without network', async t => {
  const file = await localImage(t);
  const { result, calls, directory } = await run(t, () => assert.fail(), '', { image_url: undefined, local_path: file });
  assert.equal(result.status, 'manual_required');
  assert.equal(result.reason, 'missing_token');
  assert.equal(calls.length, 0);
  assert.ok(result.local_path.startsWith(directory + '/'));
  assert.deepEqual(await readFile(result.local_path), png);
});
test('local HTML is rejected before upload and kept untouched', async t => {
  const file = await localImage(t, '<html>blocked</html>');
  const { result, calls } = await run(t, () => json({cover: null}), 'test-secret', { image_url: undefined, local_path: file });
  assert.equal(result.reason, 'invalid_image');
  assert.equal(result.local_path, undefined);
  assert.equal(calls.filter(c => c.options.method === 'POST').length, 0);
  assert.equal(await readFile(file, 'utf8'), '<html>blocked</html>');
});
test('oversized local files are rejected without upload', async t => {
  const file = await localImage(t);
  const handle = await open(file, 'r+');
  try { await handle.truncate(21 * 1024 * 1024); } finally { await handle.close(); }
  const { result, calls } = await run(t, () => assert.fail(), '', { image_url: undefined, local_path: file });
  assert.equal(result.reason, 'image_too_large');
  assert.equal(result.local_path, undefined);
  assert.equal(calls.length, 0);
});
test('ambiguous or relative image inputs are rejected before network', async () => {
  const options = { token: '', fetchImpl: () => assert.fail() };
  await assert.rejects(setCover({ ...input, local_path: '/tmp/cover.jpg' }, options), /invalid_input/);
  await assert.rejects(setCover({ page_id: id, local_path: 'cover.jpg' }, options), /invalid_input/);
  await assert.rejects(setCover({ page_id: id }, options), /invalid_input/);
});
