import Database from 'better-sqlite3';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';

const dataDir = process.env.DATA_DIR ?? './data';
const output = process.argv[2] ?? path.join(dataDir, 'backups', `app-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
if (existsSync(output)) throw new Error('Refusing to overwrite an existing backup.');
mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
process.umask(0o077);
const database = new Database(path.join(dataDir, 'app.sqlite'), { readonly: true, fileMustExist: true });
try { await database.backup(output); }
finally { database.close(); }
chmodSync(output, 0o600);
const backup = new Database(output, { readonly: true });
try { if (backup.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('Backup integrity check failed.'); }
finally { backup.close(); }
console.log(`Verified SQLite backup: ${output}`);
