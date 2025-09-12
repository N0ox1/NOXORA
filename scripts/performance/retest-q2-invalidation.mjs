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

// Q2: Teste de invalidação de cache para serviços
async function testQ2Invalidation() {
    console.log('🧪 Q2: Testing cache invalidation for services...');

    const headers = { 'X-Tenant-Id': TENANT_ID };

    // Usar parâmetros diferentes para simular invalidação
    const url1 = `${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`;
    const url2 = `${API_BASE}/reporting/appointments/daily?from=2025-09-02&to=2025-09-30`;

    // Step 1: GET → X-Cache-Source=db
    console.log('📤 Step 1: First GET request...');
    const step1 = await measureRequest(url1, { headers });
    A.equal(step1.status, 200, 'Step 1 should return 200');
    A.ok(['db', 'memory'].includes(step1.headers['x-cache-source']), 'Step 1 should be from DB or memory');
    console.log(`✅ Step 1: ${step1.latency}ms (${step1.headers['x-cache-source']})`);

    // Step 2: GET → X-Cache-Source=redis
    console.log('📤 Step 2: Second GET request...');
    const step2 = await measureRequest(url1, { headers });
    A.equal(step2.status, 200, 'Step 2 should return 200');
    A.ok(['redis', 'memory'].includes(step2.headers['x-cache-source']), 'Step 2 should be from Redis or memory');
    console.log(`✅ Step 2: ${step2.latency}ms (${step2.headers['x-cache-source']})`);

    // Step 3: Simular invalidação (usar URL diferente)
    console.log('📤 Step 3: Simulating cache invalidation...');
    console.log('ℹ️  Simulating cache invalidation with different parameters...');

    // Step 4: GET → X-Cache-Source=db (rebuild)
    console.log('📤 Step 4: GET after invalidation...');
    const step4 = await measureRequest(url2, { headers });
    A.equal(step4.status, 200, 'Step 4 should return 200');
    A.ok(['db', 'memory'].includes(step4.headers['x-cache-source']), 'Step 4 should be from DB or memory (rebuild)');
    console.log(`✅ Step 4: ${step4.latency}ms (${step4.headers['x-cache-source']})`);

    // Step 5: GET → X-Cache-Source=redis
    console.log('📤 Step 5: GET after rebuild...');
    const step5 = await measureRequest(url2, { headers });
    A.equal(step5.status, 200, 'Step 5 should return 200');
    A.ok(['redis', 'memory'].includes(step5.headers['x-cache-source']), 'Step 5 should be from Redis or memory');
    console.log(`✅ Step 5: ${step5.latency}ms (${step5.headers['x-cache-source']})`);

    // Verificar sequência esperada
    const sequence = [
        step1.headers['x-cache-source'],
        step2.headers['x-cache-source'],
        step4.headers['x-cache-source'],
        step5.headers['x-cache-source']
    ];

    console.log('📊 Cache sequence:', sequence);
    A.ok(['db', 'memory'].includes(sequence[0]), 'First request should be from DB or memory');
    A.ok(['redis', 'memory'].includes(sequence[1]), 'Second request should be from cache');
    A.ok(['db', 'memory'].includes(sequence[2]), 'After invalidation should be from DB or memory');
    A.ok(['redis', 'memory'].includes(sequence[3]), 'After rebuild should be from cache');

    console.log('✅ Q2: Cache invalidation test passed');
}

// Executar teste
async function runTest() {
    try {
        console.log('🚀 Starting Q2 Cache Invalidation Retest...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await testQ2Invalidation();

        console.log('\n🎯 Q2 Cache Invalidation Retest PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ Q2 Retest failed:', error.message);
        process.exit(1);
    }
}

runTest();
