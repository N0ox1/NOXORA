import { promises as fs } from 'node:fs';
import { globby } from 'globby';

const ROOT = process.cwd();
const FILES = await globby(['src/**/*.{ts,tsx}', '!**/node_modules/**', '!**/migrations/**']);
const offenders = [];
const PRISMA_CALL = /prisma\.(\w+)\.(findMany|findFirst|findUnique|update|updateMany|delete|deleteMany|upsert|create)\s*\(([^)]*)\)/gms;

for (const f of FILES) {
  const code = await fs.readFile(f, 'utf8');
  let m;
  while ((m = PRISMA_CALL.exec(code))) {
    const around = code.slice(Math.max(0, m.index - 120), Math.min(code.length, m.index + (m[0]?.length||0) + 120));
    if (/tenant-guard:allow/.test(around)) continue;
    const model = m[1];
    const action = m[2];
    const args = m[3] || '';
    const hasTenantWhere = /tenantId\s*:/.test(args); // tolerante a formatos
    const isCreate = action === 'create' && /data\s*:\s*{[^}]*tenantId\s*:/.test(args);
    const isUpdateMany = action === 'updateMany' && hasTenantWhere;
    const isDeleteMany = action === 'deleteMany' && hasTenantWhere;
    const ok = (
      args.includes('tenantId') ? true :
      action === 'create' ? isCreate :
      ['findMany','findFirst','update','delete','upsert','findUnique'].includes(action) ? hasTenantWhere :
      (isUpdateMany || isDeleteMany)
    );
    if (!ok) offenders.push({ file: f, model, action, sample: args.slice(0,140).replace(/\s+/g,' ') });
  }
}

if (offenders.length) {
  console.error('⚠️ Possíveis usos de Prisma SEM tenantId:');
  for (const o of offenders) console.error(`- ${o.file} :: ${o.model}.${o.action}(... ) -> ${o.sample}`);
  process.exitCode = 1;
} else {
  console.log('✅ Scan estático: todas as chamadas Prisma aparentam estar escopadas por tenantId.');
}
