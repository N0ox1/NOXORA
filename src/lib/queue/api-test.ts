import { enqueueConfirmation, enqueueReminder, size, drain } from './notifications';

// Teste simples das APIs de notifications
export async function testNotificationsAPI() {
  console.log('=== Teste das APIs de Notifications ===\n');

  // 1. Limpar fila existente
  drain(); // Limpar todos os jobs
  console.log('1. Fila limpa para teste');

  // 2. Registrar alguns jobs de teste
  console.log('\n2. Registrando jobs de teste:');
  
  const testTenantId = 'tnt_api_notif_test';
  
  // Enfileirar reminder
  enqueueReminder(testTenantId, { service: 'Corte', time: '14:00', shop: 'Barber Labs Centro' });
  console.log('  - ✅ Reminder enfileirado');
  
  // Enfileirar confirmation
  enqueueConfirmation(testTenantId, { service: 'Corte', date: '2025-08-30' });
  console.log('  - ✅ Confirmation enfileirado');
  
  console.log(`  - Total na fila: ${size()}`);

  // 3. Instruções para testar a API
  console.log('\n3. Para testar a API, execute:');
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" -X POST http://localhost:3000/api/notifications/test -d '{"kind":"reminder"}'`);
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" -X POST http://localhost:3000/api/notifications/test -d '{"kind":"confirmation"}'`);
  console.log(`   curl -X POST http://localhost:3000/api/jobs/run`);
  
  console.log('\n4. Ou use PowerShell:');
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/test" -Method POST -Headers @{"X-Tenant-Id"="${testTenantId}"} -Body '{"kind":"reminder"}'`);
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/test" -Method POST -Headers @{"X-Tenant-Id"="${testTenantId}"} -Body '{"kind":"confirmation"}'`);
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/run" -Method POST`);

  console.log('\n=== Teste da API configurado ===');
  console.log('Execute os comandos acima para verificar se a API está funcionando.');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testNotificationsAPI().catch(console.error);
}
