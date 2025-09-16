import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

// Helper para fazer requisições
async function makeRequest(url, options = {}) {
    const response = await fetch(url, options);
    return {
        response,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
    };
}

// Q1: Teste de Sentry tags
async function testSentryTags() {
    console.log('🧪 Q1: Testing Sentry tags...');

    const headers = { 'X-Tenant-Id': TENANT_ID };

    try {
        const result = await makeRequest(`${API_BASE}/_test/error`, { headers });

        // Verificar se retornou erro 500
        A.equal(result.status, 500, 'Should return 500 error');

        // Verificar se tem headers de correlação
        A.ok(result.headers['x-request-id'], 'Should have x-request-id header');

        console.log('✅ Q1: Sentry tags test passed');
        console.log('ℹ️  Check Sentry dashboard for error with tenantId and requestId tags');

    } catch (error) {
        console.error('❌ Q1: Sentry tags test failed:', error.message);
        throw error;
    }
}

// Q2: Teste de trace end-to-end
async function testTraceEndToEnd() {
    console.log('🧪 Q2: Testing trace end-to-end...');

    const headers = { 'X-Tenant-Id': TENANT_ID };
    const url = `${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`;

    try {
        const result = await makeRequest(url, { headers });

        // Verificar se retornou sucesso
        A.equal(result.status, 200, 'Should return 200');

        // Verificar headers de correlação
        A.ok(result.headers['x-request-id'], 'Should have x-request-id header');
        A.ok(result.headers['x-cache-source'], 'Should have x-cache-source header');

        console.log('✅ Q2: Trace end-to-end test passed');
        console.log('ℹ️  Check OpenTelemetry backend for trace with spans: http→prisma→redis');
        console.log('ℹ️  Trace should have attributes: noxora.tenant_id, noxora.route');

    } catch (error) {
        console.error('❌ Q3: Trace end-to-end test failed:', error.message);
        throw error;
    }
}

// Q3: Teste de logs correlation
async function testLogsCorrelation() {
    console.log('🧪 Q3: Testing logs correlation...');

    const headers = {
        'X-Tenant-Id': TENANT_ID,
        'X-Request-Id': 'test-correlation-123'
    };

    try {
        // Fazer 3 requisições com o mesmo requestId
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(makeRequest(`${API_BASE}/services`, { headers }));
        }

        const results = await Promise.all(promises);

        // Verificar se todas retornaram sucesso
        results.forEach((result, index) => {
            A.equal(result.status, 200, `Request ${index + 1} should return 200`);
            A.equal(result.headers['x-request-id'], 'test-correlation-123', `Request ${index + 1} should have same requestId`);
        });

        console.log('✅ Q3: Logs correlation test passed');
        console.log('ℹ️  Check logs - all lines should include requestId: test-correlation-123');

    } catch (error) {
        console.error('❌ Q3: Logs correlation test failed:', error.message);
        throw error;
    }
}

// Executar todos os testes
async function runTests() {
    try {
        console.log('🚀 Starting Observability QA Tests...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await testSentryTags();
        console.log('');

        await testTraceEndToEnd();
        console.log('');

        await testLogsCorrelation();
        console.log('');

        console.log('🎯 ALL OBSERVABILITY QA TESTS PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ Observability QA failed:', error.message);
        process.exit(1);
    }
}

runTests();




