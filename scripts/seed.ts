// Seeds mockados: ajusta billing inicial e imprime instruções de teste.
import { setPlan } from '@/lib/billing/mock';

async function main() {
  // Tenants seed (mock)
  const tenants = [
    { tenantId: 'tnt_1', plan: 'PRO' as const, status: 'ACTIVE' as const }
  ];
  
  for (const t of tenants) {
    setPlan(t.tenantId, t.plan, t.status);
  }

  // Output de referência para smoke manual
  console.log('[seed] tenants:', tenants);
  console.log('[seed] pronto. Rode os smokes:');
  console.log('- GET /api/health');
  console.log('- GET /api/barbershop/public/barber-labs-centro (com X-Tenant-Id: tnt_1)');
  console.log('- POST /api/appointments (com X-Tenant-Id: tnt_1)');
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .then(() => process.exit(0));
