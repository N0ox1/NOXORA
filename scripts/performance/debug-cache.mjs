import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

async function debugCache() {
    console.log('🔍 Debugging cache behavior...');

    // Primeira requisição
    console.log('📤 First request...');
    const first = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    console.log('Status:', first.status);
    console.log('Headers:', Object.fromEntries(first.headers.entries()));

    const firstData = await first.json();
    console.log('Data length:', firstData.items?.length || 0);

    // Segunda requisição
    console.log('\n📤 Second request...');
    const second = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    console.log('Status:', second.status);
    console.log('Headers:', Object.fromEntries(second.headers.entries()));

    const secondData = await second.json();
    console.log('Data length:', secondData.items?.length || 0);

    // Verificar se os dados são iguais
    console.log('\n🔍 Comparing data...');
    console.log('First data:', JSON.stringify(firstData, null, 2));
    console.log('Second data:', JSON.stringify(secondData, null, 2));

    console.log('✅ Debug completed');
}

debugCache().catch(console.error);


















