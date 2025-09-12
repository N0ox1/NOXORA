const BASE_URL = 'http://localhost:3000';

async function testPutEmployee() {
    console.log('🧪 Testando PUT /api/v1/employees/[id]...');

    const employeeId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
        name: 'Updated Employee Name',
        role: 'MANAGER'
    };

    try {
        const response = await fetch(`${BASE_URL}/api/v1/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant-audit'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${data}`);

        if (response.status === 200) {
            console.log('✅ PUT funcionando corretamente');
        } else {
            console.log('❌ PUT ainda com problemas');
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

testPutEmployee();
