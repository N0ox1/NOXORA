import { setPlan, getBilling, enforceLimits } from './mock';
import { ensureWithinLimits } from './guards';

// Teste simples das funcionalidades de billing
export async function testBillingAPI() {
  console.log('=== Teste das APIs de Billing ===\n');

  // 1. Teste de setPlan e getBilling
  console.log('1. Testando setPlan e getBilling:');
  const testTenantId = 'tnt_api_test';
  
  // Definir plano
  const billing = setPlan(testTenantId, 'PRO', 'ACTIVE');
  console.log(`  - Plano definido: ${billing.plan} (${billing.status})`);
  
  // Verificar se foi salvo
  const retrievedBilling = getBilling(testTenantId);
  console.log(`  - Plano recuperado: ${retrievedBilling.plan} (${retrievedBilling.status})`);
  
  // Verificar se são iguais
  const isEqual = billing.plan === retrievedBilling.plan && billing.status === retrievedBilling.status;
  console.log(`  - Dados consistentes: ${isEqual ? '✅' : '❌'}`);

  // 2. Teste de enforceLimits
  console.log('\n2. Testando enforceLimits:');
  
  // Teste dentro dos limites (PRO: 5 shops, 20 seats, 1000 reminders)
  const withinLimits = enforceLimits(testTenantId, { shops: 3, seats: 15, remindersUsed: 500 });
  console.log(`  - Dentro dos limites: ${withinLimits.ok ? '✅' : '❌'}`);
  
  // Teste excedendo limite de shops
  const shopsExceeded = enforceLimits(testTenantId, { shops: 10, seats: 15, remindersUsed: 500 });
  console.log(`  - Shops excedidos: ${shopsExceeded.ok ? '✅' : '❌'} - ${shopsExceeded.ok ? 'OK' : `Campo: ${shopsExceeded.field}, Permitido: ${shopsExceeded.allowed}`}`);
  
  // Teste excedendo limite de seats
  const seatsExceeded = enforceLimits(testTenantId, { shops: 3, seats: 25, remindersUsed: 500 });
  console.log(`  - Seats excedidos: ${seatsExceeded.ok ? '✅' : '❌'} - ${seatsExceeded.ok ? 'OK' : `Campo: ${seatsExceeded.field}, Permitido: ${seatsExceeded.allowed}`}`);

  // 3. Teste de ensureWithinLimits
  console.log('\n3. Testando ensureWithinLimits:');
  
  try {
    // Teste dentro dos limites
    ensureWithinLimits(testTenantId, 'shops', { shops: 3, seats: 15 });
    console.log('  - ✅ Dentro dos limites: OK');
  } catch (error: any) {
    console.log(`  - ❌ Dentro dos limites: ${error.message}`);
  }
  
  try {
    // Teste excedendo limites
    ensureWithinLimits(testTenantId, 'shops', { shops: 10, seats: 25 });
    console.log('  - ✅ Excedendo limites: OK (não deveria)');
  } catch (error: any) {
    console.log(`  - ❌ Excedendo limites: ${error.message} (status: ${error.status}, code: ${error.code}, field: ${error.field}, allowed: ${error.allowed})`);
  }

  // 4. Simulação de webhook
  console.log('\n4. Simulando webhook do Stripe:');
  
  // Simular evento de webhook
  const webhookEvent = {
    data: {
      object: {
        items: [{ price: { lookup_key: 'SCALE' } }],
        metadata: { tenantId: testTenantId },
        status: 'ACTIVE'
      }
    }
  };
  
  // Processar webhook (simular o que a rota faz)
  const plan = webhookEvent.data.object.items[0].price.lookup_key;
  const tenantId = webhookEvent.data.object.metadata.tenantId;
  const status = webhookEvent.data.object.status;
  
  console.log(`  - Webhook recebido: plan=${plan}, tenantId=${tenantId}, status=${status}`);
  
  // Aplicar mudança
  const updatedBilling = setPlan(tenantId, plan as any, status as any);
  console.log(`  - Plano atualizado via webhook: ${updatedBilling.plan} (${updatedBilling.status})`);
  
  // Verificar se os limites mudaram
  const newLimits = enforceLimits(tenantId, { shops: 10, seats: 25, remindersUsed: 500 });
  console.log(`  - Novos limites (SCALE): ${newLimits.ok ? '✅' : '❌'} - ${newLimits.ok ? 'OK' : `Campo: ${newLimits.field}, Permitido: ${newLimits.allowed}`}`);

  console.log('\n=== Teste das APIs concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testBillingAPI().catch(console.error);
}
