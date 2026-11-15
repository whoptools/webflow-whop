import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Store } from './store';
import { createApp } from './app';
import { archiveRuntimes, parseTrustProxy, readSecret } from './deployment';
const root = process.cwd();
const dataDir = process.env.DATA_DIR ?? path.join(root, 'data');
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const runtimeDir = path.join(dataDir, 'runtime');
archiveRuntimes(path.join(root, 'dist/storefront'), runtimeDir);
const store = new Store(path.join(dataDir, 'app.sqlite'), readSecret('TOKEN_ENCRYPTION_KEY'));
const app = createApp({ root, publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:4319', clientId: process.env.WEBFLOW_CLIENT_ID ?? '',
  clientSecret: readSecret('WEBFLOW_CLIENT_SECRET'), allowedOrigins: (process.env.EXTENSION_ORIGINS ?? '').split(',').filter(Boolean), production: process.env.NODE_ENV === 'production', runtimeDir, trustProxy: parseTrustProxy(process.env.TRUST_PROXY) }, store);
app.listen(Number(process.env.PORT ?? 4319), process.env.BIND_HOST ?? '127.0.0.1', () => console.log('Whop Checkout service listening on port', process.env.PORT ?? 4319));
