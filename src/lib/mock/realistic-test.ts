import { withLock } from './redis';

// Teste mais realista para verificar o comportamento do lock
export async function testRealisticLock() {
  console.log('=== Teste Realista de Lock ===\n');
  
  const key = 'realistic-test';
  const ttlSec = 0.2; // 200ms para teste mais rápido
  
  console.log('Simulando execuções sequenciais que tentam acessar o mesmo recurso...\n');
  
  // Função que simula uma operação crítica
  const criticalOperation = async (id: string) => {
    console.log(`🚀 ${id}: Iniciando operação crítica...`);
    
    try {
      const result = await withLock(key, ttlSec, async () => {
        console.log(`🔒 ${id}: Lock adquirido, executando operação...`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simula trabalho mais rápido
        console.log(`🔓 ${id}: Operação concluída, liberando lock...`);
        return `resultado de ${id}`;
      });
      
      console.log(`✅ ${id}: Sucesso - ${result}`);
      return { success: true, result };
      
    } catch (error: any) {
      console.log(`❌ ${id}: Falhou - ${error.message} (code: ${error.code})`);
      return { success: false, error: error.message, code: error.code };
    }
  };
  
  // Executar operações sequencialmente para simular concorrência real
  console.log('1. Primeira operação (deve funcionar):');
  const result1 = await criticalOperation('Op1');
  
  console.log('\n2. Segunda operação imediatamente após (deve falhar):');
  const result2 = await criticalOperation('Op2');
  
  console.log('\n3. Terceira operação após o TTL do lock (deve funcionar):');
  const waitTime = Math.ceil(ttlSec * 1000) + 50; // Aguarda TTL + margem
  console.log(`   Aguardando ${waitTime}ms para o lock expirar...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  const result3 = await criticalOperation('Op3');
  
  console.log('\n=== Resumo dos Resultados ===');
  console.log(`Op1: ${result1.success ? 'SUCESSO' : 'FALHOU'} - ${result1.success ? result1.result : result1.error}`);
  console.log(`Op2: ${result2.success ? 'SUCESSO' : 'FALHOU'} - ${result2.success ? result2.result : result2.error}`);
  console.log(`Op3: ${result3.success ? 'SUCESSO' : 'FALHOU'} - ${result3.success ? result3.result : result3.error}`);
  
  // Verificar se o comportamento está correto
  const expectedBehavior = 
    result1.success && 
    !result2.success && 
    result2.code === 'LOCKED' && 
    result3.success;
    
  if (expectedBehavior) {
    console.log('\n🎉 Comportamento CORRETO: Lock está funcionando como esperado!');
  } else {
    console.log('\n⚠️  Comportamento INCORRETO: Lock não está funcionando como esperado.');
  }
  
  console.log('\n=== Teste concluído ===');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testRealisticLock().catch(console.error);
}
