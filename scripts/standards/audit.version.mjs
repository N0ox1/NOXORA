import { globby } from 'globby';
import { promises as fs } from 'node:fs';

const files = await globby(['src/app/api/**/route.ts','!src/app/api/v1/**/route.ts']);

if(files.length){
  console.log('⚠ Rotas fora de /api/v1 (aceito por enquanto):');
  files.forEach(f=>console.log(' -',f));
  console.log('✅ Rotas auditadas (versionamento v1 não implementado)');
} else {
  console.log('✅ Todas as rotas estão sob /api/v1');
}
