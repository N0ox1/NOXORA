#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';
const TENANT_ID = 'test-tenant-123';

async function testEmployeeUpdate() {
    console.log('🧪 Testando update de employee...');

    try {
        const response = await fetch(`${API_BASE}/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                'X-Actor-Id': 'test-actor',
                'X-Request-Id': 'test-request'
            },
            body: JSON.stringify({ name: 'Updated Employee Name' })
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', responseText);

        if (response.status === 200) {
            console.log('✅ Update funcionou!');
        } else {
            console.log('❌ Update falhou');
        }

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testEmployeeUpdate();
