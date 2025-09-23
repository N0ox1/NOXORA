import { promises as fs } from 'node:fs';
import { globby } from 'globby';
import path from 'node:path';

async function migrateToV1() {
  console.log('🚀 Iniciando migração para v1...');
  
  // Encontrar todas as rotas da API (exceto v1 e openapi.json)
  const routes = await globby([
    'src/app/api/**/route.ts',
    '!src/app/api/v1/**/route.ts',
    '!src/app/api/openapi.json/**/route.ts'
  ]);
  
  console.log(`📁 Encontradas ${routes.length} rotas para migrar`);
  
  for (const route of routes) {
    try {
      // Extrair o caminho relativo dentro de /api/
      const relativePath = route.replace('src/app/api/', '');
      const v1Path = `src/app/api/v1/${relativePath}`;
      
      // Criar diretório de destino
      const dir = path.dirname(v1Path);
      await fs.mkdir(dir, { recursive: true });
      
      // Copiar arquivo
      await fs.copyFile(route, v1Path);
      
      console.log(`✅ ${relativePath} → v1/${relativePath}`);
    } catch (error) {
      console.error(`❌ Erro ao migrar ${route}:`, error.message);
    }
  }
  
  console.log('🎉 Migração concluída!');
}

migrateToV1().catch(console.error);

















