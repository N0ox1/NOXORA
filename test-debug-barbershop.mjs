#!/usr/bin/env node

const base = 'http://localhost:3000';
const tenantId = 'cmffwm0j20000uaoo2c4ugtvx';

console.log('🧪 Debug da API de barbershop...\n');

async function debugBarbershop() {
    try {
        console.log('1️⃣ Testando debug de barbershops...');
        const debugResponse = await fetch(`${base}/api/v1/debug-barbershops`, {
            headers: { 'x-tenant-id': tenantId }
        });

        console.log('Status:', debugResponse.status);
        const debugData = await debugResponse.text();
        console.log('Debug response:', debugData);

        console.log('\n2️⃣ Testando debug de tenant...');
        const tenantResponse = await fetch(`${base}/api/v1/tenant/test`, {
            headers: { 'x-tenant-id': tenantId }
        });

        console.log('Status:', tenantResponse.status);
        const tenantData = await tenantResponse.text();
        console.log('Tenant response:', tenantData);

    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
    }
}

debugBarbershop();
