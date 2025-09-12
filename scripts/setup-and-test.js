#!/usr/bin/env node

/**
 * Script completo de setup e teste
 * Executa seed do banco e depois smoke tests
 */

const { seedDatabase } = require('./seed-prisma');
const { runAllTests } = require('./smoke-tests');

async function setupAndTest() {
  console.log('🚀 INICIANDO SETUP COMPLETO E TESTES');
  console.log('='.repeat(60));
  
  try {
    // 1. Executar seed do banco
    console.log('\n📝 ETAPA 1: Carregando seeds.json no Postgres...');
    await seedDatabase();
    console.log('✅ Seeds carregados com sucesso!');
    
    // Aguardar um pouco para o banco processar
    console.log('\n⏳ Aguardando processamento do banco...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Executar smoke tests
    console.log('\n🧪 ETAPA 2: Executando smoke tests...');
    const testsPassed = await runAllTests();
    
    // 3. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL DO SETUP E TESTES');
    console.log('='.repeat(60));
    
    if (testsPassed) {
      console.log('🎉 SUCESSO TOTAL!');
      console.log('✅ Seeds carregados no Postgres');
      console.log('✅ Todos os smoke tests passaram');
      console.log('🚀 Sistema está funcionando perfeitamente');
      console.log('\n📋 Próximos passos:');
      console.log('   • Acesse http://localhost:3000 para ver a aplicação');
      console.log('   • Use /admin/dashboard para gerenciar a barbearia');
      console.log('   • Use /admin/super-admin para gerenciar tenants');
      console.log('   • Execute "npm run smoke:test" para rodar testes novamente');
    } else {
      console.log('❌ ALGUNS TESTES FALHARAM');
      console.log('✅ Seeds carregados no Postgres');
      console.log('🔍 Verifique os logs acima para identificar problemas');
      console.log('🔄 Execute "npm run smoke:test" para rodar testes novamente');
    }
    
    return testsPassed;
    
  } catch (error) {
    console.error('\n💥 ERRO FATAL DURANTE SETUP:', error.message);
    console.error('🔍 Verifique se:');
    console.error('   • O banco PostgreSQL está rodando');
    console.error('   • As variáveis de ambiente estão configuradas');
    console.error('   • O Prisma está configurado corretamente');
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAndTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { setupAndTest };
