import { AuditService } from './src/lib/audit/audit-service';

console.log('=== Teste das Correções do Sistema de Auditoria ===');

async function testAuditService() {
  try {
    console.log('1. Testando criação de log de auditoria...');
    
    // Teste básico de criação de log
    await AuditService.log({
      tenantId: 'test-tenant-123',
      userId: 'test-user-456',
      action: 'CREATE',
      resource: 'TEST_ENTITY',
      resourceId: 'test-entity-789',
      details: {
        testField: 'testValue',
        timestamp: new Date().toISOString()
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Test Agent',
      traceId: 'trace-123',
      spanId: 'span-456'
    });
    
    console.log('  ✅ Log de auditoria criado com sucesso');
    
    // Teste de consulta
    console.log('\n2. Testando consulta de logs...');
    const logs = await AuditService.query({
      tenantId: 'test-tenant-123',
      limit: 10
    });
    
    console.log(`  ✅ Encontrados ${logs.length} logs para o tenant`);
    if (logs.length > 0) {
      console.log('  - Primeiro log:', {
        id: logs[0].id,
        action: logs[0].action,
        entity: logs[0].entity,
        entityId: logs[0].entityId,
        tenantId: logs[0].tenantId
      });
    }
    
    // Teste de estatísticas
    console.log('\n3. Testando estatísticas...');
    const stats = await AuditService.getStats('test-tenant-123', 30);
    
    console.log('  ✅ Estatísticas obtidas:', {
      totalLogs: stats.totalLogs,
      statsCount: stats.stats.length,
      period: stats.period
    });
    
    // Teste de limpeza
    console.log('\n4. Testando limpeza de logs antigos...');
    const deletedCount = await AuditService.cleanupOldLogs('test-tenant-123', 0); // 0 dias = deletar todos
    
    console.log(`  ✅ ${deletedCount} logs antigos removidos`);
    
    console.log('\n=== Todos os testes passaram! ===');
    console.log('✅ Sistema de auditoria funcionando corretamente após as correções');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
  }
}

testAuditService();
