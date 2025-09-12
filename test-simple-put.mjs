const BASE_URL = 'http://localhost:3000';

async function testSimplePut() {
    console.log('🧪 Testando PUT simples...');

    try {
        const response = await fetch(`${BASE_URL}/api/v1/test-security`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant-audit'
            },
            body: JSON.stringify({
                name: 'Test Employee',
                role: 'BARBER',
                barbershopId: '123e4567-e89b-12d3-a456-426614174000'
            })
        });

        const data = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${data}`);

    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

testSimplePut();
