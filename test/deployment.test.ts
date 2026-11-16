import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { archiveRuntimes, parseTrustProxy, readSecret } from '../server/deployment';
import { Store } from '../server/store';

void test('Docker secrets load from files and conflicting sources fail closed', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'whop-secret-'));
  try {
    const file = path.join(root, 'key'); writeFileSync(file, 'example-secret\n', { mode: 0o600 });
    assert.equal(readSecret('KEY', { KEY_FILE: file }), 'example-secret');
    assert.equal(readSecret('KEY', { KEY: 'environment-value' }), 'environment-value');
    assert.throws(() => readSecret('KEY', { KEY_FILE: file, KEY: 'conflict' }));
    assert.throws(() => readSecret('KEY', { KEY_FILE: path.join(root, 'missing') }));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

void test('proxy configuration rejects blanket trust and supports one isolated edge proxy', () => {
  assert.equal(parseTrustProxy(), 'loopback'); assert.equal(parseTrustProxy('1'), 1);
  for (const value of ['true', '*', '2', '0.0.0.0/0']) assert.throws(() => parseTrustProxy(value));
});

void test('upgrades retain old published runtimes and reject mismatched content hashes', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'whop-runtime-upgrade-'));
  const source = path.join(root, 'build'), archive = path.join(root, 'persisted');
  mkdirSync(source);
  const filename = (bytes: string) => `checkout-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.js`;
  try {
    writeFileSync(path.join(source, filename('old')), 'old');
    writeFileSync(path.join(source, 'manifest.json'), '{}');
    archiveRuntimes(source, archive);
    rmSync(path.join(source, filename('old')));
    writeFileSync(path.join(source, filename('new')), 'new');
    archiveRuntimes(source, archive);
    assert.equal(readFileSync(path.join(archive, filename('old')), 'utf8'), 'old');
    assert.equal(readFileSync(path.join(archive, filename('new')), 'utf8'), 'new');
    assert.throws(() => readFileSync(path.join(archive, 'manifest.json')));
    writeFileSync(path.join(source, filename('new')), 'tampered');
    assert.throws(() => archiveRuntimes(source, archive));
    assert.equal(readFileSync(path.join(archive, filename('new')), 'utf8'), 'new');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

void test('online backup includes committed WAL data and can restore encrypted connections', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'whop-backup-'));
  const key = randomBytes(32).toString('hex');
  const source = new Store(path.join(root, 'app.sqlite'), key);
  try {
    source.put('test-site', 'test-oauth-token');
    const output = path.join(root, 'backups', 'snapshot.sqlite');
    execFileSync(process.execPath, ['scripts/backup.mjs', output], { env: { ...process.env, DATA_DIR: root } });
    const restored = new Store(output, key);
    try { assert.equal(restored.get('test-site'), 'test-oauth-token'); }
    finally { restored.db.close(); }
    assert.equal(readFileSync(output).includes('test-oauth-token'), false);
  } finally { source.db.close(); rmSync(root, { recursive: true, force: true }); }
});
