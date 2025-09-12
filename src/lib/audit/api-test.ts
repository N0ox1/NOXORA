import { audit, clearAudit } from '../audit';

// Teste simples da API de audit
export async function testAuditAPI() {
  console.log('=== Teste da API de Audit ===\n');

  // 1. Limpar logs existentes
  clearAudit();
  console.log('1. Logs limpos para teste');

  // 2. Registrar alguns logs de teste
  console.log('\n2. Registrando logs de teste:');
  
  const testTenantId = 'tnt_api_test';
  
  audit({
    tenantId: testTenantId,
    actorId: 'user_123',
    action: 'LOGIN',
    entity: 'user',
    entityId: 'user_123'
  });
  
  audit({
    tenantId: testTenantId,
    actorId: 'user_123',
    action: 'CREATE',
    entity: 'appointment',
    entityId: 'apt_001',
    diff: { service: 'Corte', time: '14:00' }
  });
  
  audit({
    tenantId: testTenantId,
    actorId: 'user_456',
    action: 'UPDATE',
    entity: 'appointment',
    entityId: 'apt_001',
    diff: { status: 'CONFIRMED' }
  });
  
  console.log('  - ✅ 3 logs registrados para teste');

  // 3. Instruções para testar a API
  console.log('\n3. Para testar a API, execute:');
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" http://localhost:3000/api/audit`);
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" "http://localhost:3000/api/audit?limit=2"`);
  
  console.log('\n4. Ou use PowerShell:');
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/audit" -Headers @{"X-Tenant-Id"="${testTenantId}"}`);
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/audit?limit=2" -Headers @{"X-Tenant-Id"="${testTenantId}"}`);

  console.log('\n=== Teste da API configurado ===');
  console.log('Execute os comandos acima para verificar se a API está funcionando.');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testAuditAPI().catch(console.error);
}
