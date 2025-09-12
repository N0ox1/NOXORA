import { 
  seedBilling, 
  getBilling, 
  setPlan, 
  getEntitlements, 
  enforceLimits, 
  plansList,
  type TenantBilling 
} from './mock';
import { ensureWithinLimits } from './guards';

// Teste das funcionalidades de billing
export async function testMockBilling() {
  console.log('=== Teste Mock Billing + enforceLimits ===\n');

  // 1. Teste de seed e getBilling
  console.log('1. Testando seed e getBilling:');
  const testTenants: TenantBilling[] = [
    { tenantId: 'tnt_1', plan: 'STARTER', status: 'ACTIVE' },
    { tenantId: 'tnt_2', plan: 'PRO', status: 'TRIALING' },
    { tenantId: 'tnt_3', plan: 'SCALE', status: 'ACTIVE' }
  ];
  
  seedBilling(testTenants);
  
  for (const tenant of testTenants) {
    const billing = getBilling(tenant.tenantId);
    console.log(`  - ${tenant.tenantId}: ${billing.plan} (${billing.status})`);
  }
  
  // Teste de tenant inexistente
  const defaultBilling = getBilling('tnt_999');
  console.log(`  - tnt_999 (inexistente): ${defaultBilling.plan} (${defaultBilling.status})`);

  // 2. Teste de setPlan
  console.log('\n2. Testando setPlan:');
  const newBilling = setPlan('tnt_4', 'PRO', 'ACTIVE');
  console.log(`  - Novo tenant criado: ${newBilling.tenantId} -> ${newBilling.plan} (${newBilling.status})`);
  
  // Atualizar plano existente
  const updatedBilling = setPlan('tnt_1', 'SCALE', 'ACTIVE');
  console.log(`  - Plano atualizado: ${updatedBilling.tenantId} -> ${updatedBilling.plan} (${updatedBilling.status})`);

  // 3. Teste de getEntitlements
  console.log('\n3. Testando getEntitlements:');
  for (const plan of ['STARTER', 'PRO', 'SCALE'] as const) {
    const ent = getEntitlements('tnt_999'); // Usar tenant padrão
    setPlan('tnt_999', plan);
    const entitlements = getEntitlements('tnt_999');
    console.log(`  - ${plan}: ${entitlements.shopsAllowed} shops, ${entitlements.seatsAllowed} seats, ${entitlements.reminders_month} reminders/mês`);
  }

  // 4. Teste de enforceLimits
  console.log('\n4. Testando enforceLimits:');
  
  // Teste dentro dos limites
  const withinLimits = enforceLimits('tnt_1', { shops: 5, seats: 10, remindersUsed: 500 });
  console.log(`  - Dentro dos limites: ${withinLimits.ok ? '✅' : '❌'}`);
  
  // Teste excedendo limite de shops
  const shopsExceeded = enforceLimits('tnt_1', { shops: 10, seats: 5, remindersUsed: 100 });
  console.log(`  - Shops excedidos: ${shopsExceeded.ok ? '✅' : '❌'} - ${shopsExceeded.ok ? 'OK' : `Campo: ${shopsExceeded.field}, Permitido: ${shopsExceeded.allowed}`}`);
  
  // Teste excedendo limite de seats
  const seatsExceeded = enforceLimits('tnt_1', { shops: 1, seats: 50, remindersUsed: 100 });
  console.log(`  - Seats excedidos: ${seatsExceeded.ok ? '✅' : '❌'} - ${seatsExceeded.ok ? 'OK' : `Campo: ${seatsExceeded.field}, Permitido: ${seatsExceeded.allowed}`}`);
  
  // Teste excedendo limite de reminders
  const remindersExceeded = enforceLimits('tnt_1', { shops: 1, seats: 5, remindersUsed: 5000 });
  console.log(`  - Reminders excedidos: ${remindersExceeded.ok ? '✅' : '❌'} - ${remindersExceeded.ok ? 'OK' : `Campo: ${remindersExceeded.field}, Permitido: ${remindersExceeded.allowed}`}`);

  // 5. Teste de plansList
  console.log('\n5. Testando plansList:');
  const plans = plansList();
  for (const plan of plans) {
    console.log(`  - ${plan.code}: $${plan.price_month}/mês - ${plan.limits.shopsAllowed} shops, ${plan.limits.seatsAllowed} seats`);
  }

  // 6. Teste de ensureWithinLimits
  console.log('\n6. Testando ensureWithinLimits:');
  
  try {
    // Teste dentro dos limites
    ensureWithinLimits('tnt_2', 'shops', { shops: 3, seats: 15 });
    console.log('  - ✅ Dentro dos limites: OK');
  } catch (error: any) {
    console.log(`  - ❌ Dentro dos limites: ${error.message}`);
  }
  
  try {
    // Teste excedendo limites
    ensureWithinLimits('tnt_2', 'shops', { shops: 10, seats: 25 });
    console.log('  - ✅ Excedendo limites: OK (não deveria)');
  } catch (error: any) {
    console.log(`  - ❌ Excedendo limites: ${error.message} (status: ${error.status}, code: ${error.code}, field: ${error.field}, allowed: ${error.allowed})`);
  }

  console.log('\n=== Teste concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testMockBilling().catch(console.error);
}
