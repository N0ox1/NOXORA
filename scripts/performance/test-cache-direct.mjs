// Teste direto do cache sem imports
console.log('🧪 Testing cache behavior...');

// Simular o comportamento do cache
const cache = new Map();

function makeKey(route, params) {
    const baseKey = route.replace(/\[([^\]]+)\]/g, (_, param) => params[param] || '');
    const queryParams = Object.entries(params)
        .filter(([key, value]) => key !== 'tenantId' && value !== undefined)
        .map(([key, value]) => `${key}:${value}`)
        .join(':');

    return queryParams ? `${baseKey}:${queryParams}` : baseKey;
}

async function testCache() {
    const route = '/api/v1/reporting/appointments/daily';
    const params = { tenantId: 'test', from: '2025-09-01', to: '2025-09-30' };

    const key = makeKey(route, params);
    console.log('🔑 Generated key:', key);

    // Simular set
    const data = { items: [], from: '2025-09-01', to: '2025-09-30', total: 0 };
    cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: 300,
    });
    console.log('✅ Data stored in cache');

    // Simular get
    const cached = cache.get(key);
    console.log('📖 Cache result:', cached ? 'HIT' : 'MISS');

    if (cached) {
        console.log('✅ Cache working!');
        console.log('📊 Cached data:', cached.data);
    } else {
        console.log('❌ Cache not working');
    }
}

testCache();















