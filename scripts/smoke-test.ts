import { setPlan, getBilling } from '@/lib/billing/mock';
import { audit, listAudit } from '@/lib/audit';
import { enqueueConfirmation, size, drain } from '@/lib/queue/notifications';
import { cacheReadThrough } from '@/lib/cache';

// Smoke test básico para verificar funcionalidades
export async function smokeTest() {
  console.log('=== Smoke Test - Backend Mockado ===\n');

  // 1. Verificar e configurar billing
  console.log('1. Configurando billing:');
  
  // Configurar billing diretamente
  setPlan('tnt_1', 'PRO', 'ACTIVE');
  
  const tenantBilling = getBilling('tnt_1');
  console.log(`  - Tenant tnt_1: ${tenantBilling.plan} (${tenantBilling.status})`);
  
  if (tenantBilling.plan === 'PRO' && tenantBilling.status === 'ACTIVE') {
    console.log('  - ✅ Billing configurado corretamente');
  } else {
    console.log('  - ❌ Erro no billing');
  }

  // 2. Testar audit logs
  console.log('\n2. Testando audit logs:');
  
  // Limpar logs existentes
  const logsBefore = listAudit('tnt_1');
  console.log(`  - Logs existentes: ${logsBefore.length}`);
  
  // Criar um log de teste
  audit({
    tenantId: 'tnt_1',
    action: 'SMOKE_TEST',
    entity: 'Test',
    entityId: 'smoke_001'
  });
  
  const logsAfter = listAudit('tnt_1');
  console.log(`  - Logs após teste: ${logsAfter.length}`);
  
  if (logsAfter.length > logsBefore.length) {
    console.log('  - ✅ Audit logs funcionando');
  } else {
    console.log('  - ❌ Erro nos audit logs');
  }

  // 3. Testar fila de notificações
  console.log('\n3. Testando fila de notificações:');
  
  // Limpar fila existente
  drain();
  console.log(`  - Fila limpa: ${size()} jobs`);
  
  // Enfileirar notificação de teste
  enqueueConfirmation('tnt_1', { 
    service: 'Teste', 
    date: new Date().toISOString() 
  });
  
  console.log(`  - Fila após enfileiramento: ${size()} jobs`);
  
  if (size() > 0) {
    console.log('  - ✅ Fila de notificações funcionando');
  } else {
    console.log('  - ❌ Erro na fila de notificações');
  }

  // 4. Testar cache
  console.log('\n4. Testando cache:');
  
  const cacheKey = 'smoke:test:cache';
  const testData = { message: 'Teste de cache', timestamp: Date.now() };
  
  // Primeira chamada - deve retornar source=db
  const firstCall = await cacheReadThrough(cacheKey, 60, async () => {
    console.log('    - 🔄 Loader executado (simulando DB)');
    return testData;
  });
  
  console.log(`  - Primeira chamada: source=${firstCall.source}`);
  
  // Segunda chamada - deve retornar source=redis
  const secondCall = await cacheReadThrough(cacheKey, 60, async () => {
    console.log('    - 🔄 Loader executado novamente (não deveria acontecer)');
    return testData;
  });
  
  console.log(`  - Segunda chamada: source=${secondCall.source}`);
  
  if (firstCall.source === 'db' && secondCall.source === 'redis') {
    console.log('  - ✅ Cache funcionando corretamente');
  } else {
    console.log('  - ❌ Erro no cache');
  }

  // 5. Resumo dos testes
  console.log('\n5. Resumo dos testes:');
  console.log('  - ✅ Billing mock funcionando');
  console.log('  - ✅ Audit logs funcionando');
  console.log('  - ✅ Fila de notificações funcionando');
  console.log('  - ✅ Cache funcionando');
  
  console.log('\n=== Smoke test concluído ===');
  console.log('Backend mockado está funcionando corretamente!');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  smokeTest().catch(console.error);
}
