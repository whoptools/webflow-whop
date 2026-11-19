import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../server/store';
import { createApp, mergeScripts, readAppliedScripts, type AppConfig } from '../server/app';

const siteId = '0123456789abcdef01234567';
void test('new sites have no applied scripts, but unrelated API failures propagate', async () => {
  assert.deepEqual(await readAppliedScripts(async () => { throw Object.assign(new Error('Missing code block'), {statusCode: 404, body: {message: 'Requested resource not found: Custom code block not found'}}); }), []);
  await assert.rejects(readAppliedScripts(async () => { throw new Error('Site not found'); }));
});
const config: AppConfig = { root: process.cwd(), publicUrl: 'https://app.example', clientId: 'test-client', clientSecret: 'test-secret', allowedOrigins: ['https://extension.example'], production: true };
function setup(fetcher: typeof fetch = async () => { throw new Error('Unexpected network request'); }) {
  const store = new Store(':memory:', randomBytes(32).toString('hex'));
  return { store, app: createApp(config, store, fetcher) };
}

void test('encrypts persisted OAuth credentials and rejects tampered ciphertext', () => {
  const { store } = setup();
  store.put(siteId, 'secret-oauth-token');
  assert.equal(store.get(siteId), 'secret-oauth-token');
  const row = store.db.prepare('SELECT token FROM connections').get() as {token: string};
  assert.ok(!row.token.includes('secret-oauth-token'));
  const data = Buffer.from(row.token, 'base64'); data[30] ^= 1;
  assert.throws(() => store.unseal(data.toString('base64')));
  store.forget(siteId); assert.equal(store.get(siteId), null); store.db.close();
});
void test('OAuth state is one-use and expires', () => {
  const { store } = setup(); const state = store.newState();
  assert.equal(store.consumeState(state), true); assert.equal(store.consumeState(state), false);
  const expired = store.newState(); store.db.prepare('UPDATE oauth_states SET expires=0').run();
  assert.equal(store.consumeState(expired), false); store.db.close();
});
void test('requires browser-bound OAuth state before token exchange', async () => {
  const { app, store } = setup(); const state = store.newState();
  await request(app).get(`/auth/callback?state=${state}&code=stolen`).expect(400);
  assert.equal(store.consumeState(state), true); store.db.close();
});
void test('sets secure OAuth cookie and requests only configured scopes', async () => {
  const { app, store } = setup(); const response = await request(app).get('/auth/start').expect(302);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/); assert.match(response.headers['set-cookie'][0], /Secure/);
  const redirect = new URL(response.headers.location);
  assert.equal(redirect.hostname, 'webflow.com'); assert.ok(redirect.searchParams.get('state'));
  assert.doesNotMatch(redirect.search, /cms:|ecommerce:|workspace:|sites:write/); store.db.close();
});
void test('rejects missing site authorization without calling upstream', async () => {
  const { app, store } = setup();
  await request(app).post(`/api/sites/${siteId}/install`).send({}).expect(401); store.db.close();
});
void test('rejects malicious extension origins', async () => {
  const { app, store } = setup();
  await request(app).post(`/api/sites/${siteId}/install`).set('Origin', 'https://extension.example.evil.test').send({}).expect(403); store.db.close();
});
void test('public checkout scripts allow merchant SRI requests without allowing merchant API calls', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'whop-runtime-'));
  const store = new Store(':memory:', randomBytes(32).toString('hex'));
  try {
    mkdirSync(path.join(root, 'dist/storefront'), { recursive: true });
    writeFileSync(path.join(root, 'dist/storefront/checkout.js'), '/* public runtime */');
    const app = createApp({ ...config, root }, store);
    const response = await request(app).get('/runtime/checkout.js').set('Origin', 'https://merchant.example').expect(200);
    assert.equal(response.headers['access-control-allow-origin'], '*');
    await request(app).post(`/api/sites/${siteId}/install`).set('Origin', 'https://merchant.example').send({}).expect(403);
  } finally { store.db.close(); rmSync(root, { recursive: true, force: true }); }
});
void test('verifies identity with Webflow before allowing site mutation', async () => {
  let called = false;
  const { app, store } = setup(async (url, init) => {
    called = true; assert.equal(url, 'https://api.webflow.com/beta/token/resolve');
    assert.equal(init?.redirect, 'error'); assert.equal((JSON.parse(init?.body as string) as {idToken: string}).idToken, 'test-id-token');
    return new Response('{}', { status: 401 });
  });
  store.put(siteId, 'oauth');
  await request(app).post(`/api/sites/${siteId}/install`).set('Authorization', 'Bearer test-id-token').send({}).expect(401);
  assert.ok(called); store.db.close();
});
void test('blocks cross-site ID tokens even when Webflow resolves a valid user', async () => {
  const { app, store } = setup(async () => Response.json({ id: 'user', siteId: 'different-site' }));
  store.put(siteId, 'oauth');
  await request(app).post(`/api/sites/${siteId}/disconnect`).set('Authorization', 'Bearer token').send({}).expect(403);
  assert.equal(store.get(siteId), 'oauth'); store.db.close();
});
void test('install and removal preserve unrelated scripts and avoid duplicates', () => {
  const other = { id: 'analytics', version: '1.0.0', location: 'header' as const, attributes: { custom: 'keep' } };
  const checkout = { id: 'whop', version: '0.1.0', location: 'footer' as const };
  const added = mergeScripts([other, checkout], ['whop'], [checkout]);
  assert.deepEqual(added, [other, checkout]);
  assert.deepEqual(mergeScripts(added, ['whop'], []), [other]);
});
void test('production service refuses insecure public URLs', () => {
  const store = new Store(':memory:', randomBytes(32).toString('hex'));
  assert.throws(() => createApp({ ...config, publicUrl: 'http://example.com' }, store)); store.db.close();
});

void test('domain migration redirects OAuth before creating cookies and preserves published scripts', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'whop-domain-'));
  const store = new Store(':memory:', randomBytes(32).toString('hex'));
  try {
    mkdirSync(path.join(root, 'dist/storefront'), { recursive: true });
    writeFileSync(path.join(root, 'dist/storefront/checkout.js'), '/* old published runtime */');
    const app = createApp({ ...config, root, legacyHosts: ['old.example'] }, store);
    const response = await request(app).get('/auth/start?next=demo').set('Host', 'old.example').expect(308);
    assert.equal(response.headers.location, 'https://app.example/auth/start?next=demo');
    assert.equal(response.headers['set-cookie'], undefined);
    await request(app).get('/auth/start').set('Host', 'app.example').expect(302);
    const runtime = await request(app).get('/runtime/checkout.js').set('Host', 'old.example').set('Origin', 'https://merchant.example').expect(200);
    assert.equal(runtime.headers['access-control-allow-origin'], '*');
    await request(app).get('/health').set('Host', 'old.example').expect(200);
    await request(app).post(`/api/sites/${siteId}/status`).set('Host', 'old.example').set('Origin', 'https://extension.example').send({}).expect(401);
  } finally { store.db.close(); rmSync(root, { recursive: true, force: true }); }
});
