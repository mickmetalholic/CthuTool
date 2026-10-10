import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, cp } from 'node:fs/promises';
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
