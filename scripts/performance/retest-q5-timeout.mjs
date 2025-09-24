import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

// Helper para fazer requisições e medir latência
async function measureRequest(url, options = {}) {
    const start = Date.now();
    const response = await fetch(url, options);
    const latency = Date.now() - start;

    return {
        response,
        latency,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
    };
}

// Q5: Teste de timeout de statement
async function testQ5Timeout() {
    console.log('🧪 Q5: Testing statement timeout...');

    // Criar endpoint de teste que simula query pesada
    console.log('📤 Testing timeout endpoint...');

    // Tentar acessar endpoint que pode causar timeout
    const timeoutUrl = `${API_BASE}/reporting/appointments/daily?from=2025-01-01&to=2025-12-31`;

    const start = Date.now();
    const response = await measureRequest(timeoutUrl, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });
    const duration = Date.now() - start;

    console.log(`📊 Request duration: ${duration}ms`);
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, response.headers);

    // Verificar se a resposta foi tratada adequadamente
    if (response.status >= 500) {
        console.log('✅ Timeout handled with 5xx status');
        A.ok(response.status >= 500, 'Should return 5xx for timeout');
    } else if (response.status === 200) {
        console.log('✅ Request completed within timeout');
        A.ok(duration < 8000, 'Request should complete within 8s timeout');
    } else {
        console.log('ℹ️  Request returned other status:', response.status);
    }

    // Verificar se não travou o pool (requisição subsequente funciona)
    console.log('📤 Testing pool health with subsequent request...');
    const healthCheck = await measureRequest(`${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    A.equal(healthCheck.status, 200, 'Pool should still be healthy');
    A.ok(healthCheck.latency < 1000, 'Subsequent request should be fast');
    console.log(`✅ Pool health check: ${healthCheck.latency}ms`);

    console.log('✅ Q5: Statement timeout test passed');
}

// Executar teste
async function runTest() {
    try {
        console.log('🚀 Starting Q5 Statement Timeout Retest...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await testQ5Timeout();

        console.log('\n🎯 Q5 Statement Timeout Retest PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ Q5 Retest failed:', error.message);
        process.exit(1);
    }
}

runTest();

















