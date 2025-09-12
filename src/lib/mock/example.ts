import { redis, withLock } from './redis';
import { cacheReadThrough } from '../cache';

// Exemplo de uso das funcionalidades implementadas
export async function demonstrateMockRedis() {
  console.log('=== Demonstração Mock Redis + Lock + Cache ===\n');

  // 1. Teste do cacheReadThrough
  console.log('1. Testando cacheReadThrough:');
  
  let callCount = 0;
  const loader = async () => {
    callCount++;
    console.log(`  - Loader chamado pela ${callCount}ª vez`);
    return { data: 'dados do banco', id: callCount, timestamp: Date.now() };
  };

  // Primeira chamada - deve retornar source=db
  const result1 = await cacheReadThrough('user:123', 60, loader);
  console.log(`  - Primeira chamada: source=${result1.source}, id=${result1.data.id}`);
  
  // Segunda chamada - deve retornar source=redis
  const result2 = await cacheReadThrough('user:123', 60, loader);
  console.log(`  - Segunda chamada: source=${result2.source}, id=${result2.data.id}`);
  console.log(`  - Total de chamadas ao loader: ${callCount}\n`);

  // 2. Teste do withLock
  console.log('2. Testando withLock:');
  
  const key = 'appointment:456';
  const ttlSec = 5;
  
  try {
    // Primeira execução deve funcionar
    console.log('  - Executando primeira operação...');
    const result1 = await withLock(key, ttlSec, async () => {
      console.log('    * Lock adquirido, executando operação...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Simula trabalho
      console.log('    * Operação concluída, liberando lock...');
      return 'primeira operação';
    });
    console.log(`  - Resultado: ${result1}`);
    
    // Segunda execução concorrente deve falhar
    console.log('  - Tentando execução concorrente...');
    const result2 = await withLock(key, ttlSec, async () => {
      return 'segunda operação';
    });
    console.log(`  - Resultado: ${result2}`);
    
  } catch (error: any) {
    console.log(`  - Erro esperado: ${error.message} (code: ${error.code})`);
  }

  // 3. Teste de TTL
  console.log('\n3. Testando TTL:');
  await redis.set('temp-key', 'valor temporário', 0.1); // 100ms
  console.log('  - Chave criada com TTL de 100ms');
  console.log(`  - Valor imediato: ${await redis.get('temp-key')}`);
  
  await new Promise(resolve => setTimeout(resolve, 150));
  console.log(`  - Valor após 150ms: ${await redis.get('temp-key')}`);

  // 4. Teste de setnx
  console.log('\n4. Testando setnx:');
  const setnxResult1 = await redis.setnx('unique-key', 'valor único');
  console.log(`  - Primeira tentativa: ${setnxResult1}`);
  
  const setnxResult2 = await redis.setnx('unique-key', 'outro valor');
  console.log(`  - Segunda tentativa: ${setnxResult2}`);
  
  console.log(`  - Valor final: ${await redis.get('unique-key')}`);

  console.log('\n=== Demonstração concluída ===');
}

// Executar demonstração se chamado diretamente
if (require.main === module) {
  demonstrateMockRedis().catch(console.error);
}
