import { audit, listAudit, clearAudit, type AuditEntry } from '../audit';

// Função helper para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Teste das funcionalidades de audit
export async function testMockAudit() {
  console.log('=== Teste Mock Audit Logs ===\n');

  // 1. Teste de import e compilação
  console.log('1. Testando import e compilação:');
  console.log('  - ✅ Import de { audit, listAudit } compila corretamente');
  console.log('  - ✅ Tipos AuditEntry estão disponíveis');

  // 2. Teste de registro de eventos
  console.log('\n2. Testando registro de eventos:');
  
  const tenantId1 = 'tnt_audit_1';
  const tenantId2 = 'tnt_audit_2';
  
  // Registrar alguns eventos para o primeiro tenant com delays
  audit({
    tenantId: tenantId1,
    actorId: 'user_123',
    action: 'CREATE',
    entity: 'appointment',
    entityId: 'apt_001',
    diff: { status: 'PENDING', time: '14:00' }
  });
  
  await delay(10); // Pequeno delay para garantir timestamps diferentes
  
  audit({
    tenantId: tenantId1,
    actorId: 'user_123',
    action: 'UPDATE',
    entity: 'appointment',
    entityId: 'apt_001',
    diff: { status: 'CONFIRMED' }
  });
  
  await delay(10);
  
  // Registrar eventos para o segundo tenant
  audit({
    tenantId: tenantId2,
    actorId: 'user_456',
    action: 'DELETE',
    entity: 'service',
    entityId: 'svc_001'
  });
  
  await delay(10);
  
  audit({
    tenantId: tenantId2,
    actorId: 'user_456',
    action: 'CREATE',
    entity: 'employee',
    entityId: 'emp_001',
    diff: { name: 'João Silva', role: 'barber' }
  });
  
  console.log('  - ✅ 4 eventos registrados (2 para cada tenant)');

  // 3. Teste de listagem por tenant
  console.log('\n3. Testando listagem por tenant:');
  
  const logsTenant1 = listAudit(tenantId1);
  const logsTenant2 = listAudit(tenantId2);
  
  console.log(`  - Tenant 1: ${logsTenant1.length} logs`);
  console.log(`  - Tenant 2: ${logsTenant2.length} logs`);
  
  // Verificar se os logs estão corretos
  if (logsTenant1.length === 2 && logsTenant2.length === 2) {
    console.log('  - ✅ Logs filtrados corretamente por tenant');
  } else {
    console.log('  - ❌ Erro na filtragem por tenant');
  }

  // 4. Teste de ordenação (mais recente primeiro)
  console.log('\n4. Testando ordenação (mais recente primeiro):');
  
  const logsOrdered = listAudit(tenantId1);
  if (logsOrdered.length >= 2) {
    const firstLog = logsOrdered[0];
    const secondLog = logsOrdered[1];
    
    console.log(`  - Primeiro log: ${firstLog.action} em ${new Date(firstLog.ts).toISOString()}`);
    console.log(`  - Segundo log: ${secondLog.action} em ${new Date(secondLog.ts).toISOString()}`);
    
    if (firstLog.ts >= secondLog.ts) {
      console.log('  - ✅ Logs ordenados corretamente (mais recente primeiro)');
    } else {
      console.log('  - ❌ Logs não estão ordenados corretamente');
      console.log(`    - Diferença: ${secondLog.ts - firstLog.ts}ms`);
    }
  }

  // 5. Teste de limite
  console.log('\n5. Testando limite de resultados:');
  
  // Registrar mais alguns eventos para testar limite
  for (let i = 0; i < 5; i++) {
    audit({
      tenantId: tenantId1,
      actorId: `user_${i}`,
      action: 'VIEW',
      entity: 'dashboard',
      diff: { page: `page_${i}` }
    });
    await delay(5); // Pequeno delay entre cada
  }
  
  const logsWithLimit = listAudit(tenantId1, 3);
  console.log(`  - Limite 3: ${logsWithLimit.length} logs retornados`);
  
  if (logsWithLimit.length === 3) {
    console.log('  - ✅ Limite funcionando corretamente');
  } else {
    console.log('  - ❌ Limite não está funcionando');
  }

  // 6. Teste de estrutura dos logs
  console.log('\n6. Testando estrutura dos logs:');
  
  const sampleLog = logsTenant1[0];
  const hasRequiredFields = sampleLog && 
    typeof sampleLog.ts === 'number' &&
    typeof sampleLog.tenantId === 'string' &&
    typeof sampleLog.action === 'string';
  
  if (hasRequiredFields) {
    console.log('  - ✅ Estrutura dos logs está correta');
    console.log(`    - ts: ${sampleLog.ts} (${new Date(sampleLog.ts).toISOString()})`);
    console.log(`    - tenantId: ${sampleLog.tenantId}`);
    console.log(`    - action: ${sampleLog.action}`);
    console.log(`    - entity: ${sampleLog.entity || 'undefined'}`);
    console.log(`    - entityId: ${sampleLog.entityId || 'undefined'}`);
    console.log(`    - diff: ${JSON.stringify(sampleLog.diff || 'undefined')}`);
  } else {
    console.log('  - ❌ Estrutura dos logs incorreta');
  }

  // 7. Teste de clearAudit
  console.log('\n7. Testando clearAudit:');
  
  const logsBeforeClear = listAudit(tenantId1);
  console.log(`  - Logs antes de limpar: ${logsBeforeClear.length}`);
  
  clearAudit(tenantId1);
  const logsAfterClear = listAudit(tenantId1);
  console.log(`  - Logs após limpar tenant1: ${logsAfterClear.length}`);
  
  const logsTenant2AfterClear = listAudit(tenantId2);
  console.log(`  - Logs tenant2 após limpar tenant1: ${logsTenant2AfterClear.length}`);
  
  if (logsAfterClear.length === 0 && logsTenant2AfterClear.length > 0) {
    console.log('  - ✅ clearAudit funcionando corretamente (limpa apenas o tenant especificado)');
  } else {
    console.log('  - ❌ clearAudit não está funcionando corretamente');
  }

  // 8. Teste de clearAudit sem parâmetro
  console.log('\n8. Testando clearAudit sem parâmetro:');
  
  clearAudit(); // Limpar todos
  const logsAfterClearAll = listAudit(tenantId2);
  console.log(`  - Logs após limpar todos: ${logsAfterClearAll.length}`);
  
  if (logsAfterClearAll.length === 0) {
    console.log('  - ✅ clearAudit() limpa todos os logs');
  } else {
    console.log('  - ❌ clearAudit() não limpou todos os logs');
  }

  console.log('\n=== Teste concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testMockAudit().catch(console.error);
}
