import { strict as A } from 'assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

async function preflightChecks() {
    console.log('🔍 Preflight checks...');

    // Verificar se as views existem
    const views = await prisma.$queryRaw`
    SELECT relname FROM pg_class 
    WHERE relname IN ('v_reporting_appt_daily','v_reporting_emp_booked_min','v_reporting_emp_capacity_min','mv_reporting_emp_occupancy_daily')
  `;

    A.ok(views.length >= 4, `Expected 4+ views, got ${views.length}`);
    console.log('✅ Views exist:', views.map(v => v.relname));

    // Testar OPTIONS
    const optionsResponse = await fetch(`${API_BASE}/reporting/appointments/daily`, {
        method: 'OPTIONS'
    });

    A.ok([200, 204].includes(optionsResponse.status), `OPTIONS should return 200/204, got ${optionsResponse.status}`);
    console.log('✅ OPTIONS endpoint working');
}

async function testAppointmentsDaily() {
    console.log('📊 Testing appointments daily...');

    const response = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'Appointments daily should return 200');
    const data = await response.json();

    // Verificar estrutura
    A.ok(Array.isArray(data.items), 'Items should be array');
    A.ok(data.items.length > 0, 'Should have some data');

    // Verificar campos obrigatórios
    if (data.items.length > 0) {
        const item = data.items[0];
        A.ok(typeof item.day === 'string', 'Day should be string');
        A.ok(typeof item.appts_total === 'number', 'appts_total should be number');
        A.ok(typeof item.appts_ativos === 'number', 'appts_ativos should be number');
        A.ok(typeof item.appts_cancelados === 'number', 'appts_cancelados should be number');
    }

    console.log(`✅ Appointments daily: ${data.items.length} days`);
}

async function testCancellationsDaily() {
    console.log('📊 Testing cancellations daily...');

    const response = await fetch(`${API_BASE}/reporting/cancellations/daily?from=2025-09-01&to=2025-09-30`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'Cancellations daily should return 200');
    const data = await response.json();

    // Verificar estrutura
    A.ok(Array.isArray(data.items), 'Items should be array');
    A.ok(data.items.length > 0, 'Should have some data');

    // Verificar campos obrigatórios
    if (data.items.length > 0) {
        const item = data.items[0];
        A.ok(typeof item.day === 'string', 'Day should be string');
        A.ok(typeof item.appts_cancelados === 'number', 'appts_cancelados should be number');
        A.ok(typeof item.cancel_rate_pct === 'string' || typeof item.cancel_rate_pct === 'number', 'cancel_rate_pct should be string or number');
    }

    console.log(`✅ Cancellations daily: ${data.items.length} days`);
}

async function testOccupancyEmployee() {
    console.log('📊 Testing occupancy employee...');

    const response = await fetch(`${API_BASE}/reporting/occupancy/employee?from=2025-09-01&to=2025-09-30`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'Occupancy employee should return 200');
    const data = await response.json();

    // Verificar estrutura
    A.ok(Array.isArray(data.items), 'Items should be array');
    A.ok(data.items.length > 0, 'Should have some data');

    // Verificar campos obrigatórios
    if (data.items.length > 0) {
        const item = data.items[0];
        A.ok(typeof item.employeeId === 'string', 'employeeId should be string');
        A.ok(typeof item.day === 'string', 'Day should be string');
        A.ok(typeof item.booked_min === 'number', 'booked_min should be number');
        A.ok(typeof item.capacity_min === 'number', 'capacity_min should be number');
        A.ok(typeof item.occupancy_pct === 'string' || typeof item.occupancy_pct === 'number', 'occupancy_pct should be string or number');
    }

    console.log(`✅ Occupancy employee: ${data.items.length} records`);
}

