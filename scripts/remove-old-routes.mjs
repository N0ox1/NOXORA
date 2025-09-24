import { promises as fs } from 'node:fs';
import { globby } from 'globby';

async function removeOldRoutes() {
  console.log('🗑️ Removendo rotas antigas...');
  
  // Encontrar todas as rotas antigas (exceto v1)
  const oldRoutes = await globby([
    'src/app/api/**/route.ts',
    '!src/app/api/v1/**/route.ts'
  ]);
  
  console.log(`📁 Encontradas ${oldRoutes.length} rotas antigas para remover`);
  
  for (const route of oldRoutes) {
    try {
      await fs.unlink(route);
      console.log(`✅ Removido: ${route}`);
    } catch (error) {
      console.error(`❌ Erro ao remover ${route}:`, error.message);
    }
  }
  
  // Remover diretórios vazios
  const dirs = await globby([
    'src/app/api/**/',
    '!src/app/api/v1/**/',
    '!src/app/api/'
  ]);
  
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      if (files.length === 0) {
        await fs.rmdir(dir);
        console.log(`✅ Diretório vazio removido: ${dir}`);
      }
    } catch (error) {
      // Ignorar erros de diretório não vazio
    }
  }
  
  console.log('🎉 Limpeza concluída!');
}

removeOldRoutes().catch(console.error);



















