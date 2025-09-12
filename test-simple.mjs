#!/usr/bin/env node

console.log('🔒 Iniciando testes de segurança...\n');

const API_BASE = 'http://localhost:3000/api';
const TENANT_ID = 'cmf75rzl50000ua781bk91jmq';

async function testEndpoint(name, method, url, headers, body, expectedStatus) {
    console.log(`🧪 Testando: ${name}`);

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: typeof body === 'string' ? body : JSON.stringify(body)
        });

        const responseText = await response.text();
        let responseJson = null;
        try {
            responseJson = JSON.parse(responseText);
        } catch (e) {
            // Não é JSON
        }

        const passed = response.status === expectedStatus;
        console.log(`${passed ? '✅' : '❌'} ${name} - Status: ${response.status} (esperado: ${expectedStatus})`);

        if (!passed) {
            console.log(`   Resposta: ${responseText.substring(0, 200)}...`);
        }

        return { name, passed, status: response.status, response: responseJson || responseText };
    } catch (error) {
        console.log(`❌ ${name} - Erro: ${error.message}`);
        return { name, passed: false, error: error.message };
    }
}

async function runTests() {
    const results = [];

    // Teste 1: Content-Type inválido
    results.push(await testEndpoint(
        'Content-Type inválido deve falhar',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'text/plain', 'X-Tenant-Id': TENANT_ID },
        '{"name":"Valid Name","role":"BARBER","barbershopId":"123e4567-e89b-12d3-a456-426614174000"}',
        415
    ));

    // Teste 2: XSS
    results.push(await testEndpoint(
        'XSS deve ser bloqueado',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        { name: '<script>alert(1)</script>', role: 'BARBER', barbershopId: '123e4567-e89b-12d3-a456-426614174000' },
        422
    ));

    // Teste 3: SQL Injection
    results.push(await testEndpoint(
        'SQLi deve ser bloqueado',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        { name: "'; DROP TABLE users; --", role: 'BARBER', barbershopId: '123e4567-e89b-12d3-a456-426614174000' },
        422
    ));

    // Teste 4: Caracteres de controle
    results.push(await testEndpoint(
        'Caracteres de controle devem ser bloqueados',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        { name: 'Test\u0000\u0001', role: 'BARBER', barbershopId: '123e4567-e89b-12d3-a456-426614174000' },
        422
    ));

    // Teste 5: String longa
    results.push(await testEndpoint(
        'String longa deve falhar',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        { name: 'A'.repeat(600), role: 'BARBER', barbershopId: '123e4567-e89b-12d3-a456-426614174000' },
        422
    ));

    // Teste 6: UUID inválido
    results.push(await testEndpoint(
        'UUID inválido deve falhar',
        'POST',
        `${API_BASE}/v1/test-security`,
        { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID },
        { name: 'Valid Name', role: 'BARBER', barbershopId: 'not-a-uuid' },
        422
    ));

    // Teste 7: Criar employee
    results.push(await testEndpoint(
        'Criar employee para gerar audit',
        'POST',
        `${API_BASE}/v1/employees`,
        {
            'Content-Type': 'application/json',
            'X-Tenant-Id': TENANT_ID,
            'X-Actor-Id': 'qa-actor',
            'X-Request-Id': 'qa-audit-create'
        },
        { name: 'Audit QA', role: 'BARBER', barbershopId: '123e4567-e89b-12d3-a456-426614174000' },
        201
    ));

    // Resumo
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`Total: ${total}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${total - passed}`);

    return results;
}

runTests().catch(console.error);
