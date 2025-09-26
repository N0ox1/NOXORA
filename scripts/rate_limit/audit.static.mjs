import { promises as fs } from 'node:fs';
import { globby } from 'globby';

const files = await globby(['src/**/*.{ts,tsx}', '!**/node_modules/**']);
const hits = [];
const patterns = [
  /Ratelimit|rateLimit|rate-limiter|limiter/i,
  /Upstash.*Ratelimit/i,
  /kv|redis/i,
  /x-forwarded-for/i
];

for (const f of files){
  const code = await fs.readFile(f,'utf8');
  if (patterns.some(p=>p.test(code))) hits.push(f);
}

if (hits.length){
  console.log('🔎 Indícios de rate limit encontrados:');
  hits.forEach(f=>console.log(' -',f));
} else {
  console.log('⚠️ Nenhum indício claro de rate limit no código. O teste dinâmico ainda pode detectar 429.');
}




















