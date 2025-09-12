#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';
const TENANT_ID = 'test-tenant-123';

async function testDebugSimple() {
    console.log('🧪 Testando endpoint de debug simples...');

    try {
        const response = await fetch(`${API_BASE}/v1/test-debug-simple/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'GET',
            headers: {
                'X-Tenant-Id': TENANT_ID
            }
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', responseText);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testDebugSimple();
