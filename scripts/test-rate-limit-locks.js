#!/usr/bin/env node

/**
 * Script para testar o sistema de rate limiting e locks otimistas
 * Testa limites de taxa, locks concorrentes e agendamentos simultâneos
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
      rateLimitLimit: response.headers.get('X-RateLimit-Limit'),
      rateLimitRemaining: response.headers.get('X-RateLimit-Remaining'),
      rateLimitReset: response.headers.get('X-RateLimit-Reset'),
      retryAfter: response.headers.get('Retry-After'),
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Função para testar rate limiting global
async function testGlobalRateLimit() {
  console.log('\n🌐 Testando rate limiting global (600 req/min/IP)...');
  
  const tenantId = 'tenant_1';
  const requests = [];
  
  // Fazer 10 requisições para testar
  for (let i = 0; i < 10; i++) {
    const result = await makeRequest(`${BASE_URL}/api/services`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
    
    requests.push(result);
    
    if (result.error) {
      console.error(`    ❌ Requisição ${i + 1} falhou:`, result.error);
      continue;
    }
    
    console.log(`    📝 Requisição ${i + 1}: Status ${result.status}, Rate Limit: ${result.rateLimitRemaining}/${result.rateLimitLimit}`);
    
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successfulRequests = requests.filter(r => r.status === 200).length;
  const rateLimitedRequests = requests.filter(r => r.status === 429).length;
  
  console.log(`\n📊 Resultado do teste global:`);
  console.log(`    ✅ Requisições bem-sucedidas: ${successfulRequests}`);
  console.log(`    🚫 Requisições limitadas: ${rateLimitedRequests}`);
  
  return successfulRequests > 0;
}

// Função para testar rate limiting público
async function testPublicRateLimit() {
  console.log('\n🏢 Testando rate limiting público (60 req/min/IP+tenant+slug)...');
  
  const tenantId = 'tenant_1';
  const slug = 'test-slug';
  const requests = [];
  
  // Fazer 15 requisições para testar (deve exceder o limite de 60/min)
  for (let i = 0; i < 15; i++) {
    const result = await makeRequest(`${BASE_URL}/api/services`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
    
    requests.push(result);
    
    if (result.error) {
      console.error(`    ❌ Requisição ${i + 1} falhou:`, result.error);
      continue;
    }
    
    console.log(`    📝 Requisição ${i + 1}: Status ${result.status}, Rate Limit: ${result.rateLimitRemaining}/${result.rateLimitLimit}`);
    
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const successfulRequests = requests.filter(r => r.status === 200).length;
  const rateLimitedRequests = requests.filter(r => r.status === 429).length;
  
  console.log(`\n📊 Resultado do teste público:`);
  console.log(`    ✅ Requisições bem-sucedidas: ${successfulRequests}`);
  console.log(`    🚫 Requisições limitadas: ${rateLimitedRequests}`);
  
  return rateLimitedRequests > 0; // Deve ter algumas requisições limitadas
}

// Função para testar rate limiting por endpoint
async function testEndpointRateLimit() {
  console.log('\n🔐 Testando rate limiting por endpoint (30 req/min para agendamentos)...');
  
  const tenantId = 'tenant_1';
  const requests = [];
  
  // Fazer 35 requisições para testar (deve exceder o limite de 30/min)
  for (let i = 0; i < 35; i++) {
    const result = await makeRequest(`${BASE_URL}/api/appointments`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
    
    requests.push(result);
    
    if (result.error) {
      console.error(`    ❌ Requisição ${i + 1} falhou:`, result.error);
      continue;
    }
    
    console.log(`    📝 Requisição ${i + 1}: Status ${result.status}, Rate Limit: ${result.rateLimitRemaining}/${result.rateLimitLimit}`);
    
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const successfulRequests = requests.filter(r => r.status === 200).length;
  const rateLimitedRequests = requests.filter(r => r.status === 429).length;
  
  console.log(`\n📊 Resultado do teste de endpoint:`);
  console.log(`    ✅ Requisições bem-sucedidas: ${successfulRequests}`);
  console.log(`    🚫 Requisições limitadas: ${rateLimitedRequests}`);
  
  return rateLimitedRequests > 0; // Deve ter algumas requisições limitadas
}

// Função para testar locks otimistas
async function testOptimisticLocks() {
  console.log('\n🔒 Testando locks otimistas...');
  
  const tenantId = 'tenant_1';
  
  // Testar obtenção de lock
  const lockResult = await makeRequest(`${BASE_URL}/api/rate-limit/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_lock',
      data: {
        resourceType: 'appointment',
        resourceId: 'test-slot',
      },
    }),
  });
  
  if (lockResult.error || lockResult.status !== 200) {
    console.error('    ❌ Erro ao testar locks:', lockResult.error || lockResult.status);
    return false;
  }
  
  console.log('    ✅ Teste de locks executado com sucesso');
  console.log(`    📊 Resultado:`, lockResult.data.result);
  
  return true;
}

// Função para testar agendamentos concorrentes
async function testConcurrentAppointments() {
  console.log('\n⏰ Testando agendamentos concorrentes (locks otimistas)...');
  
  const tenantId = 'tenant_1';
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Amanhã
  
  // Simular duas requisições simultâneas para o mesmo horário
  const concurrentRequests = await Promise.all([
    makeRequest(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        barbershop_id: 'shop_1',
        employee_id: 'emp_1',
        client_id: 'cli_1',
        service_id: 'srv_1',
        start_at: startAt,
        duration_min: 30,
        notes: 'Teste concorrente 1',
      }),
    }),
    makeRequest(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        barbershop_id: 'shop_1',
        employee_id: 'emp_1',
        client_id: 'cli_1',
        service_id: 'srv_1',
        start_at: startAt,
        duration_min: 30,
        notes: 'Teste concorrente 2',
      }),
    }),
  ]);
  
  console.log('    📝 Resultados dos agendamentos concorrentes:');
  
  let successCount = 0;
  let conflictCount = 0;
  
  for (let i = 0; i < concurrentRequests.length; i++) {
    const result = concurrentRequests[i];
    
    if (result.error) {
      console.error(`        ❌ Requisição ${i + 1} falhou:`, result.error);
      continue;
    }
    
    if (result.status === 201) {
      console.log(`        ✅ Requisição ${i + 1}: Agendamento criado com sucesso`);
      successCount++;
    } else if (result.status === 409) {
      console.log(`        🔒 Requisição ${i + 1}: Conflito detectado (esperado)`);
      conflictCount++;
    } else {
      console.log(`        ⚠️ Requisição ${i + 1}: Status inesperado ${result.status}`);
    }
  }
  
  console.log(`\n📊 Resultado dos agendamentos concorrentes:`);
  console.log(`    ✅ Agendamentos criados: ${successCount}`);
  console.log(`    🔒 Conflitos detectados: ${conflictCount}`);
  
  // Deve ter exatamente 1 sucesso e 1 conflito
  const isWorking = successCount === 1 && conflictCount === 1;
  
  if (isWorking) {
    console.log('    🎉 Locks otimistas funcionando perfeitamente!');
  } else {
    console.log('    ⚠️ Locks otimistas com problemas');
  }
  
  return isWorking;
}

// Função para testar rota de teste
async function testTestRoute() {
  console.log('\n🧪 Testando rota de teste de rate limiting e locks...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/rate-limit/test`, {
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
    console.log('📊 Estatísticas de rate limiting:', result.data.rateLimit.stats);
    console.log('🔒 Estatísticas de locks:', result.data.locks.stats);
    return true;
  } else {
    console.error('❌ Status inesperado:', result.status);
    return false;
  }
}

// Função para testar teste de agendamentos concorrentes via rota de teste
async function testConcurrentAppointmentsViaTestRoute() {
  console.log('\n🔄 Testando agendamentos concorrentes via rota de teste...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/rate-limit/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_concurrent_appointments',
      data: {
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
      },
    }),
  });
  
  if (result.error || result.status !== 200) {
    console.error('❌ Erro ao testar agendamentos concorrentes:', result.error || result.status);
    return false;
  }
  
  console.log('✅ Teste de agendamentos concorrentes executado');
  console.log('📊 Resultado:', result.data.result);
  
  const summary = result.data.result.summary;
  const isWorking = summary.totalRequests === 2 && summary.successfulLocks === 1 && summary.conflicts === 1;
  
  if (isWorking) {
    console.log('🎉 Teste de agendamentos concorrentes passou!');
  } else {
    console.log('⚠️ Teste de agendamentos concorrentes falhou');
  }
  
  return isWorking;
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes do sistema de rate limiting e locks...\n');

  const tests = [
    { name: 'Rate Limiting Global', fn: testGlobalRateLimit },
    { name: 'Rate Limiting Público', fn: testPublicRateLimit },
    { name: 'Rate Limiting por Endpoint', fn: testEndpointRateLimit },
    { name: 'Locks Otimistas', fn: testOptimisticLocks },
    { name: 'Agendamentos Concorrentes', fn: testConcurrentAppointments },
    { name: 'Rota de Teste', fn: testTestRoute },
    { name: 'Agendamentos Concorrentes via Test Route', fn: testConcurrentAppointmentsViaTestRoute },
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
    console.log('\n🎉 Todos os testes passaram! Sistema de rate limiting e locks funcionando perfeitamente.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique o sistema.');
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testGlobalRateLimit,
  testPublicRateLimit,
  testEndpointRateLimit,
  testOptimisticLocks,
  testConcurrentAppointments,
  testTestRoute,
  testConcurrentAppointmentsViaTestRoute,
};
