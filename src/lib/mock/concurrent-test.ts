import { withLock } from './redis';

// Teste específico para verificar o comportamento concorrente do withLock
export async function testConcurrentLock() {
  console.log('=== Teste de Lock Concorrente ===\n');
  
  const key = 'concurrent-test';
  const ttlSec = 5;
  
  console.log('Executando duas operações concorrentes no mesmo key...\n');
  
  // Primeira execução (deve funcionar)
  const firstExecution = withLock(key, ttlSec, async () => {
    console.log('🔒 Lock 1: Adquirido, executando operação...');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simula trabalho
    console.log('🔓 Lock 1: Operação concluída, liberando...');
    return 'primeira operação';
  });

  // Segunda execução concorrente (deve falhar)
  const secondExecution = withLock(key, ttlSec, async () => {
    console.log('🔒 Lock 2: Adquirido, executando operação...');
    return 'segunda operação';
  });

  // Executar ambas simultaneamente
  console.log('Iniciando execuções...\n');
  
  const startTime = Date.now();
  const [firstResult, secondError] = await Promise.allSettled([
    firstExecution,
    secondExecution
  ]);
  const endTime = Date.now();

  console.log('\n=== Resultados ===');
  console.log(`Tempo total: ${endTime - startTime}ms`);
  
  // Verificar primeira execução
  if (firstResult.status === 'fulfilled') {
    console.log('✅ Primeira execução: SUCESSO');
    console.log(`   Resultado: ${firstResult.value}`);
  } else {
    console.log('❌ Primeira execução: FALHOU');
    console.log(`   Erro: ${firstResult.reason}`);
  }
  
  // Verificar segunda execução
  if (secondError.status === 'rejected') {
    console.log('✅ Segunda execução: FALHOU (como esperado)');
    console.log(`   Erro: ${secondError.reason.message}`);
    console.log(`   Código: ${secondError.reason.code}`);
    
    // Verificar se o erro tem o formato correto
    if (secondError.reason.code === 'LOCKED') {
      console.log('✅ Código de erro correto: LOCKED');
    } else {
      console.log('❌ Código de erro incorreto');
    }
  } else {
    console.log('❌ Segunda execução: SUCESSO (não deveria)');
    console.log(`   Resultado: ${secondError.value}`);
  }

  console.log('\n=== Teste concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testConcurrentLock().catch(console.error);
}