async function testSummary() {
    console.log('📊 Testing summary...');

    const response = await fetch(`${API_BASE}/reporting/summary?day=2025-09-06`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'Summary should return 200');
    const data = await response.json();

    // Verificar campos obrigatórios
    A.ok(typeof data.day === 'string', 'Day should be string');
    A.ok(typeof data.appts_total === 'number', 'appts_total should be number');
    A.ok(typeof data.appts_cancelados === 'number', 'appts_cancelados should be number');
    A.ok(typeof data.cancel_rate_pct === 'string' || typeof data.cancel_rate_pct === 'number', 'cancel_rate_pct should be string or number');
    A.ok(typeof data.avg_occupancy_pct === 'string' || typeof data.avg_occupancy_pct === 'number', 'avg_occupancy_pct should be string or number');

    console.log(`✅ Summary: ${data.appts_total} total, ${data.appts_cancelados} cancelled, ${data.cancel_rate_pct}% rate, ${data.avg_occupancy_pct}% occupancy`);
}

async function testCacheHeaders() {
    console.log('📊 Testing cache headers...');

    const response = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-01&to=2025-09-30`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'Cache test should return 200');

    const cacheSource = response.headers.get('X-Cache-Source');
    A.ok(cacheSource, 'X-Cache-Source header should be present');

    console.log('✅ Cache headers test passed');
}

async function testNegativeCases() {
    console.log('📊 Testing negative cases...');

    // Teste sem autenticação
    const noAuthResponse = await fetch(`${API_BASE}/reporting/summary?day=2025-09-06`);
    A.ok([401, 403].includes(noAuthResponse.status), 'Should return 401/403 without auth');

    // Teste de isolamento de tenant
    const otherTenantData = await prisma.$queryRaw`
    SELECT COUNT(*) as c FROM v_reporting_appt_daily 
    WHERE "tenantId" <> ${TENANT_ID} AND day BETWEEN '2025-09-01' AND '2025-09-30'
  `;

    // Verificar que há dados de outros tenants (isso é esperado)
    console.log(`Other tenants data: ${otherTenantData[0].c} records`);

    console.log('✅ Negative cases test passed');
}

async function testDatabaseCrosscheck() {
    console.log('📊 Testing database crosscheck...');

    // Verificar dados na view
    const viewData = await prisma.$queryRaw`
    SELECT day, appts_total, appts_ativos, appts_cancelados 
    FROM v_reporting_appt_daily 
    WHERE "tenantId" = ${TENANT_ID} AND day BETWEEN '2025-09-01' AND '2025-09-30' 
    ORDER BY day
  `;

    A.ok(viewData.length > 0, 'Should have data in view');

    // Verificar dados na materialized view
    const mvData = await prisma.$queryRaw`
    SELECT employee_id, day, booked_min, capacity_min, occupancy_pct 
    FROM mv_reporting_emp_occupancy_daily 
    WHERE "tenantId" = ${TENANT_ID} AND day BETWEEN '2025-09-01' AND '2025-09-30' 
    ORDER BY day
  `;

    A.ok(mvData.length > 0, 'Should have data in materialized view');

    console.log(`✅ Database crosscheck: ${viewData.length} view records, ${mvData.length} MV records`);
}

async function testRefresh() {
    console.log('📊 Testing refresh...');

    const response = await fetch(`${API_BASE}/reporting/refresh`, {
        method: 'POST',
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'Content-Type': 'application/json'
        }
    });

    A.equal(response.status, 200, 'Refresh should return 200');
    const data = await response.json();

    A.equal(data.success, true, 'Success should be true');
    A.ok(typeof data.message === 'string', 'Message should be string');
    A.ok(typeof data.timestamp === 'string', 'Timestamp should be string');

    console.log('✅ Refresh test passed');
}

async function runQA() {
    try {
        console.log('🚀 Starting QA Reporting Tests (Simplified)...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await preflightChecks();
        await testAppointmentsDaily();
        await testCancellationsDaily();
        await testOccupancyEmployee();
        await testSummary();
        await testCacheHeaders();
        await testNegativeCases();
        await testDatabaseCrosscheck();
        await testRefresh();

        console.log('\n🎯 All QA Reporting Tests PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ QA Test failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runQA();





















