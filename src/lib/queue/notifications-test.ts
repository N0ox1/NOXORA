import { 
  enqueue, 
  enqueueReminder, 
  enqueueConfirmation, 
  size, 
  drain, 
  processJobs,
  type NotificationJob 
} from './notifications';
import { TEMPLATES, render } from '@/lib/notifications/templates';

// Teste das funcionalidades de notifications queue
export async function testNotificationsQueue() {
  console.log('=== Teste Notifications Queue Mock ===\n');

  // 1. Teste de import e compilação
  console.log('1. Testando import e compilação:');
  console.log('  - ✅ Import de { enqueueReminder, enqueueConfirmation } compila');
  console.log('  - ✅ Templates disponíveis:', Object.keys(TEMPLATES));

  // 2. Teste de templates e renderização
  console.log('\n2. Testando templates e renderização:');
  
  const testData = { service: 'Corte Masculino', date: '2025-08-30', time: '14:00', shop: 'Barber Labs' };
  
  for (const [key, template] of Object.entries(TEMPLATES)) {
    const rendered = render(template.text, testData);
    console.log(`  - ${key}: ${rendered}`);
  }

  // 3. Teste de enfileiramento
  console.log('\n3. Testando enfileiramento:');
  
  const tenantId = 'tnt_notif_test';
  
  // Enfileirar jobs de teste
  enqueueReminder(tenantId, { service: 'Corte', time: '14:00', shop: 'Barber Labs Centro' });
  enqueueConfirmation(tenantId, { service: 'Corte', date: '2025-08-30' });
  
  console.log(`  - Jobs enfileirados: ${size()}`);
  
  if (size() === 2) {
    console.log('  - ✅ Enfileiramento funcionando');
  } else {
    console.log('  - ❌ Erro no enfileiramento');
  }

  // 4. Teste de processamento de jobs
  console.log('\n4. Testando processamento de jobs:');
  
  const beforeSize = size();
  const result = processJobs(10);
  
  console.log(`  - Jobs antes: ${beforeSize}`);
  console.log(`  - Jobs processados: ${result.processed}`);
  console.log(`  - Jobs restantes: ${size()}`);
  
  if (result.processed === 2 && size() === 0) {
    console.log('  - ✅ Processamento funcionando');
  } else {
    console.log('  - ❌ Erro no processamento');
  }

  // 5. Teste de resultados
  console.log('\n5. Testando resultados do processamento:');
  
  for (const jobResult of result.results) {
    console.log(`  - Job ${jobResult.id}:`);
    console.log(`    - Tenant: ${jobResult.tenantId}`);
    console.log(`    - Channel: ${jobResult.channel}`);
    console.log(`    - Message: ${jobResult.message}`);
  }

  // 6. Teste de fila vazia
  console.log('\n6. Testando fila vazia:');
  
  const emptyResult = processJobs(10);
  console.log(`  - Jobs processados: ${emptyResult.processed}`);
  console.log(`  - Tamanho da fila: ${size()}`);
  
  if (emptyResult.processed === 0) {
    console.log('  - ✅ Fila vazia funcionando');
  } else {
    console.log('  - ❌ Erro com fila vazia');
  }

  // 7. Teste de múltiplos tenants
  console.log('\n7. Testando múltiplos tenants:');
  
  const tenant1 = 'tnt_1';
  const tenant2 = 'tnt_2';
  
  enqueueReminder(tenant1, { service: 'Barba', time: '15:00', shop: 'Shop 1' });
  enqueueConfirmation(tenant2, { service: 'Corte', date: '2025-08-31' });
  enqueueReminder(tenant1, { service: 'Corte', time: '16:00', shop: 'Shop 1' });
  
  console.log(`  - Total na fila: ${size()}`);
  
  // Processar apenas 2 jobs
  const partialResult = processJobs(2);
  console.log(`  - Jobs processados: ${partialResult.processed}`);
  console.log(`  - Jobs restantes: ${size()}`);
  
  if (partialResult.processed === 2 && size() === 1) {
    console.log('  - ✅ Processamento parcial funcionando');
  } else {
    console.log('  - ❌ Erro no processamento parcial');
  }

  // 8. Teste de drain
  console.log('\n8. Testando drain:');
  
  const remainingJobs = drain();
  console.log(`  - Jobs drenados: ${remainingJobs.length}`);
  console.log(`  - Fila após drain: ${size()}`);
  
  if (remainingJobs.length === 1 && size() === 0) {
    console.log('  - ✅ Drain funcionando');
  } else {
    console.log('  - ❌ Erro no drain');
  }

  console.log('\n=== Teste concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testNotificationsQueue().catch(console.error);
}
