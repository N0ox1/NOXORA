#!/usr/bin/env node

/**
 * Script para testar o sistema de billing
 * Testa checkout, webhooks, enforce limits e feature flags
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
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Função para testar rota de checkout
async function testCheckout() {
  console.log('\n🛒 Testando rota de checkout...');
  
  const tenantId = 'tenant_1';
  
  // 1. Obter informações de checkout
  const infoResult = await makeRequest(`${BASE_URL}/api/billing/checkout`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });
  
  if (infoResult.error || infoResult.status !== 200) {
    console.error('❌ Erro ao obter informações de checkout:', infoResult.error || infoResult.status);
    return false;
  }
  
  console.log('✅ Informações de checkout obtidas com sucesso');
  console.log(`📊 Plano atual: ${infoResult.data.current_plan?.code || 'N/A'}`);
  console.log(`📊 Planos disponíveis: ${infoResult.data.available_plans.length}`);
  console.log(`📊 Addons disponíveis: ${infoResult.data.available_addons.length}`);

  // 2. Testar criação de sessão de checkout
  const checkoutData = {
    plan_code: 'PRO',
    billing_cycle: 'monthly',
    addons: ['REMINDERS_300'],
    customer_email: 'test@example.com',
    customer_name: 'Test User',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  };

  const checkoutResult = await makeRequest(`${BASE_URL}/api/billing/checkout`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify(checkoutData),
  });

  if (checkoutResult.error || checkoutResult.status !== 201) {
    console.error('❌ Erro ao criar sessão de checkout:', checkoutResult.error || checkoutResult.status);
    return false;
  }

  console.log('✅ Sessão de checkout criada com sucesso');
  console.log(`📊 Session ID: ${checkoutResult.data.data.session_id}`);
  console.log(`📊 Valor total: R$ ${checkoutResult.data.data.amount_total}`);
  console.log(`📊 URL de checkout: ${checkoutResult.data.data.checkout_url}`);

  return true;
}

// Função para testar webhooks do Stripe
async function testWebhooks() {
  console.log('\n📨 Testando webhooks do Stripe...');
  
  // 1. Obter informações sobre webhooks
  const infoResult = await makeRequest(`${BASE_URL}/api/webhooks/stripe`);
  
  if (infoResult.error || infoResult.status !== 200) {
    console.error('❌ Erro ao obter informações de webhooks:', infoResult.error || infoResult.status);
    return false;
  }
  
  console.log('✅ Informações de webhooks obtidas');
  console.log(`📊 Eventos suportados: ${infoResult.data.supported_events.length}`);
  console.log(`📊 Dias de trial: ${infoResult.data.webhook_config.trial_days}`);
  console.log(`📊 Período de graça: ${infoResult.data.webhook_config.grace_period_days} dias`);

  // 2. Testar processamento de webhooks
  const testResult = await makeRequest(`${BASE_URL}/api/webhooks/stripe?action=test`);
  
  if (testResult.error || testResult.status !== 200) {
    console.error('❌ Erro ao testar webhooks:', testResult.error || testResult.status);
    return false;
  }

  console.log('✅ Teste de webhooks executado com sucesso');
  console.log(`📊 Total de eventos: ${testResult.data.total_events}`);
  console.log(`📊 Eventos bem-sucedidos: ${testResult.data.successful_events}`);
  console.log(`📊 Eventos falharam: ${testResult.data.failed_events}`);

  // Mostrar resultados detalhados
  console.log('\n📋 Resultados dos webhooks:');
  for (const result of testResult.data.results) {
    const status = result.success ? '✅' : '❌';
    console.log(`    ${status} ${result.event_type}: ${result.message}`);
  }

  return testResult.data.successful_events === testResult.data.total_events;
}

// Função para testar enforce limits
async function testEnforceLimits() {
  console.log('\n🚫 Testando enforce limits...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_enforce_limits',
    }),
  });
  
  if (result.error || result.status !== 200) {
    console.error('❌ Erro ao testar enforce limits:', result.error || result.status);
    return false;
  }
  
  console.log('✅ Teste de enforce limits executado');
  
  const summary = result.data.result.summary;
  console.log(`📊 Resumo dos testes:`);
  console.log(`    ✅ Geral: ${summary.generalAllowed ? 'Permitido' : 'Bloqueado'}`);
  console.log(`    ✅ Criar serviço: ${summary.createServiceAllowed ? 'Permitido' : 'Bloqueado'}`);
  console.log(`    ✅ Criar funcionário: ${summary.createEmployeeAllowed ? 'Permitido' : 'Bloqueado'}`);
  console.log(`    ✅ Criar cliente: ${summary.createClientAllowed ? 'Permitido' : 'Bloqueado'}`);
  console.log(`    ✅ Criar agendamento: ${summary.createAppointmentAllowed ? 'Permitido' : 'Bloqueado'}`);

  return true;
}

// Função para testar feature flags
async function testFeatureFlags() {
  console.log('\n🚩 Testando feature flags...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_feature_flags',
      data: {
        features: [
          'multi_location',
          'advanced_reporting',
          'sms_notifications',
          'custom_branding',
          'priority_support',
          'webhooks',
          'api_access',
        ],
      },
    }),
  });
  
  if (result.error || result.status !== 200) {
    console.error('❌ Erro ao testar feature flags:', result.error || result.status);
    return false;
  }
  
  console.log('✅ Teste de feature flags executado');
  
  const summary = result.data.result.summary;
  const features = result.data.result.features;
  
  console.log(`📊 Resumo dos feature flags:`);
  console.log(`    📊 Total de features: ${summary.totalFeatures}`);
  console.log(`    ✅ Features habilitadas: ${summary.enabledFeatures}`);
  console.log(`    ❌ Features desabilitadas: ${summary.disabledFeatures}`);

  console.log('\n📋 Status das features:');
  for (const [feature, enabled] of Object.entries(features)) {
    const status = enabled ? '✅' : '❌';
    console.log(`    ${status} ${feature}: ${enabled ? 'Habilitada' : 'Desabilitada'}`);
  }

  return true;
}

// Função para testar simulação de uso
async function testUsageSimulation() {
  console.log('\n📊 Testando simulação de uso...');
  
  const tenantId = 'tenant_1';
  
  // 1. Testar uso normal
  const normalResult = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_usage_simulation',
      data: {
        simulate_high_usage: false,
      },
    }),
  });
  
  if (normalResult.error || normalResult.status !== 200) {
    console.error('❌ Erro ao testar simulação de uso normal:', normalResult.error || normalResult.status);
    return false;
  }
  
  console.log('✅ Simulação de uso normal executada');
  const normalUsage = normalResult.data.result.current_usage;
  console.log(`📊 Uso atual (normal):`);
  console.log(`    🏪 Barbershops: ${normalUsage.shops}`);
  console.log(`    👥 Funcionários: ${normalUsage.employees}`);
  console.log(`    👤 Clientes: ${normalUsage.clients}`);

  // 2. Testar uso alto
  const highResult = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_usage_simulation',
      data: {
        simulate_high_usage: true,
      },
    }),
  });
  
  if (highResult.error || highResult.status !== 200) {
    console.error('❌ Erro ao testar simulação de uso alto:', highResult.error || highResult.status);
    return false;
  }
  
  console.log('✅ Simulação de uso alto executada');
  const highUsage = highResult.data.result.current_usage;
  console.log(`📊 Uso atual (alto):`);
  console.log(`    🏪 Barbershops: ${highUsage.shops}`);
  console.log(`    👥 Funcionários: ${highUsage.employees}`);
  console.log(`    👤 Clientes: ${highUsage.clients}`);

  return true;
}

// Função para testar recomendação de upgrade
async function testUpgradeRecommendation() {
  console.log('\n⬆️ Testando recomendação de upgrade...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_upgrade_recommendation',
    }),
  });
  
  if (result.error || result.status !== 200) {
    console.error('❌ Erro ao testar recomendação de upgrade:', result.error || result.status);
    return false;
  }
  
  console.log('✅ Teste de recomendação de upgrade executado');
  
  const upgradeInfo = result.data.result;
  console.log(`📊 Status da recomendação:`);
  console.log(`    📊 Pode fazer upgrade: ${upgradeInfo.can_upgrade ? 'Sim' : 'Não'}`);
  
  if (upgradeInfo.upgrade_recommended?.recommended) {
    console.log(`    📊 Plano recomendado: ${upgradeInfo.upgrade_recommended.recommended_plan}`);
    console.log(`    📊 Motivo: ${upgradeInfo.upgrade_recommended.reason}`);
  }

  return true;
}

// Função para testar simulação de checkout
async function testCheckoutSimulation() {
  console.log('\n💳 Testando simulação de checkout...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/billing/test`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify({
      action: 'test_checkout_simulation',
      data: {
        plan_code: 'SCALE',
        billing_cycle: 'yearly',
        addons: ['REMINDERS_300', 'STORAGE_10'],
      },
    }),
  });
  
  if (result.error || result.status !== 200) {
    console.error('❌ Erro ao testar simulação de checkout:', result.error || result.status);
    return false;
  }
  
  console.log('✅ Simulação de checkout executada');
  
  const checkoutInfo = result.data.result;
  if (checkoutInfo.success) {
    console.log(`📊 Checkout simulado com sucesso:`);
    console.log(`    📊 Plano: ${checkoutInfo.request.plan_code}`);
    console.log(`    📊 Ciclo: ${checkoutInfo.request.billing_cycle}`);
    console.log(`    📊 Addons: ${checkoutInfo.request.addons.join(', ')}`);
    console.log(`    📊 Session ID: ${checkoutInfo.response.session_id}`);
    console.log(`    📊 Valor: R$ ${checkoutInfo.response.amount_total}`);
  } else {
    console.log(`❌ Erro na simulação: ${checkoutInfo.error}`);
  }

  return checkoutInfo.success;
}

// Função para testar rota de teste de billing
async function testBillingTestRoute() {
  console.log('\n🧪 Testando rota de teste de billing...');
  
  const tenantId = 'tenant_1';
  
  const result = await makeRequest(`${BASE_URL}/api/billing/test`, {
    headers: {
      'X-Tenant-Id': tenantId,
    },
  });
  
  if (result.error) {
    console.error('❌ Erro na requisição:', result.error);
    return false;
  }
  
  if (result.status === 200) {
    console.log('✅ Rota de teste de billing funcionando');
    console.log(`📊 Tenant: ${result.data.tenant.name} (${result.data.tenant.plan})`);
    console.log(`📊 Plano atual: ${result.data.current_plan?.name || 'N/A'}`);
    console.log(`📊 Uso atual: ${result.data.current_usage.shops} barbershops, ${result.data.current_usage.employees} funcionários`);
    console.log(`📊 Planos disponíveis: ${result.data.available_plans.length}`);
    console.log(`📊 Addons disponíveis: ${result.data.available_addons.length}`);
    return true;
  } else {
    console.error('❌ Status inesperado:', result.status);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes do sistema de billing...\n');

  const tests = [
    { name: 'Rota de Teste de Billing', fn: testBillingTestRoute },
    { name: 'Checkout', fn: testCheckout },
    { name: 'Webhooks do Stripe', fn: testWebhooks },
    { name: 'Enforce Limits', fn: testEnforceLimits },
    { name: 'Feature Flags', fn: testFeatureFlags },
    { name: 'Simulação de Uso', fn: testUsageSimulation },
    { name: 'Recomendação de Upgrade', fn: testUpgradeRecommendation },
    { name: 'Simulação de Checkout', fn: testCheckoutSimulation },
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
    console.log('\n🎉 Todos os testes passaram! Sistema de billing funcionando perfeitamente.');
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
  testCheckout,
  testWebhooks,
  testEnforceLimits,
  testFeatureFlags,
  testUsageSimulation,
  testUpgradeRecommendation,
  testCheckoutSimulation,
  testBillingTestRoute,
};
