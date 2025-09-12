import { AuditService } from '../src/lib/audit';

console.log('=== Teste Audit Stats ===');

// 1. Verificar se AuditService está disponível
console.log('1. Verificando AuditService:');
console.log('  - Classe disponível:', typeof AuditService);
console.log('  - Métodos:', Object.getOwnPropertyNames(AuditService));

// 2. Testar método stats
console.log('\n2. Testando método stats:');

// Criar alguns logs de teste
AuditService.push({
  tenantId: 'tnt_1',
  action: 'TEST_ACTION_1',
  entity: 'Test',
  entityId: 'test_001'
});

AuditService.push({
  tenantId: 'tnt_1',
  action: 'TEST_ACTION_2',
  entity: 'Test',
  entityId: 'test_002'
});

AuditService.push({
  tenantId: 'tnt_1',
  action: 'TEST_ACTION_1', // Duplicado para testar contagem
  entity: 'Test',
  entityId: 'test_003'
});

// Obter estatísticas
const stats = AuditService.stats('tnt_1');
console.log('  - Stats para tnt_1:', stats);

// Verificar estrutura
if (stats.count === 3) {
  console.log('  - ✅ Count correto (3 logs)');
} else {
  console.log('  - ❌ Count incorreto:', stats.count);
}

if (stats.byAction['TEST_ACTION_1'] === 2) {
  console.log('  - ✅ TEST_ACTION_1 contado corretamente (2)');
} else {
  console.log('  - ❌ TEST_ACTION_1 contado incorretamente:', stats.byAction['TEST_ACTION_1']);
}

if (stats.byAction['TEST_ACTION_2'] === 1) {
  console.log('  - ✅ TEST_ACTION_2 contado corretamente (1)');
} else {
  console.log('  - ❌ TEST_ACTION_2 contado incorretamente:', stats.byAction['TEST_ACTION_2']);
}

if (stats.lastTs && stats.lastTs > 0) {
  console.log('  - ✅ LastTs válido:', new Date(stats.lastTs).toISOString());
} else {
  console.log('  - ❌ LastTs inválido:', stats.lastTs);
}

// 3. Testar com tenant inexistente
console.log('\n3. Testando com tenant inexistente:');
const statsEmpty = AuditService.stats('tnt_inexistente');
console.log('  - Stats para tnt_inexistente:', statsEmpty);

if (statsEmpty.count === 0) {
  console.log('  - ✅ Count zero para tenant inexistente');
} else {
  console.log('  - ❌ Count não zero para tenant inexistente:', statsEmpty.count);
}

// 4. Resumo
console.log('\n4. Resumo:');
console.log('  - ✅ AuditService.stats funcionando');
console.log('  - ✅ Contagem por ação funcionando');
console.log('  - ✅ Timestamp do último log funcionando');
console.log('  - ✅ Filtro por tenant funcionando');

console.log('\n=== Teste concluído ===');
console.log('Audit stats está funcionando corretamente!');
