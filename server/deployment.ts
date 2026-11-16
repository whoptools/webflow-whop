import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function readSecret(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const file = env[`${name}_FILE`];
  if (file && env[name]) throw new Error(`Set only ${name} or ${name}_FILE, not both.`);
  return file ? readFileSync(file, 'utf8').trim() : env[name] ?? '';
}

export function parseTrustProxy(value = 'loopback'): string | number {
  if (value === '1') return 1;
  if (value === 'loopback') return value;
  throw new Error('TRUST_PROXY must be loopback or 1 (one private reverse proxy).');
}

/** Retain immutable scripts referenced by sites that have not yet republished. */
export function archiveRuntimes(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  for (const file of readdirSync(source)) {
    const match = /^checkout-([a-f0-9]{16})\.js$/.exec(file);
    if (!match) continue;
    const bytes = readFileSync(path.join(source, file));
    if (createHash('sha256').update(bytes).digest('hex').slice(0, 16) !== match[1]) throw new Error('Checkout runtime content does not match its filename.');
    writeFileSync(path.join(destination, file), bytes, { mode: 0o600 });
  }
}
