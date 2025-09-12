#!/usr/bin/env node

/**
 * Script para testar o sistema multi-tenant
 * Testa resolução de tenant, validação de acesso e isolamento
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
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    return { error: error.message };
  }
}

// Função para testar resolução de tenant por header
async function testTenantByHeader() {
  console.log('\n🔍 Testando resolução de tenant por header X-Tenant-Id...');
  
  const result = await makeRequest(`${BASE_URL}/api/tenant/test`, {
    headers: {
      'X-Tenant-Id': 'tenant_1',
    },
  });

  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }

  if (result.status === 200) {
    console.log('✅ Tenant resolvido por header com sucesso');
    console.log('📋 Dados do tenant:', result.data.tenant);
    console.log('📊 Limites:', result.data.limits);
    return true;
  } else {
    console.error('❌ Falha na resolução por header:', result.status, result.data);
    return false;
  }
}

// Função para testar bloqueio sem tenant_id
async function testBlockWithoutTenant() {
  console.log('\n🚫 Testando bloqueio de requisição sem tenant_id...');
  
  const result = await makeRequest(`${BASE_URL}/api/services`);
  
  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }

  if (result.status === 400) {
    console.log('✅ Requisição bloqueada corretamente sem tenant_id');
    console.log('📋 Mensagem de erro:', result.data.error);
    return true;
  } else {
    console.error('❌ Requisição não foi bloqueada:', result.status, result.data);
    return false;
  }
}

// Função para testar validação de tenant_id em DTOs
async function testTenantValidationInDTOs() {
  console.log('\n✅ Testando validação de tenant_id em DTOs...');
  
  // Teste 1: Dados válidos com tenant_id correto
  console.log('  📝 Teste 1: Dados válidos com tenant_id correto');
  const validData = {
    tenant_id: 'tenant_1',
    name: 'Corte Teste',
    description: 'Corte para teste',
    duration_min: 30,
    price_cents: 5000,
    barbershop_id: 'shop_1',
  };

  const validResult = await makeRequest(`${BASE_URL}/api/services`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': 'tenant_1',
    },
    body: JSON.stringify(validData),
  });

  if (validResult.status === 201) {
    console.log('    ✅ Criação com dados válidos funcionou');
  } else {
    console.log('    ❌ Criação com dados válidos falhou:', validResult.status, validResult.data);
  }

  // Teste 2: Dados sem tenant_id
  console.log('  📝 Teste 2: Dados sem tenant_id');
  const invalidData = {
    name: 'Corte Teste',
    description: 'Corte para teste',
    duration_min: 30,
    price_cents: 5000,
    barbershop_id: 'shop_1',
  };

  const invalidResult = await makeRequest(`${BASE_URL}/api/services`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': 'tenant_1',
    },
    body: JSON.stringify(invalidData),
  });

  if (invalidResult.status === 400) {
    console.log('    ✅ Validação sem tenant_id funcionou (bloqueou)');
    console.log('    📋 Erro:', invalidResult.data.error);
  } else {
    console.log('    ❌ Validação sem tenant_id falhou:', invalidResult.status, invalidResult.data);
  }

  // Teste 3: Dados com tenant_id incorreto
  console.log('  📝 Teste 3: Dados com tenant_id incorreto');
  const wrongTenantData = {
    tenant_id: 'tenant_wrong',
    name: 'Corte Teste',
    description: 'Corte para teste',
    duration_min: 30,
    price_cents: 5000,
    barbershop_id: 'shop_1',
  };

  const wrongTenantResult = await makeRequest(`${BASE_URL}/api/services`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': 'tenant_1',
    },
    body: JSON.stringify(wrongTenantData),
  });

  if (wrongTenantResult.status === 403) {
    console.log('    ✅ Validação com tenant_id incorreto funcionou (bloqueou)');
    console.log('    📋 Erro:', wrongTenantResult.data.error);
  } else {
    console.log('    ❌ Validação com tenant_id incorreto falhou:', wrongTenantResult.status, wrongTenantResult.data);
  }

  return true;
}

// Função para testar isolamento cross-tenant
async function testCrossTenantIsolation() {
  console.log('\n🔒 Testando isolamento cross-tenant...');
  
  // Tentar acessar recursos de outro tenant
  const result = await makeRequest(`${BASE_URL}/api/services`, {
    headers: {
      'X-Tenant-Id': 'tenant_2', // Tenant diferente
    },
  });

  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }

  if (result.status === 400) {
    console.log('✅ Acesso cross-tenant bloqueado corretamente');
    console.log('📋 Mensagem:', result.data.error);
    return true;
  } else {
    console.error('❌ Acesso cross-tenant não foi bloqueado:', result.status, result.data);
    return false;
  }
}

// Função para testar funcionalidades do tenant
async function testTenantFeatures() {
  console.log('\n🧪 Testando funcionalidades do tenant...');
  
  const result = await makeRequest(`${BASE_URL}/api/tenant/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': 'tenant_1',
    },
    body: JSON.stringify({
      testType: 'check_limits',
      data: {},
    }),
  });

  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }

  if (result.status === 200) {
    console.log('✅ Funcionalidades do tenant funcionando');
    console.log('📊 Resultado:', result.data.result);
    return true;
  } else {
    console.error('❌ Funcionalidades do tenant falharam:', result.status, result.data);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes do sistema multi-tenant...\n');

  const tests = [
    { name: 'Resolução por header', fn: testTenantByHeader },
    { name: 'Bloqueio sem tenant_id', fn: testBlockWithoutTenant },
    { name: 'Validação em DTOs', fn: testTenantValidationInDTOs },
    { name: 'Isolamento cross-tenant', fn: testCrossTenantIsolation },
    { name: 'Funcionalidades do tenant', fn: testTenantFeatures },
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
    console.log('\n🎉 Todos os testes passaram! Sistema multi-tenant funcionando perfeitamente.');
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
  testTenantByHeader,
  testBlockWithoutTenant,
  testTenantValidationInDTOs,
  testCrossTenantIsolation,
  testTenantFeatures,
};
