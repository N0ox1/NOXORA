#!/usr/bin/env node

/**
 * Script de teste para verificar o sistema de observabilidade
 * Testa: OpenTelemetry, Sentry e Audit Logs
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
        'User-Agent': 'Observability-Test-Script/1.0',
        'Content-Type': 'application/json',
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

async function testOpenTelemetryTracing() {
  logHeader('TESTANDO OPEN TELEMETRY TRACING');
  
  try {
    // Teste 1: Verificar se headers de tracing estão presentes
    log('Testando headers de tracing...', 'blue');
    const response = await makeRequest('/api/health');
    
    if (response.statusCode === 200) {
      const hasTraceId = response.headers['x-trace-id'];
      const hasSpanId = response.headers['x-span-id'];
      
      if (hasTraceId && hasSpanId) {
        logTest('Headers de tracing', 'PASS', `Trace ID: ${hasTraceId}, Span ID: ${hasSpanId}`);
        
        // Verificar formato do trace ID (deve ser hexadecimal de 32 caracteres)
        const traceIdValid = /^[a-f0-9]{32}$/i.test(hasTraceId);
        const spanIdValid = /^[a-f0-9]{16}$/i.test(hasSpanId);
        
        logTest('Formato do Trace ID', traceIdValid ? 'PASS' : 'FAIL', `Formato: ${hasTraceId}`);
        logTest('Formato do Span ID', spanIdValid ? 'PASS' : 'FAIL', `Formato: ${hasSpanId}`);
        
      } else {
        logTest('Headers de tracing', 'FAIL', 'Headers X-Trace-Id ou X-Span-Id não encontrados');
      }
      
    } else {
      logTest('Headers de tracing', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Headers de tracing', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testTenantContext() {
  logHeader('TESTANDO CONTEXTO DE TENANT');
  
  try {
    // Teste 1: Verificar se headers de tenant estão presentes
    log('Testando headers de tenant...', 'blue');
    const response = await makeRequest('/api/health', {
      headers: {
        'X-Tenant-Id': 'tnt_1',
        'X-Tenant-Slug': 'barber-labs-centro'
      }
    });
    
    if (response.statusCode === 200) {
      const hasTenantId = response.headers['x-tenant-id'];
      const hasTenantSlug = response.headers['x-tenant-slug'];
      
      if (hasTenantId && hasTenantSlug) {
        logTest('Headers de tenant', 'PASS', `Tenant ID: ${hasTenantId}, Slug: ${hasTenantSlug}`);
        
        // Verificar se os valores são retornados corretamente
        const tenantIdMatch = hasTenantId === 'tnt_1';
        const tenantSlugMatch = hasTenantSlug === 'barber-labs-centro';
        
        logTest('Valor do Tenant ID', tenantIdMatch ? 'PASS' : 'FAIL', `Esperado: tnt_1, Recebido: ${hasTenantId}`);
        logTest('Valor do Tenant Slug', tenantSlugMatch ? 'PASS' : 'FAIL', `Esperado: barber-labs-centro, Recebido: ${hasTenantSlug}`);
        
      } else {
        logTest('Headers de tenant', 'FAIL', 'Headers X-Tenant-Id ou X-Tenant-Slug não encontrados');
      }
      
    } else {
      logTest('Headers de tenant', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Headers de tenant', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testAuditLogs() {
  logHeader('TESTANDO AUDIT LOGS');
  
  try {
    // Teste 1: Tentar acessar API de audit sem autenticação
    log('Testando acesso sem autenticação...', 'blue');
    const response1 = await makeRequest('/api/audit?tenant_id=tnt_1');
    
    if (response1.statusCode === 401) {
      logTest('Proteção de audit logs', 'PASS', 'Acesso bloqueado sem autenticação');
    } else {
      logTest('Proteção de audit logs', 'FAIL', `Status inesperado: ${response1.statusCode}`);
    }
    
    // Teste 2: Tentar criar audit log sem autenticação
    log('Testando criação de audit log sem autenticação...', 'blue');
    const response2 = await makeRequest('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tnt_1',
        action: 'TEST',
        resource: 'TEST_RESOURCE'
      })
    });
    
    if (response2.statusCode === 401) {
      logTest('Proteção de criação de audit', 'PASS', 'Criação bloqueada sem autenticação');
    } else {
      logTest('Proteção de criação de audit', 'FAIL', `Status inesperado: ${response2.statusCode}`);
    }
    
    // Teste 3: Verificar endpoint de estatísticas
    log('Testando endpoint de estatísticas...', 'blue');
    const response3 = await makeRequest('/api/audit/stats?tenant_id=tnt_1');
    
    if (response3.statusCode === 401) {
      logTest('Proteção de estatísticas', 'PASS', 'Acesso bloqueado sem autenticação');
    } else {
      logTest('Proteção de estatísticas', 'FAIL', `Status inesperado: ${response3.statusCode}`);
    }
    
  } catch (error) {
    logTest('Audit logs', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testRateLimitHeaders() {
  logHeader('TESTANDO HEADERS DE RATE LIMIT');
  
  try {
    // Teste 1: Verificar se headers de rate limit estão presentes
    log('Testando headers de rate limit...', 'blue');
    const response = await makeRequest('/api/health');
    
    if (response.statusCode === 200) {
      const hasRateLimitLimit = response.headers['x-ratelimit-limit'];
      const hasRateLimitRemaining = response.headers['x-ratelimit-remaining'];
      const hasRateLimitReset = response.headers['x-ratelimit-reset'];
      
      if (hasRateLimitLimit && hasRateLimitRemaining && hasRateLimitReset) {
        logTest('Headers de rate limit', 'PASS', `Limit: ${hasRateLimitLimit}, Remaining: ${hasRateLimitRemaining}, Reset: ${hasRateLimitReset}`);
        
        // Verificar se os valores são números válidos
        const limitValid = !isNaN(parseInt(hasRateLimitLimit));
        const remainingValid = !isNaN(parseInt(hasRateLimitRemaining));
        const resetValid = !isNaN(parseInt(hasRateLimitReset));
        
        logTest('Valor do Limit', limitValid ? 'PASS' : 'FAIL', `Valor: ${hasRateLimitLimit}`);
        logTest('Valor do Remaining', remainingValid ? 'PASS' : 'FAIL', `Valor: ${hasRateLimitRemaining}`);
        logTest('Valor do Reset', resetValid ? 'PASS' : 'FAIL', `Valor: ${hasRateLimitReset}`);
        
      } else {
        logTest('Headers de rate limit', 'FAIL', 'Headers de rate limit não encontrados');
      }
      
    } else {
      logTest('Headers de rate limit', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Headers de rate limit', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testErrorHandling() {
  logHeader('TESTANDO TRATAMENTO DE ERROS');
  
  try {
    // Teste 1: Verificar se erros retornam trace ID
    log('Testando tratamento de erros...', 'blue');
    const response = await makeRequest('/api/nonexistent');
    
    if (response.statusCode === 404) {
      const body = JSON.parse(response.body);
      
      if (body.traceId) {
        logTest('Trace ID em erros', 'PASS', `Trace ID: ${body.traceId}`);
      } else {
        logTest('Trace ID em erros', 'FAIL', 'Trace ID não encontrado no erro');
      }
      
    } else {
      logTest('Trace ID em erros', 'FAIL', `Status inesperado: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Trace ID em erros', 'FAIL', `Erro: ${error.message}`);
  }
}

async function testPerformanceMonitoring() {
  logHeader('TESTANDO MONITORAMENTO DE PERFORMANCE');
  
  try {
    // Teste 1: Verificar se requests são rastreados
    log('Testando rastreamento de performance...', 'blue');
    
    const startTime = Date.now();
    const response = await makeRequest('/api/health');
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.statusCode === 200) {
      logTest('Rastreamento de performance', 'PASS', `Duração: ${duration}ms`);
      
      // Verificar se a duração é razoável
      if (duration < 1000) {
        logTest('Performance aceitável', 'PASS', `Duração: ${duration}ms`);
      } else {
        logTest('Performance aceitável', 'FAIL', `Duração muito alta: ${duration}ms`);
      }
      
    } else {
      logTest('Rastreamento de performance', 'FAIL', `Status: ${response.statusCode}`);
    }
    
  } catch (error) {
    logTest('Rastreamento de performance', 'FAIL', `Erro: ${error.message}`);
  }
}

async function runAllTests() {
  logHeader('INICIANDO TESTES DE OBSERVABILIDADE');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Timeout: ${TEST_TIMEOUT}ms`, 'blue');
  
  const startTime = Date.now();
  
  try {
    await testOpenTelemetryTracing();
    await testTenantContext();
    await testAuditLogs();
    await testRateLimitHeaders();
    await testErrorHandling();
    await testPerformanceMonitoring();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logHeader('RESUMO DOS TESTES');
    log(`Tempo total: ${duration}ms`, 'bright');
    log('✅ Todos os testes de observabilidade foram executados!', 'green');
    
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
  testOpenTelemetryTracing,
  testTenantContext,
  testAuditLogs,
  testRateLimitHeaders,
  testErrorHandling,
  testPerformanceMonitoring,
  runAllTests
};
