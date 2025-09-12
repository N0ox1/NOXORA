#!/usr/bin/env node

/**
 * Script de teste para o sistema de notificações e jobs
 * Testa: fila de notificações, processamento, jobs cron e integração com agendamentos
 */

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tnt_1';

// Headers padrão para as requisições
const headers = {
  'Content-Type': 'application/json',
  'X-Tenant-Id': TENANT_ID
};

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste 1: Status inicial do sistema
async function testInitialStatus() {
  console.log('\n🔍 Teste 1: Status inicial do sistema');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications`);
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200;
}

// Teste 2: Criar notificação de teste
async function testCreateNotification() {
  console.log('\n📝 Teste 2: Criar notificação de teste');
  
  const notificationData = {
    template: 'appointment_confirmation',
    recipient: '+55 11 90000-0000',
    recipient_type: 'client',
    data: {
      client_name: 'João Silva',
      employee_name: 'Rafa',
      service_name: 'Corte Masculino',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    priority: 'normal'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/notifications`, {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 3: Agendar lembrete de teste
async function testScheduleReminder() {
  console.log('\n⏰ Teste 3: Agendar lembrete de teste');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'test_reminder' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 4: Testar processador de notificações
async function testNotificationProcessor() {
  console.log('\n⚙️ Teste 4: Testar processador de notificações');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'test_processor' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 5: Testar jobs cron
async function testCronJobs() {
  console.log('\n🕐 Teste 5: Testar jobs cron');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'test_cron' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 6: Testar notificação de billing
async function testBillingNotification() {
  console.log('\n💰 Teste 6: Testar notificação de billing');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'test_billing_notification' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 7: Verificar estatísticas
async function testGetStats() {
  console.log('\n📊 Teste 7: Verificar estatísticas');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications?action=stats`);
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 8: Verificar status completo
async function testFullStatus() {
  console.log('\n🔍 Teste 8: Verificar status completo');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'get_full_status' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Teste 9: Testar integração com agendamentos
async function testAppointmentIntegration() {
  console.log('\n📅 Teste 9: Testar integração com agendamentos');
  
  const appointmentData = {
    tenant_id: TENANT_ID,
    barbershop_id: 'shop_1',
    employee_id: 'emp_1',
    client_id: 'cli_1',
    service_id: 'srv_1',
    start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h no futuro
    duration_min: 30,
    notes: 'Teste de integração com notificações',
    status: 'PENDING'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 201 && response.data.success;
}

// Teste 10: Limpar fila de testes
async function testCleanup() {
  console.log('\n🧹 Teste 10: Limpar fila de testes');
  
  const response = await makeRequest(`${BASE_URL}/api/notifications/test`, {
    method: 'POST',
    body: JSON.stringify({ action: 'clear_queue' })
  });
  
  console.log('Status:', response.status);
  console.log('Resposta:', JSON.stringify(response.data, null, 2));
  
  return response.status === 200 && response.data.success;
}

// Função principal de teste
async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema de notificações e jobs...');
  console.log(`📍 URL base: ${BASE_URL}`);
  console.log(`🏢 Tenant ID: ${TENANT_ID}`);
  
  const tests = [
    { name: 'Status inicial', fn: testInitialStatus },
    { name: 'Criar notificação', fn: testCreateNotification },
    { name: 'Agendar lembrete', fn: testScheduleReminder },
    { name: 'Processador', fn: testNotificationProcessor },
    { name: 'Jobs cron', fn: testCronJobs },
    { name: 'Notificação billing', fn: testBillingNotification },
    { name: 'Estatísticas', fn: testGetStats },
    { name: 'Status completo', fn: testFullStatus },
    { name: 'Integração agendamentos', fn: testAppointmentIntegration },
    { name: 'Limpeza', fn: testCleanup }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      const success = await test.fn();
      results.push({ name: test.name, success });
      
      if (success) {
        console.log(`✅ ${test.name}: SUCESSO`);
      } else {
        console.log(`❌ ${test.name}: FALHOU`);
      }
      
      // Aguardar um pouco entre os testes
      await sleep(1000);
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERRO - ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Total: ${results.length} | ✅ Sucessos: ${successful} | ❌ Falhas: ${failed}`);
  
  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Erro fatal durante os testes:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  sleep
};
