// Teste simples da API
const testApi = async () => {
    try {
        console.log('Testando API de serviços...');

        const response = await fetch('http://localhost:3000/api/v1/services', {
            headers: { 'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx' }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Response length:', text.length);
        console.log('Response text:', text.substring(0, 200));

        if (text) {
            try {
                const json = JSON.parse(text);
                console.log('JSON válido:', Array.isArray(json));
            } catch (e) {
                console.log('Não é JSON válido');
            }
        }

    } catch (error) {
        console.error('Erro:', error);
    }
};

testApi();
