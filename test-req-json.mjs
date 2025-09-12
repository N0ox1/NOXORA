// Simular o que acontece com req.json()
console.log('🧪 Testando req.json()...');

// Simular uma requisição
const mockReq = {
    json: async () => {
        console.log('req.json() chamado');
        return { name: 'Novo Nome' };
    }
};

// Simular o que acontece no endpoint
async function testEndpoint() {
    try {
        console.log('1️⃣ Chamando req.json()...');
        const body = await mockReq.json();
        console.log('Body recebido:', body);
        console.log('Tipo do body:', typeof body);
        console.log('Body é Promise:', body instanceof Promise);

        // Simular validação
        const { z } = await import('zod');
        const schema = z.object({
            name: z.string().optional()
        });

        console.log('2️⃣ Validando com Zod...');
        const result = schema.safeParse(body);
        console.log('Resultado da validação:', result.success ? '✅ Sucesso' : '❌ Erro');
        if (!result.success) {
            console.log('Erro:', result.error.flatten());
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

testEndpoint();
