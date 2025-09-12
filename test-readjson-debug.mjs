// Testar se o readJson está funcionando corretamente
async function readJson(req) {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return undefined;
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}

// Teste 1: Mock request normal
console.log('🧪 Teste 1: Mock request normal');
const mockReq1 = {
    headers: {
        get: (key) => key === 'content-type' ? 'application/json' : null
    },
    json: async () => ({ name: 'Novo Nome' })
};

const result1 = await readJson(mockReq1);
console.log('Resultado 1:', result1);
console.log('É Promise?', result1 instanceof Promise);
console.log('Tipo:', typeof result1);

// Teste 2: Mock request que retorna Promise
console.log('\n🧪 Teste 2: Mock request que retorna Promise');
const mockReq2 = {
    headers: {
        get: (key) => key === 'content-type' ? 'application/json' : null
    },
    json: () => Promise.resolve({ name: 'Novo Nome' }) // sem async
};

const result2 = await readJson(mockReq2);
console.log('Resultado 2:', result2);
console.log('É Promise?', result2 instanceof Promise);
console.log('Tipo:', typeof result2);

// Teste 3: Verificar se readJson retorna Promise
console.log('\n🧪 Teste 3: Verificar se readJson retorna Promise');
const maybe = readJson(mockReq1);
console.log('readJson(mockReq1) é Promise?', maybe instanceof Promise);
console.log('Tipo do readJson:', typeof maybe);
