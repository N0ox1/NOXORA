#!/usr/bin/env node

/**
 * Script de Smoke Tests para o sistema Noxora
 * Valida funcionalidades principais: health, público, CRUD e booking
 */

const axios = require('axios');

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000;
const TENANT_ID = 'tnt_1';
const BARBERSHOP_SLUG = 'barber-labs-centro';

// Utilitários
function log(message, color = 'white') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(` ${title} `.padStart(30 + title.length / 2).padEnd(60));
  console.log('='.repeat(60));
}

function logTest(name, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Testes
async function testHealth() {
  logHeader('TESTE DE HEALTH');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: TEST_TIMEOUT,
    });
    
    const success = response.status === 200;
    logTest('GET /api/health retorna 200', success, `Status: ${response.status}`);
    
    if (success) {
      log('   Response:');
      log(`   ${JSON.stringify(response.data, null, 2)}`);
    }
    
    return success;
  } catch (error) {
    logTest('GET /api/health retorna 200', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testPublicBarbershop() {
  logHeader('TESTE DE BARBERSHOP PÚBLICO');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/barbershop/public/${BARBERSHOP_SLUG}`, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
      },
    });
    
    const success = response.status === 200;
    logTest('GET /api/barbershop/public/{slug} retorna dados + cache header', success, `Status: ${response.status}`);
    
    if (success) {
      // Verificar cache headers
      const cacheSource = response.headers['x-cache-source'];
      const hasCacheHeaders = cacheSource || response.headers['s-maxage'] || response.headers['stale-while-revalidate'];
      
      logTest('   Headers de cache presentes', !!hasCacheHeaders, `X-Cache-Source: ${cacheSource || 'não encontrado'}`);
      
      // Verificar dados
      const hasData = response.data && response.data.success && response.data.data;
      logTest('   Dados retornados', !!hasData, `Success: ${response.data?.success}`);
      
      if (hasData) {
        log('   Dados da barbershop:');
        log(`   ${JSON.stringify(response.data.data, null, 2)}`);
      }
    }
    
    return success;
  } catch (error) {
    logTest('GET /api/barbershop/public/{slug} retorna dados + cache header', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testCRUDServices() {
  logHeader('TESTE DE CRUD SERVICES');
  
  try {
    // 1. Criar serviço
    log('📝 Testando criação de serviço...');
    const createResponse = await axios.post(`${BASE_URL}/api/services`, {
      name: 'Corte Feminino',
      durationMin: 45,
      priceCents: 6000,
      barbershopId: 'shop_1',
      isActive: true,
    }, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
        'Authorization': 'Bearer mock-admin-token',
        'Content-Type': 'application/json',
      },
    });
    
    const createSuccess = createResponse.status === 201 || createResponse.status === 200;
    logTest('   POST /api/services cria serviço autenticado', createSuccess, `Status: ${createResponse.status}`);
    
    if (createSuccess) {
      const serviceId = createResponse.data?.data?.id;
      log(`   ✅ Serviço criado com ID: ${serviceId}`);
      
      // 2. Listar serviços
      log('📝 Testando listagem de serviços...');
      const listResponse = await axios.get(`${BASE_URL}/api/services`, {
        timeout: TEST_TIMEOUT,
        headers: {
          'X-Tenant-Id': TENANT_ID,
          'Authorization': 'Bearer mock-admin-token',
        },
      });
      
      const listSuccess = listResponse.status === 200;
      logTest('   GET /api/services lista serviços', listSuccess, `Status: ${listResponse.status}`);
      
      if (listSuccess) {
        const services = listResponse.data?.data || [];
        log(`   ✅ ${services.length} serviços encontrados`);
      }
      
      // 3. Atualizar serviço
      if (serviceId) {
        log('📝 Testando atualização de serviço...');
        const updateResponse = await axios.put(`${BASE_URL}/api/services/${serviceId}`, {
          name: 'Corte Feminino Atualizado',
          priceCents: 7000,
        }, {
          timeout: TEST_TIMEOUT,
          headers: {
            'X-Tenant-Id': TENANT_ID,
            'Authorization': 'Bearer mock-admin-token',
            'Content-Type': 'application/json',
          },
        });
        
        const updateSuccess = updateResponse.status === 200;
        logTest('   PUT /api/services/{id} atualiza serviço', updateSuccess, `Status: ${updateResponse.status}`);
      }
      
      // 4. Deletar serviço
      if (serviceId) {
        log('📝 Testando remoção de serviço...');
        const deleteResponse = await axios.delete(`${BASE_URL}/api/services/${serviceId}`, {
          timeout: TEST_TIMEOUT,
          headers: {
            'X-Tenant-Id': TENANT_ID,
            'Authorization': 'Bearer mock-admin-token',
          },
        });
        
        const deleteSuccess = deleteResponse.status === 200 || deleteResponse.status === 204;
        logTest('   DELETE /api/services/{id} remove serviço', deleteSuccess, `Status: ${deleteResponse.status}`);
      }
    }
    
    return createSuccess;
  } catch (error) {
    logTest('   POST /api/services cria serviço autenticado', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testAppointmentBooking() {
  logHeader('TESTE DE BOOKING DE APPOINTMENTS');
  
  try {
    // 1. Criar primeiro appointment
    log('📝 Testando criação de primeiro appointment...');
    const appointment1 = {
      barbershopId: 'shop_1',
      employeeId: 'emp_1',
      clientId: 'cli_1',
      serviceId: 'srv_1',
      startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Depois de amanhã
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    };
    
    const response1 = await axios.post(`${BASE_URL}/api/appointments`, appointment1, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
        'Content-Type': 'application/json',
      },
    });
    
    const success1 = response1.status === 201 || response1.status === 200;
    logTest('   Primeiro POST /api/appointments sucesso', success1, `Status: ${response1.status}`);
    
    if (success1) {
      const appointmentId = response1.data?.data?.id;
      log(`   ✅ Primeiro appointment criado com ID: ${appointmentId}`);
      
      // 2. Tentar criar appointment duplicado (mesmo horário)
      log('📝 Testando criação de appointment duplicado...');
      try {
        const response2 = await axios.post(`${BASE_URL}/api/appointments`, appointment1, {
          timeout: TEST_TIMEOUT,
          headers: {
            'X-Tenant-Id': TENANT_ID,
            'Content-Type': 'application/json',
          },
        });
        
        // Se chegou aqui, não deveria ter dado conflito
        logTest('   Segundo POST /api/appointments com duplicata retorna 409', false, 'Deveria ter retornado conflito');
        return false;
        
      } catch (error) {
        if (error.response?.status === 409) {
          logTest('   Segundo POST /api/appointments com duplicata retorna 409', true, `Status: ${error.response.status}`);
          
          // Verificar se a mensagem de erro está correta
          const errorMessage = error.response.data?.message || '';
          const hasConflictMessage = errorMessage.includes('CONFLICT') || errorMessage.includes('conflict') || errorMessage.includes('duplicate');
          logTest('   Mensagem de conflito apropriada', hasConflictMessage, `Message: ${errorMessage}`);
          
          return true;
        } else {
          logTest('   Segundo POST /api/appointments com duplicata retorna 409', false, `Status inesperado: ${error.response?.status}`);
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    logTest('   Teste de booking de appointments', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testCacheValidation() {
  logHeader('TESTE DE VALIDAÇÃO DE CACHE');
  
  try {
    // 1. Primeira requisição (deve ser MISS)
    log('📝 Primeira requisição (deve ser MISS)...');
    const response1 = await axios.get(`${BASE_URL}/api/barbershop/public/${BARBERSHOP_SLUG}`, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
      },
    });
    
    const cacheSource1 = response1.headers['x-cache-source'];
    const isMiss = cacheSource1 === 'MISS' || !cacheSource1;
    logTest('   Primeira requisição é MISS', isMiss, `X-Cache-Source: ${cacheSource1 || 'não encontrado'}`);
    
    // Aguardar um pouco para o cache ser populado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Segunda requisição (deve ser HIT)
    log('📝 Segunda requisição (deve ser HIT)...');
    const response2 = await axios.get(`${BASE_URL}/api/barbershop/public/${BARBERSHOP_SLUG}`, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
      },
    });
    
    const cacheSource2 = response2.headers['x-cache-source'];
    const isHit = cacheSource2 === 'HIT';
    logTest('   Segunda requisição é HIT', isHit, `X-Cache-Source: ${cacheSource2 || 'não encontrado'}`);
    
    // 3. Verificar headers de CDN
    const hasCDNHeaders = response2.headers['s-maxage'] || response2.headers['stale-while-revalidate'];
    logTest('   Headers de CDN configurados', !!hasCDNHeaders, `s-maxage: ${response2.headers['s-maxage']}, stale-while-revalidate: ${response2.headers['stale-while-revalidate']}`);
    
    return isMiss && isHit && hasCDNHeaders;
  } catch (error) {
    logTest('   Teste de validação de cache', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testOptimisticLocks() {
  logHeader('TESTE DE LOCKS OTIMISTAS');
  
  try {
    // 1. Criar appointment base
    log('📝 Criando appointment base para teste de lock...');
    const baseAppointment = {
      barbershopId: 'shop_1',
      employeeId: 'emp_1',
      clientId: 'cli_1',
      serviceId: 'srv_1',
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
      endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    };
    
    const baseResponse = await axios.post(`${BASE_URL}/api/appointments`, baseAppointment, {
      timeout: TEST_TIMEOUT,
      headers: {
        'X-Tenant-Id': TENANT_ID,
        'Content-Type': 'application/json',
      },
    });
    
    if (baseResponse.status !== 201 && baseResponse.status !== 200) {
      logTest('   Criação de appointment base', false, `Status: ${baseResponse.status}`);
      return false;
    }
    
    // 2. Tentar criar appointments simultâneos
    log('📝 Testando locks otimistas com requisições simultâneas...');
    const conflictingAppointment = {
      ...baseAppointment,
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 15 min depois
      endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    };
    
    // Fazer duas requisições simultâneas
    const promises = [
      axios.post(`${BASE_URL}/api/appointments`, conflictingAppointment, {
        timeout: TEST_TIMEOUT,
        headers: {
          'X-Tenant-Id': TENANT_ID,
          'Content-Type': 'application/json',
        },
      }),
      axios.post(`${BASE_URL}/api/appointments`, conflictingAppointment, {
        timeout: TEST_TIMEOUT,
        headers: {
          'X-Tenant-Id': TENANT_ID,
          'Content-Type': 'application/json',
        },
      }),
    ];
    
    const results = await Promise.allSettled(promises);
    
    // Verificar resultados
    const successful = results.filter(r => r.status === 'fulfilled' && (r.value.status === 201 || r.value.status === 200));
    const conflicts = results.filter(r => r.status === 'fulfilled' && r.value.status === 409);
    const errors = results.filter(r => r.status === 'rejected');
    
    logTest('   Requisições simultâneas processadas', results.length === 2, `Total: ${results.length}`);
    logTest('   Pelo menos uma requisição com sucesso', successful.length >= 1, `Sucessos: ${successful.length}`);
    logTest('   Pelo menos uma requisição com conflito', conflicts.length >= 1, `Conflitos: ${conflicts.length}`);
    
    if (errors.length > 0) {
      log(`   ⚠️  ${errors.length} requisições falharam com erro`);
    }
    
    return successful.length >= 1 && conflicts.length >= 1;
  } catch (error) {
    logTest('   Teste de locks otimistas', false, `Erro: ${error.message}`);
    return false;
  }
}

// Função principal
async function runAllTests() {
  logHeader('INICIANDO SMOKE TESTS');
  log(`Base URL: ${BASE_URL}`);
  log(`Tenant ID: ${TENANT_ID}`);
  log(`Barbershop Slug: ${BARBERSHOP_SLUG}`);
  log(`Timeout: ${TEST_TIMEOUT}ms`);
  
  const startTime = Date.now();
  const results = [];
  
  try {
    // Executar todos os testes
    results.push(await testHealth());
    results.push(await testPublicBarbershop());
    results.push(await testCRUDServices());
    results.push(await testAppointmentBooking());
    results.push(await testCacheValidation());
    results.push(await testOptimisticLocks());
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Resumo final
    logHeader('RESUMO DOS SMOKE TESTS');
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    log(`✅ Testes passaram: ${passed}/${total}`);
    log(`⏱️  Tempo total: ${duration}ms`);
    
    if (passed === total) {
      log('🎉 Todos os smoke tests passaram!');
      log('🚀 Sistema está funcionando corretamente');
    } else {
      log('❌ Alguns testes falharam');
      log('🔍 Verifique os logs acima para detalhes');
    }
    
    return passed === total;
    
  } catch (error) {
    logHeader('ERRO NOS SMOKE TESTS');
    log(`Erro geral: ${error.message}`);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testHealth,
  testPublicBarbershop,
  testCRUDServices,
  testAppointmentBooking,
  testCacheValidation,
  testOptimisticLocks,
};
