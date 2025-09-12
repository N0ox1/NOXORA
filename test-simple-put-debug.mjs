const BASE_URL = 'http://localhost:3000';

async function testSimplePutDebug() {
    console.log('🔍 Teste simples PUT...');

    try {
        const response = await fetch(`${BASE_URL}/api/v1/employees/123e4567-e89b-12d3-a456-426614174000`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant-audit'
            },
            body: JSON.stringify({ name: 'Test' })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testSimplePutDebug();
