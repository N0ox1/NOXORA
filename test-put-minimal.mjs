const BASE_URL = 'http://localhost:3000';

async function testPutMinimal() {
    console.log('🧪 Teste PUT mínimo...');

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

        if (response.status === 422) {
            try {
                const json = JSON.parse(text);
                console.log('Erro detalhado:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Response não é JSON');
            }
        }

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testPutMinimal();
