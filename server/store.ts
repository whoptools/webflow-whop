import Database from 'better-sqlite3';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export class Store {
  db: Database.Database;
  key: Buffer;
  constructor(path: string, encryptionKey: string) {
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters.');
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec('CREATE TABLE IF NOT EXISTS connections (site TEXT PRIMARY KEY, token TEXT NOT NULL); CREATE TABLE IF NOT EXISTS oauth_states (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS scripts (site TEXT NOT NULL, id TEXT NOT NULL, version TEXT NOT NULL, PRIMARY KEY(site,id));');
  }
  seal(value: string): string {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
  }
  unseal(value: string): string {
    const data = Buffer.from(value, 'base64'), decipher = createDecipheriv('aes-256-gcm', this.key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
  }
  put(site: string, token: string): void { this.db.prepare('INSERT OR REPLACE INTO connections VALUES (?,?)').run(site, this.seal(token)); }
  get(site: string): string | null {
    const row = this.db.prepare('SELECT token FROM connections WHERE site=?').get(site) as { token: string } | undefined;
    return row ? this.unseal(row.token) : null;
  }
  forget(site: string): void { this.db.prepare('DELETE FROM connections WHERE site=?').run(site); }
  newState(): string {
    this.db.prepare('DELETE FROM oauth_states WHERE expires < ?').run(Date.now());
    const value = randomBytes(32).toString('hex');
    this.db.prepare('INSERT INTO oauth_states VALUES (?,?)').run(this.hash(value), Date.now() + 600_000);
    return value;
  }
  consumeState(value: string): boolean {
    return !!this.db.prepare('DELETE FROM oauth_states WHERE hash=? AND expires>? RETURNING hash').get(this.hash(value), Date.now());
  }
  hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
  rememberScript(site: string, id: string, version: string): void { this.db.prepare('INSERT OR REPLACE INTO scripts VALUES (?,?,?)').run(site, id, version); }
  replaceScripts(site: string, scripts: { id: string; version: string }[]): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM scripts WHERE site=?').run(site);
      for (const script of scripts) this.rememberScript(site, script.id, script.version);
    })();
  }
  scriptIds(site: string): string[] { return (this.db.prepare('SELECT id FROM scripts WHERE site=?').all(site) as {id: string}[]).map(row => row.id); }
}
