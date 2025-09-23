import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TENANT_ID = process.env.TENANT_ID;

// One-liner para loop de erros
async function errorLoop() {
    console.log('🔄 Running error loop (20 errors)...');

    const promises = [];
    for (let i = 1; i <= 20; i++) {
        const command = `curl -s -o NUL -H "X-Tenant-Id: ${TENANT_ID}" -H "X-Request-Id: sentry-${i}" "${API_BASE}/v1/_test/error"`;
        promises.push(execAsync(command));
    }

    await Promise.all(promises);
    console.log('✅ Error loop completed - check Sentry for events');
}

// One-liner para burst de serviços
async function servicesBurst() {
    console.log('🔄 Running services burst (50 requests)...');

    const promises = [];
    for (let i = 1; i <= 50; i++) {
        const command = `curl -s -o NUL -H "X-Tenant-Id: ${TENANT_ID}" "${API_BASE}/v1/services"`;
        promises.push(execAsync(command));
    }

    await Promise.all(promises);
    console.log('✅ Services burst completed - check dashboards for metrics');
}

// Executar baseado no argumento
const command = process.argv[2];

if (command === 'error-loop') {
    errorLoop();
} else if (command === 'services-burst') {
    servicesBurst();
} else {
    console.log('Usage: node one-liners.mjs [error-loop|services-burst]');
    process.exit(1);
}














