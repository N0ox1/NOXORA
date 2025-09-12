#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';
const TENANT_ID = 'test-tenant-123';

async function testStepByStep() {
    console.log('🧪 Testando endpoint passo a passo...');

    try {
        // Teste 1: Apenas headers
        console.log('\n1️⃣ Testando apenas headers...');
        const response1 = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'GET',
            headers: {
                'X-Tenant-Id': TENANT_ID
            }
        });
        console.log('GET Status:', response1.status);

        // Teste 2: PUT sem body
        console.log('\n2️⃣ Testando PUT sem body...');
        const response2 = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                'X-Actor-Id': 'test-actor',
                'X-Request-Id': 'test-request'
            }
        });
        console.log('PUT sem body Status:', response2.status);
        const response2Text = await response2.text();
        console.log('PUT sem body Response:', response2Text);

        // Teste 3: PUT com body
        console.log('\n3️⃣ Testando PUT com body...');
        const response3 = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                'X-Actor-Id': 'test-actor',
                'X-Request-Id': 'test-request'
            },
            body: JSON.stringify({ name: 'Test Employee' })
        });
        console.log('PUT com body Status:', response3.status);
        const response3Text = await response3.text();
        console.log('PUT com body Response:', response3Text);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testStepByStep();
