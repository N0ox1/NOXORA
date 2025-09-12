#!/usr/bin/env node

/**
 * Script para testar o sistema de cache Redis
 * Testa read-through, TTL, chaves estruturadas e headers de CDN
 */

const BASE_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { 
      status: response.status, 
      data, 
      headers: response.headers,
      cacheSource: response.headers.get('X-Cache-Source'),
      cacheKey: response.headers.get('X-Cache-Key'),
      cacheTTL: response.headers.get('X-Cache-TTL'),
      cacheControl: response.headers.get('Cache-Control'),
      sMaxAge: response.headers.get('s-maxage'),
      staleWhileRevalidate: response.headers.get('stale-while-revalidate'),
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Função para testar cache read-through
async function testCacheReadThrough() {
  console.log('\n🔄 Testando cache read-through...');
  
  const tenantId = 'tenant_1';
  
  // Teste 1: Primeira requisição (deve ser MISS)
  console.log('  📝 Teste 1: Primeira requisição (esperado: MISS)');
  const result1 = await makeRequest(`${BASE_URL}/api/services`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });

  if (result1.error) {
    console.error('    ❌ Erro na requisição:', result1.error);
    return false;
  }

  if (result1.status === 200) {
    console.log(`    ✅ Status: ${result1.status}`);
    console.log(`    📊 Cache Source: ${result1.cacheSource}`);
    console.log(`    🔑 Cache Key: ${result1.cacheKey}`);
    console.log(`    ⏰ Cache TTL: ${result1.cacheTTL}s`);
    console.log(`    📋 Cache Control: ${result1.cacheControl}`);
    console.log(`    🚀 s-maxage: ${result1.sMaxAge}s`);
    console.log(`    🔄 stale-while-revalidate: ${result1.staleWhileRevalidate}s`);
  } else {
    console.log(`    ❌ Status inesperado: ${result1.status}`);
    return false;
  }

  // Aguardar um pouco para simular tempo entre requisições
  console.log('  ⏳ Aguardando 2 segundos...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Segunda requisição (deve ser HIT)
  console.log('  📝 Teste 2: Segunda requisição (esperado: HIT)');
  const result2 = await makeRequest(`${BASE_URL}/api/services`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });

  if (result2.error) {
    console.error('    ❌ Erro na requisição:', result1.error);
    return false;
  }

  if (result2.status === 200) {
    console.log(`    ✅ Status: ${result2.status}`);
    console.log(`    📊 Cache Source: ${result2.cacheSource}`);
    console.log(`    🔑 Cache Key: ${result2.cacheKey}`);
    console.log(`    ⏰ Cache TTL: ${result2.cacheTTL}s`);
  } else {
    console.log(`    ❌ Status inesperado: ${result2.status}`);
    return false;
  }

  // Verificar se o cache está funcionando
  const isWorking = result1.cacheSource === 'database' && result2.cacheSource === 'cache';
  
  if (isWorking) {
    console.log('  🎉 Cache read-through funcionando perfeitamente!');
    console.log(`    🔴 Primeira requisição: ${result1.cacheSource} (MISS)`);
    console.log(`    🟢 Segunda requisição: ${result2.cacheSource} (HIT)`);
  } else {
    console.log('  ⚠️ Cache read-through com problemas:');
    console.log(`    Primeira requisição: ${result1.cacheSource}`);
    console.log(`    Segunda requisição: ${result2.cacheSource}`);
  }

  return isWorking;
}

// Função para testar diferentes tipos de cache
async function testDifferentCacheTypes() {
  console.log('\n🧪 Testando diferentes tipos de cache...');
  
  const tenantId = 'tenant_1';
  const tests = [
    { name: 'Serviços', endpoint: '/api/services', expectedTTL: 120 },
    { name: 'Funcionários', endpoint: '/api/employees', expectedTTL: 180 },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`  📝 Testando: ${test.name}`);
    
    const result = await makeRequest(`${BASE_URL}${test.endpoint}`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });

    if (result.error) {
      console.error(`    ❌ Erro: ${result.error}`);
      continue;
    }

    if (result.status === 200) {
      console.log(`    ✅ Status: ${result.status}`);
      console.log(`    📊 Cache Source: ${result.cacheSource}`);
      console.log(`    🔑 Cache Key: ${result.cacheKey}`);
      console.log(`    ⏰ Cache TTL: ${result.cacheTTL}s`);
      console.log(`    📋 Cache Control: ${result.cacheControl}`);
      
      // Verificar se os headers de CDN estão corretos
      const hasCDNHeaders = result.cacheControl && result.sMaxAge && result.staleWhileRevalidate;
      if (hasCDNHeaders) {
        console.log(`    🚀 Headers CDN: OK`);
        passedTests++;
      } else {
        console.log(`    ⚠️ Headers CDN: Faltando`);
      }
    } else {
      console.log(`    ❌ Status: ${result.status}`);
    }
  }

  console.log(`\n📊 Resultado: ${passedTests}/${totalTests} tipos de cache funcionando`);
  return passedTests === totalTests;
}

