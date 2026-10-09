import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export class Store {
  constructor(dir) { this.dir = dir; }
  async init() { await mkdir(this.dir, { recursive: true }); }
  async create(value) { const record = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...value }; return this.save(record); }
  async save(record) { await writeFile(path.join(this.dir, `${record.id}.json`), JSON.stringify(record, null, 2), { mode: 0o600 }); return record; }
  async get(id) { const safe = String(id).replace(/[^a-f0-9-]/gi,''); return JSON.parse(await readFile(path.join(this.dir, `${safe}.json`), 'utf8')); }
  async list() {
    const files = (await readdir(this.dir)).filter(x => x.endsWith('.json'));
    const rows = await Promise.all(files.map(x => readFile(path.join(this.dir,x),'utf8').then(JSON.parse)));
    return rows.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(({ id, createdAt, status, result, input, review }) => ({ id, createdAt, status, component: input.component, overall: result.overall, decision: result.decision, review }));
  }
}
