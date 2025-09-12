#!/usr/bin/env node

/**
 * Script de teste para verificar todas as funcionalidades da UI
 * Testa: página pública, dashboard admin e super admin
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '='.repeat(60), 'bright');
  log(` ${title}`, 'bright');
  log('='.repeat(60), 'bright');
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${icon} ${testName}: ${status}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'UI-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(TEST_TIMEOUT);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testPublicPage() {
  logHeader('TESTANDO PÁGINA PÚBLICA (/b/[slug])');
  
  try {
    // Teste 1: Acessar página pública
    log('Testando acesso à página pública...', 'blue');
    const response = await makeRequest('/b/barber-labs-centro');
    
    if (response.statusCode === 200) {
      logTest('Página pública acessível', 'PASS', `Status: ${response.statusCode}`);
      
      // Verificar se contém elementos essenciais
      const body = response.body;
      const hasServiceSelection = body.includes('Escolha o Serviço');
      const hasEmployeeSelection = body.includes('Escolha o Profissional');
      const hasDateSelection = body.includes('Escolha a Data');
      const hasTimeSelection = body.includes('Horários Disponíveis');
      const hasClientForm = body.includes('Seus Dados');
      const hasBookingButton = body.includes('Confirmar Agendamento');
      
      logTest('Seleção de serviço', hasServiceSelection ? 'PASS' : 'FAIL');
      logTest('Seleção de funcionário', hasEmployeeSelection ? 'PASS' : 'FAIL');
      logTest('Seleção de data', hasDateSelection ? 'PASS' : 'FAIL');
      logTest('Seleção de horário', hasTimeSelection ? 'PASS' : 'FAIL');
      logTest('Formulário de cliente', hasClientForm ? 'PASS' : 'FAIL');
      logTest('Botão de agendamento', hasBookingButton ? 'PASS' : 'FAIL');
      
    } else {
      logTest('Página pública acessível', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Página pública acessível', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testAdminDashboard() {
  logHeader('TESTANDO DASHBOARD ADMIN (/admin/dashboard)');
  
  try {
    // Teste 1: Acessar dashboard admin
    log('Testando acesso ao dashboard admin...', 'blue');
    const response = await makeRequest('/admin/dashboard');
    
    if (response.statusCode === 200) {
      logTest('Dashboard admin acessível', 'PASS', `Status: ${response.statusCode}`);
      
      // Verificar se contém elementos essenciais
      const body = response.body;
      const hasTabs = body.includes('Serviços') && body.includes('Funcionários') && body.includes('Agenda');
      const hasServicesTab = body.includes('Novo Serviço');
      const hasEmployeesTab = body.includes('Novo Funcionário');
      const hasAgendaTab = body.includes('Agenda Diária');
      const hasServiceTable = body.includes('Duração') && body.includes('Preço');
      const hasEmployeeTable = body.includes('Cargo') && body.includes('Contato');
      const hasAgendaTable = body.includes('Horário') && body.includes('Cliente');
      
      logTest('Abas principais', hasTabs ? 'PASS' : 'FAIL');
      logTest('Aba de serviços', hasServicesTab ? 'PASS' : 'FAIL');
      logTest('Aba de funcionários', hasEmployeesTab ? 'PASS' : 'FAIL');
      logTest('Aba de agenda', hasAgendaTab ? 'PASS' : 'FAIL');
      logTest('Tabela de serviços', hasServiceTable ? 'PASS' : 'FAIL');
      logTest('Tabela de funcionários', hasEmployeeTable ? 'PASS' : 'FAIL');
      logTest('Tabela de agenda', hasAgendaTable ? 'PASS' : 'FAIL');
      
    } else {
      logTest('Dashboard admin acessível', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Dashboard admin acessível', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testSuperAdmin() {
  logHeader('TESTANDO SUPER ADMIN (/admin/super-admin)');
  
  try {
    // Teste 1: Acessar super admin
    log('Testando acesso ao super admin...', 'blue');
    const response = await makeRequest('/admin/super-admin');
    
    if (response.statusCode === 200) {
      logTest('Super admin acessível', 'PASS', `Status: ${response.statusCode}`);
      
      // Verificar se contém elementos essenciais
      const body = response.body;
      const hasStatsCards = body.includes('Total de Tenants') && body.includes('Receita Mensal');
      const hasPlanStats = body.includes('Estatísticas por Plano');
      const hasFilters = body.includes('Buscar') && body.includes('Status') && body.includes('Plano');
      const hasTenantsTable = body.includes('Tenant') && body.includes('Plano') && body.includes('Status');
      const hasMetrics = body.includes('Métricas') && body.includes('Receita');
      const hasActions = body.includes('Ações');
      
      logTest('Cards de estatísticas', hasStatsCards ? 'PASS' : 'FAIL');
      logTest('Estatísticas por plano', hasPlanStats ? 'PASS' : 'FAIL');
      logTest('Filtros de busca', hasFilters ? 'PASS' : 'FAIL');
      logTest('Tabela de tenants', hasTenantsTable ? 'PASS' : 'FAIL');
      logTest('Colunas de métricas', hasMetrics ? 'PASS' : 'FAIL');
      logTest('Coluna de ações', hasActions ? 'PASS' : 'FAIL');
      
    } else {
      logTest('Super admin acessível', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Super admin acessível', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testNavigation() {
  logHeader('TESTANDO NAVEGAÇÃO ENTRE PÁGINAS');
  
  try {
    // Teste 1: Verificar se as rotas estão acessíveis
    const routes = [
      { path: '/b/barber-labs-centro', name: 'Página Pública' },
      { path: '/admin/dashboard', name: 'Dashboard Admin' },
      { path: '/admin/super-admin', name: 'Super Admin' }
    ];
    
    for (const route of routes) {
      try {
        const response = await makeRequest(route.path);
        const status = response.statusCode === 200 ? 'PASS' : 'FAIL';
        const details = `Status: ${response.statusCode}`;
        logTest(`Rota ${route.name}`, status, details);
      } catch (error) {
        logTest(`Rota ${route.name}`, 'FAIL', `Erro: ${error.message}`);
      }
    }
    
  } catch (error) {
    logTest('Teste de navegação', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testResponsiveness() {
  logHeader('TESTANDO RESPONSIVIDADE (Headers)');
  
  try {
    // Teste 1: Verificar headers de responsividade
    const response = await makeRequest('/b/barber-labs-centro');
    
    if (response.statusCode === 200) {
      const headers = response.headers;
      const hasViewport = response.body.includes('viewport');
      const hasResponsiveClasses = response.body.includes('grid-cols-1') && response.body.includes('md:grid-cols-2');
      
      logTest('Meta viewport', hasViewport ? 'PASS' : 'FAIL');
      logTest('Classes responsivas', hasResponsiveClasses ? 'PASS' : 'FAIL');
      
    } else {
      logTest('Headers de responsividade', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Headers de responsividade', 'FAIL', `Erro: ${error.message}`);
  }
}

async function runAllTests() {
  logHeader('INICIANDO TESTES COMPLETOS DA UI');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Timeout: ${TEST_TIMEOUT}ms`, 'blue');
  
  const startTime = Date.now();
  
  try {
    await testPublicPage();
    await testAdminDashboard();
    await testSuperAdmin();
    await testNavigation();
    await testResponsiveness();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logHeader('RESUMO DOS TESTES');
    log(`Tempo total: ${duration}ms`, 'bright');
    log('✅ Todos os testes foram executados!', 'green');
    
  } catch (error) {
    logHeader('ERRO NOS TESTES');
    log(`Erro geral: ${error.message}`, 'red');
  }
}

// Função principal
async function main() {
  try {
    await runAllTests();
  } catch (error) {
    log(`Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  testPublicPage,
  testAdminDashboard,
  testSuperAdmin,
  testNavigation,
  testResponsiveness,
  runAllTests
};