// Função para testar invalidação de cache
async function testCacheInvalidation() {
  console.log('\n🗑️ Testando invalidação de cache...');
  
  const tenantId = 'tenant_1';
  
  // 1. Fazer uma requisição para popular o cache
  console.log('  📝 Passo 1: Populando cache');
  const result1 = await makeRequest(`${BASE_URL}/api/services`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });

  if (result1.error || result1.status !== 200) {
    console.error('    ❌ Erro ao popular cache');
    return false;
  }

  console.log(`    ✅ Cache populado: ${result1.cacheSource}`);

  // 2. Criar um novo serviço para invalidar o cache
  console.log('  📝 Passo 2: Criando novo serviço (invalida cache)');
  const result2 = await makeRequest(`${BASE_URL}/api/services`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      name: 'Serviço Teste Cache',
      description: 'Serviço para testar invalidação',
      duration_min: 45,
      price_cents: 6000,
      barbershop_id: 'shop_1',
    }),
  });

  if (result2.error || result2.status !== 201) {
    console.error('    ❌ Erro ao criar serviço');
    return false;
  }

  console.log(`    ✅ Serviço criado: ${result2.data.message}`);
  console.log(`    🗑️ Cache invalidado: ${result2.data.cache.invalidated}`);

  // 3. Fazer nova requisição (deve ser MISS novamente)
  console.log('  📝 Passo 3: Nova requisição (esperado: MISS após invalidação)');
  const result3 = await makeRequest(`${BASE_URL}/api/services`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });

  if (result3.error || result3.status !== 200) {
    console.error('    ❌ Erro na nova requisição');
    return false;
  }

  console.log(`    ✅ Nova requisição: ${result3.cacheSource}`);
  
  const invalidationWorking = result3.cacheSource === 'database';
  
  if (invalidationWorking) {
    console.log('  🎉 Invalidação de cache funcionando!');
  } else {
    console.log('  ⚠️ Invalidação de cache com problemas');
  }

  return invalidationWorking;
}

// Função para testar rota de teste de cache
async function testCacheTestRoute() {
  console.log('\n🧪 Testando rota de teste de cache...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/cache/test`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });

  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }

  if (result.status === 200) {
    console.log('✅ Rota de teste funcionando');
    console.log('📊 Estatísticas do cache:', result.data.stats);
    console.log('🧪 Resultados dos testes:', result.data.testResults);
    
    // Verificar se todos os testes passaram
    const allTestsPassed = Object.values(result.data.testResults).every(test => test.success);
    
    if (allTestsPassed) {
      console.log('🎉 Todos os testes de cache passaram!');
    } else {
      console.log('⚠️ Alguns testes de cache falharam');
    }
    
    return allTestsPassed;
  } else {
    console.error('❌ Status inesperado:', result.status);
    return false;
  }
}

// Função para testar operações de cache via POST
async function testCacheOperations() {
  console.log('\n⚙️ Testando operações de cache via POST...');
  
  const tenantId = 'tenant_1';
  const testKey = `test:${tenantId}:${Date.now()}`;
  const testValue = { message: 'Valor de teste', timestamp: Date.now() };
  
  // Teste 1: Definir cache
  console.log('  📝 Teste 1: Definindo cache');
  const setResult = await makeRequest(`${BASE_URL}/api/cache/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'set',
      data: { key: testKey, value: testValue, ttl: 60 },
    }),
  });

  if (setResult.error || setResult.status !== 200) {
    console.error('    ❌ Erro ao definir cache');
    return false;
  }

  console.log(`    ✅ Cache definido: ${setResult.data.result.key}`);

  // Teste 2: Obter cache
  console.log('  📝 Teste 2: Obtendo cache');
  const getResult = await makeRequest(`${BASE_URL}/api/cache/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'get',
      data: { key: testKey },
    }),
  });

  if (getResult.error || getResult.status !== 200) {
    console.error('    ❌ Erro ao obter cache');
    return false;
  }

  console.log(`    ✅ Cache obtido: ${JSON.stringify(getResult.data.result.value)}`);

  // Teste 3: Remover cache
  console.log('  📝 Teste 3: Removendo cache');
  const delResult = await makeRequest(`${BASE_URL}/api/cache/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'del',
      data: { key: testKey },
    }),
  });

  if (delResult.error || delResult.status !== 200) {
    console.error('    ❌ Erro ao remover cache');
    return false;
  }

  console.log(`    ✅ Cache removido: ${delResult.data.result.key}`);

  return true;
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes do sistema de cache...\n');

  const tests = [
    { name: 'Cache Read-Through', fn: testCacheReadThrough },
    { name: 'Diferentes Tipos de Cache', fn: testDifferentCacheTypes },
    { name: 'Invalidação de Cache', fn: testCacheInvalidation },
    { name: 'Rota de Teste de Cache', fn: testCacheTestRoute },
    { name: 'Operações de Cache', fn: testCacheOperations },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n📋 Executando: ${test.name}`);
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name}: PASSOU`);
      } else {
        console.log(`❌ ${test.name}: FALHOU`);
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERRO -`, error.message);
    }
  }

  console.log('\n📊 Resumo dos testes:');
  console.log(`✅ Testes passaram: ${passedTests}/${totalTests}`);
  console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram! Sistema de cache funcionando perfeitamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique o sistema.');
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testCacheReadThrough,
  testDifferentCacheTypes,
  testCacheInvalidation,
  testCacheTestRoute,
  testCacheOperations,
};
