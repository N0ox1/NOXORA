#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';

async function testSimpleEndpoint() {
    console.log('🧪 Testando endpoint simples...');

    try {
        const response = await fetch(`${API_BASE}/v1/test-simple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Test Employee' })
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', responseText);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testSimpleEndpoint();
