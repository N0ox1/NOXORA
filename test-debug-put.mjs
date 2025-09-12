const BASE_URL = 'http://localhost:3000';

async function testDebugPut() {
    console.log('🔍 Debug PUT /api/v1/employees/[id]...');
    
    const employeeId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
        name: 'Updated Employee Name',
        role: 'MANAGER'
    };
    
    try {
        console.log('📤 Enviando requisição...');
        const response = await fetch(`${BASE_URL}/api/v1/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant-audit'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
        
        const data = await response.text();
        console.log(`📊 Response: ${data}`);
        
        if (response.status === 200) {
            console.log('✅ PUT funcionando corretamente');
        } else if (response.status === 422) {
            console.log('❌ PUT retornando 422 - erro de validação');
            try {
                const jsonData = JSON.parse(data);
                console.log('📋 Detalhes do erro:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('📋 Response não é JSON válido');
            }
        } else {
            console.log(`❌ PUT retornando status inesperado: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

testDebugPut();
