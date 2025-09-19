import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;
const BARBERSHOP_ID = process.env.BARBERSHOP_ID || TENANT_ID;
const EMPLOYEE_ID = process.env.EMPLOYEE_ID;

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

// Teste de carga no pool de conexões
async function testPoolUnderLoad() {
    console.log('🧪 Testing pool under load (200 req/s for 60s)...');

    if (!EMPLOYEE_ID) {
        console.log('⚠️  Skipping pool load test - EMPLOYEE_ID not provided');
        return;
    }

    const date = '2025-09-10';
    const availabilityUrl = `${API_BASE}/public/availability?tenantId=${TENANT_ID}&barbershopId=${BARBERSHOP_ID}&employeeId=${EMPLOYEE_ID}&date=${date}`;

    const results = [];
    const concurrency = 20; // 20 requisições simultâneas
    const totalRequests = 200; // Total de requisições
    const startTime = Date.now();

    console.log(`📊 Running ${totalRequests} requests with concurrency ${concurrency}...`);

    // Executar requisições em lotes
    for (let i = 0; i < totalRequests; i += concurrency) {
        const batch = [];

        for (let j = 0; j < concurrency && (i + j) < totalRequests; j++) {
            batch.push(measureRequest(availabilityUrl));
        }

        const batchResults = await Promise.all(batch);
        results.push(...batchResults);

        // Pequena pausa entre lotes para simular 200 req/s
        if (i + concurrency < totalRequests) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const actualRps = (totalRequests / totalDuration) * 1000;

    console.log(`📊 Load test completed in ${totalDuration}ms`);
    console.log(`📊 Actual RPS: ${actualRps.toFixed(2)}`);

    // Analisar resultados
    const latencies = results.map(r => r.latency);
    const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
    const p99 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);

    // Contar erros
    const errors = results.filter(r => r.status >= 500);
    const errorRate = (errors.length / results.length) * 100;

    console.log(`📈 Performance metrics:`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms`);
    console.log(`   Errors: ${errors.length}/${results.length} (${errorRate.toFixed(2)}%)`);

    // Verificar critérios de sucesso
    A.ok(p95 <= 200, `P95 should be <= 200ms, got ${p95}ms`);
    A.ok(p99 <= 350, `P99 should be <= 350ms, got ${p99}ms`);
    A.ok(errorRate < 1, `Error rate should be < 1%, got ${errorRate.toFixed(2)}%`);

    console.log('✅ Pool load test passed');
}

// Executar teste
async function runTest() {
    try {
        console.log('🚀 Starting Pool Load Test...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await testPoolUnderLoad();

        console.log('\n🎯 Pool Load Test PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ Pool Load Test failed:', error.message);
        process.exit(1);
    }
}

runTest();











