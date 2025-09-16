#!/usr/bin/env node

/**
 * Script para verificar sincronização entre local e produção
 * Evita dessincronização entre ambiente local e Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔄 Verificando sincronização local ↔ produção...\n');

try {
  // 1. Verificar se há mudanças não commitadas
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (gitStatus.trim()) {
    console.log('⚠️  Mudanças não commitadas encontradas:');
    console.log(gitStatus);
    console.log('💡 Execute: git add . && git commit -m "sync changes" && git push');
    process.exit(1);
  }

  // 2. Verificar se está na branch main
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  
  if (currentBranch !== 'main') {
    console.log(`⚠️  Branch atual: ${currentBranch}`);
    console.log('💡 Execute: git checkout main');
    process.exit(1);
  }

  // 3. Verificar se está atualizado com origin
  execSync('git fetch origin', { stdio: 'pipe' });
  
  const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
  
  if (localCommit !== remoteCommit) {
    console.log('⚠️  Local não está sincronizado com origin/main');
    console.log('💡 Execute: git pull origin main');
    process.exit(1);
  }

  // 4. Verificar arquivos críticos
  const criticalFiles = [
    'src/app/page.tsx',
    'src/components/logo.tsx',
    'next.config.js',
    'package.json'
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.log(`❌ Arquivo crítico ausente: ${file}`);
      process.exit(1);
    }
  }

  console.log('✅ Sincronização OK!');
  console.log('🚀 Ambiente local está alinhado com produção');
  
} catch (error) {
  console.error('❌ Erro na verificação:', error.message);
  process.exit(1);
}
