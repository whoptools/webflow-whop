import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { WebflowClient } from 'webflow-api';
import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Store } from './store';

export type AppConfig = { publicUrl: string; clientId: string; clientSecret: string; allowedOrigins: string[]; production: boolean; root: string; trustProxy?: string | number; runtimeDir?: string };
type Script = { id: string; version: string; location: 'header' | 'footer'; attributes?: Record<string, unknown> };
export const SCOPES = ['authorized_user:read', 'sites:read', 'sites:write', 'custom_code:read', 'custom_code:write'] as const;
const VERSION = '0.1.2';

export function mergeScripts(existing: Script[], ownedIds: string[], additions: Script[]): Script[] {
  const owned = new Set([...ownedIds, ...additions.map(script => script.id)]);
  return [...existing.filter(script => !owned.has(script.id)), ...additions];
}

export async function readAppliedScripts(read: () => Promise<{ scripts?: Script[] }>): Promise<Script[]> {
  try { return (await read()).scripts ?? []; }
  catch (error) {
    // A freshly authorized site has no custom-code block until its first install.
    if (typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 404 && 'body' in error) {
      const body = error.body as { message?: string };
      if (body.message === 'Requested resource not found: Custom code block not found') return [];
    }
    throw error;
  }
}

export function createApp(config: AppConfig, store: Store, fetcher: typeof fetch = fetch) {
  const app = express();
  const origin = new URL(config.publicUrl).origin;
  if (config.production && !config.publicUrl.startsWith('https://')) throw new Error('Production PUBLIC_URL must use HTTPS.');
  const allowed = new Set([origin, ...config.allowedOrigins]);
  const locks = new Map<string, Promise<void>>();
  app.disable('x-powered-by');
  // HTTPS wrapper for the official local CLI bridge, used only during development.
  // Some browsers refuse an HTTP localhost iframe inside the HTTPS Designer.
  if (!config.production) app.use('/designer-dev', async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.sendStatus(405); return; }
    const upstream = await fetcher(`http://127.0.0.1:1337${req.path}`, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
    res.status(upstream.status).set('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  });
  // Production Compose exposes only Caddy, so exactly one proxy hop is trusted.
  app.set('trust proxy', config.trustProxy ?? 'loopback');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://cdn.whop.com'],
    styleSrc: ["'self'", "'unsafe-inline'"], connectSrc: ["'self'", 'https://*.whop.com'],
    frameSrc: ['https://*.whop.com'], frameAncestors: ['https://*.webflow.com', 'https://*.webflow-ext.com'],
    imgSrc: ["'self'", 'data:', 'https:'], upgradeInsecureRequests: config.production ? [] : null,
  } }, frameguard: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // Public storefront scripts must support SRI requests from any merchant domain.
  app.use('/runtime', (_req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); }, express.static(config.runtimeDir ?? path.join(config.root, 'dist/storefront'), { immutable: true, maxAge: '1y', index: false }));
  app.use((req, res, next) => {
    const requestOrigin = req.get('origin');
    if (requestOrigin && !allowed.has(requestOrigin)) { res.status(403).json({ error: 'Origin is not allowed.' }); return; }
    if (requestOrigin) { res.set('Access-Control-Allow-Origin', requestOrigin); res.vary('Origin'); }
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/auth', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(express.json({ limit: '20kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/auth/start', (_req, res) => {
    if (!config.clientId || !config.clientSecret) { res.status(503).send('Webflow app registration is not configured yet.'); return; }
    const state = store.newState();
    res.cookie('whop_webflow_state', state, { httpOnly: true, secure: config.publicUrl.startsWith('https:'), sameSite: 'lax', maxAge: 600_000, path: '/auth' });
    res.set('Cache-Control', 'no-store');
    res.redirect(WebflowClient.authorizeURL({ clientId: config.clientId, redirectUri: `${config.publicUrl}/auth/callback`, state, scope: [...SCOPES] }));
  });
  app.get('/auth/callback', async (req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('whop_webflow_state='))?.split('=')[1] ?? '';
    if (!/^[a-f0-9]{64}$/.test(state) || state.length !== cookie.length || !timingSafeEqual(Buffer.from(state), Buffer.from(cookie)) || !store.consumeState(state)) {
      res.status(400).send('This authorization has expired. Open the app and connect again.'); return;
    }
    res.clearCookie('whop_webflow_state', { path: '/auth' });
    if (req.query.error || typeof req.query.code !== 'string') { res.status(400).send('Authorization was canceled. You can reconnect from the app.'); return; }
    const token = await WebflowClient.getAccessToken({ clientId: config.clientId, clientSecret: config.clientSecret, code: req.query.code, redirectUri: `${config.publicUrl}/auth/callback` });
    const client = new WebflowClient({ accessToken: token });
    const { sites } = await client.sites.list();
    for (const site of sites ?? []) if (site.id) store.put(site.id, token);
    res.redirect('/connected.html');
  });
  app.post('/api/sites/:siteId/:action', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { siteId, action } = req.params;
    if (!/^[a-f0-9]{24}$/.test(siteId) || !['status', 'install', 'disconnect'].includes(action)) { res.sendStatus(400); return; }
    const idToken = req.get('authorization')?.replace(/^Bearer /, '');
    const token = store.get(siteId);
    if (!token || !idToken) { res.status(401).json({ error: 'Connect this site to Whop Checkout first.' }); return; }
    const verification = await fetcher('https://api.webflow.com/beta/token/resolve', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
    if (!verification.ok) { res.status(401).json({ error: 'Your Webflow session could not be verified. Reconnect and try again.' }); return; }
    const identity = await verification.json() as { id?: string; siteId?: string };
    if (!identity.id || identity.siteId !== siteId) { res.status(403).json({ error: 'This session does not have access to the selected site.' }); return; }
    const client = new WebflowClient({ accessToken: token });
    if (action === 'status') {
      const scripts = await readAppliedScripts(() => client.sites.scripts.getCustomCode(siteId));
      const ids = store.scriptIds(siteId);
      res.json({ connected: true, installed: ids.length === 1 && ids.every(id => scripts.some(script => script.id === id && script.version === VERSION)) }); return;
    }
    // Serialize read-modify-write operations from this service for each site.
    const previous = locks.get(siteId) ?? Promise.resolve();
    let release!: () => void;
    const lock = new Promise<void>(resolve => { release = resolve; });
    locks.set(siteId, lock);
    await previous;
    try {
      const owned = store.scriptIds(siteId);
      const additions: Script[] = [];
      if (action === 'install') {
        const manifest = JSON.parse(readFileSync(path.join(config.root, 'dist/storefront/manifest.json'), 'utf8')) as { file: string; integrity: string };
        const known = (await client.scripts.list(siteId)).registeredScripts ?? [];
        const specs = [
          { displayName: 'Whop Checkout Runtime', hostedLocation: `${config.publicUrl}/runtime/${manifest.file}`, integrityHash: manifest.integrity, version: VERSION, canCopy: true },
        ];
        for (const spec of specs) {
          const registered = known.find(script => script.displayName === spec.displayName && script.version === spec.version) ?? await client.scripts.registerHosted(siteId, spec);
          if (!registered.id) throw new Error('Webflow did not return a registered script ID.');
          if (registered.integrityHash && registered.integrityHash !== spec.integrityHash) throw new Error('Checkout code changed. Build a new script version before installing.');
          store.rememberScript(siteId, registered.id, spec.version);
          additions.push({ id: registered.id, version: spec.version, location: 'footer' });
        }
      }
      const current = await readAppliedScripts(() => client.sites.scripts.getCustomCode(siteId));
      await client.sites.scripts.upsertCustomCode(siteId, { scripts: mergeScripts(current, owned, additions) });
      store.replaceScripts(siteId, additions);
      if (action === 'disconnect') store.forget(siteId);
      res.json({ connected: action !== 'disconnect', installed: action === 'install', message: 'Publish the site in Webflow to apply this change.' });
    } finally { release(); if (locks.get(siteId) === lock) locks.delete(siteId); }
  });
  app.use('/extension', express.static(path.join(config.root, 'public')));
  app.use(express.static(path.join(config.root, 'site')));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : 500;
    // Do not log SDK request objects: they can contain OAuth credentials.
    console.error('Request failed', Number.isFinite(status) ? status : 500);
    res.status(status === 429 ? 429 : 502).json({ error: status === 429 ? 'Webflow is busy. Wait a moment and retry.' : 'The operation could not be completed. Check the connection and try again.' });
  });
  return app;
}
