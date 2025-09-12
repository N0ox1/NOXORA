#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';
const TENANT_ID = 'test-tenant-123';

async function testEndpointDebug() {
    console.log('🧪 Testando endpoint de debug...');

    try {
        // Teste 1: GET para ver se o endpoint existe
        console.log('\n1️⃣ Testando GET...');
        const response1 = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'GET',
            headers: {
                'X-Tenant-Id': TENANT_ID
            }
        });
        console.log('GET Status:', response1.status);
        const response1Text = await response1.text();
        console.log('GET Response:', response1Text.substring(0, 200));

        // Teste 2: PUT com dados válidos
        console.log('\n2️⃣ Testando PUT com dados válidos...');
        const response2 = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                'X-Actor-Id': 'test-actor',
                'X-Request-Id': 'test-request'
            },
            body: JSON.stringify({ name: 'Test Employee' })
        });
        console.log('PUT Status:', response2.status);
        const response2Text = await response2.text();
        console.log('PUT Response:', response2Text);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testEndpointDebug();
