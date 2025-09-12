import { setPlan, getBilling } from '@/lib/billing/mock';

console.log('=== Teste Billing ===');

// Verificar estado inicial
console.log('Estado inicial:');
const initialBilling = getBilling('tnt_1');
console.log('  - tnt_1:', initialBilling);

// Tentar setar o plano
console.log('\nSetando plano PRO para tnt_1...');
setPlan('tnt_1', 'PRO', 'ACTIVE');

// Verificar estado após set
console.log('\nEstado após setPlan:');
const afterBilling = getBilling('tnt_1');
console.log('  - tnt_1:', afterBilling);

// Verificar se mudou
if (afterBilling.plan === 'PRO' && afterBilling.status === 'ACTIVE') {
  console.log('  - ✅ Plano alterado com sucesso');
} else {
  console.log('  - ❌ Plano não foi alterado');
  console.log('  - Esperado: PRO, ACTIVE');
  console.log('  - Atual:', afterBilling.plan, afterBilling.status);
}
