import { strict as A } from 'assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Variáveis para armazenar IDs criados
let employeeId, serviceId, clientId, appt1, appt2, appt3, appt4, appt5;

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

async function seedData() {
    console.log('🌱 Seeding test data...');

    // 1. Criar funcionário
    const empResponse = await fetch(`${API_BASE.replace('/v1', '')}/employees`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'QA Barber 1',
            role: 'BARBER',
            email: 'qa.barber1@noxora.dev'
        })
    });

    A.equal(empResponse.status, 201, 'Employee creation should return 201');
    const empData = await empResponse.json();
    employeeId = empData.id;
    console.log('✅ Employee created:', employeeId);

    // 2. Criar serviço
    const svcResponse = await fetch(`${API_BASE.replace('/v1', '')}/services`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Corte 30',
            durationMin: 30,
            priceCents: 5000,
            isActive: true
        })
    });

    A.equal(svcResponse.status, 201, 'Service creation should return 201');
    const svcData = await svcResponse.json();
    serviceId = svcData.id;
    console.log('✅ Service created:', serviceId);

    // 3. Criar cliente
    const clientResponse = await fetch(`${API_BASE.replace('/v1', '')}/clients`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Cliente QA',
            phone: '+5500000000000',
            email: 'cliente.qa@noxora.dev'
        })
    });

    A.equal(clientResponse.status, 201, 'Client creation should return 201');
    const clientData = await clientResponse.json();
    clientId = clientData.id;
    console.log('✅ Client created:', clientId);

    // 4. Configurar horários do funcionário
    for (let weekday = 0; weekday <= 6; weekday++) {
        await prisma.$executeRaw`
      INSERT INTO employees_hours(employee_id, weekday, start_time, end_time, break_min)
      VALUES (${employeeId}, ${weekday}, '08:00', '17:00', 60) 
      ON CONFLICT DO NOTHING
    `;
    }
    console.log('✅ Employee hours configured');

    // 5. Criar agendamentos
    const appointments = [
        { idempotency: 'rpt-1', startAt: '2025-09-10T12:00:00Z', expectedStatus: 201 },
        { idempotency: 'rpt-2', startAt: '2025-09-10T13:00:00Z', expectedStatus: 201 },
        { idempotency: 'rpt-3', startAt: '2025-09-11T09:00:00Z', expectedStatus: 201 },
        { idempotency: 'rpt-4', startAt: '2025-09-11T10:00:00Z', expectedStatus: 201 },
        { idempotency: 'rpt-5', startAt: '2025-09-12T15:00:00Z', expectedStatus: 201 }
    ];

    for (const appt of appointments) {
        const response = await fetch(`${API_BASE.replace('/v1', '')}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': appt.idempotency
            },
            body: JSON.stringify({
                serviceId,
                employeeId,
                clientId,
                startAt: appt.startAt
            })
        });

        A.equal(response.status, appt.expectedStatus, `Appointment ${appt.idempotency} should return ${appt.expectedStatus}`);
        const data = await response.json();

        if (appt.idempotency === 'rpt-1') appt1 = data.id;
        if (appt.idempotency === 'rpt-2') appt2 = data.id;
        if (appt.idempotency === 'rpt-3') appt3 = data.id;
        if (appt.idempotency === 'rpt-4') appt4 = data.id;
        if (appt.idempotency === 'rpt-5') appt5 = data.id;
    }

    console.log('✅ Appointments created');

    // 6. Cancelar agendamento 2
    const cancelResponse = await fetch(`${API_BASE.replace('/v1', '')}/appointments/${appt2}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(cancelResponse.status, 200, 'Cancel should return 200');
    console.log('✅ Appointment 2 cancelled');

    // 7. Completar agendamento 4
    const completeResponse = await fetch(`${API_BASE.replace('/v1', '')}/appointments/${appt4}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(completeResponse.status, 200, 'Complete should return 200');
    console.log('✅ Appointment 4 completed');
}

async function refreshMaterializedView() {
    console.log('🔄 Refreshing materialized view...');

    await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reporting_emp_occupancy_daily
  `;

    console.log('✅ Materialized view refreshed');
}

async function testAppointmentsDaily() {
    console.log('📊 Testing appointments daily...');

    const response = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-10&to=2025-09-12`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(response.status, 200, 'Appointments daily should return 200');
    const data = await response.json();

    // Verificar estrutura
    A.ok(Array.isArray(data.items), 'Items should be array');
    A.equal(data.items.length, 3, 'Should have 3 days of data');

    // Verificar dados específicos
    const day10 = data.items.find(item => item.day === '2025-09-10T00:00:00.000Z');
    const day11 = data.items.find(item => item.day === '2025-09-11T00:00:00.000Z');
    const day12 = data.items.find(item => item.day === '2025-09-12T00:00:00.000Z');

    A.ok(day10, 'Day 10 should exist');
    A.equal(day10.appts_total, 2, 'Day 10 should have 2 total appointments');
    A.equal(day10.appts_ativos, 1, 'Day 10 should have 1 active appointment');
    A.equal(day10.appts_cancelados, 1, 'Day 10 should have 1 cancelled appointment');

    A.ok(day11, 'Day 11 should exist');
    A.equal(day11.appts_total, 2, 'Day 11 should have 2 total appointments');
    A.equal(day11.appts_ativos, 2, 'Day 11 should have 2 active appointments');
    A.equal(day11.appts_cancelados, 0, 'Day 11 should have 0 cancelled appointments');

    A.ok(day12, 'Day 12 should exist');
    A.equal(day12.appts_total, 1, 'Day 12 should have 1 total appointment');
    A.equal(day12.appts_ativos, 1, 'Day 12 should have 1 active appointment');
    A.equal(day12.appts_cancelados, 0, 'Day 12 should have 0 cancelled appointments');

    console.log('✅ Appointments daily test passed');
}

async function testCancellationsDaily() {
    console.log('📊 Testing cancellations daily...');

    const response = await fetch(`${API_BASE}/reporting/cancellations/daily?from=2025-09-10&to=2025-09-12`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(response.status, 200, 'Cancellations daily should return 200');
    const data = await response.json();

    // Verificar dados específicos
    const day10 = data.items.find(item => item.day === '2025-09-10T00:00:00.000Z');
    const day11 = data.items.find(item => item.day === '2025-09-11T00:00:00.000Z');
    const day12 = data.items.find(item => item.day === '2025-09-12T00:00:00.000Z');

    A.ok(day10, 'Day 10 should exist');
    A.equal(day10.appts_cancelados, 1, 'Day 10 should have 1 cancelled appointment');
    A.equal(parseFloat(day10.cancel_rate_pct), 50.0, 'Day 10 should have 50% cancellation rate');

    A.ok(day11, 'Day 11 should exist');
    A.equal(day11.appts_cancelados, 0, 'Day 11 should have 0 cancelled appointments');
    A.equal(parseFloat(day11.cancel_rate_pct), 0.0, 'Day 11 should have 0% cancellation rate');

    A.ok(day12, 'Day 12 should exist');
    A.equal(day12.appts_cancelados, 0, 'Day 12 should have 0 cancelled appointments');
    A.equal(parseFloat(day12.cancel_rate_pct), 0.0, 'Day 12 should have 0% cancellation rate');

    console.log('✅ Cancellations daily test passed');
}

async function testOccupancyEmployee() {
    console.log('📊 Testing occupancy employee...');

    const response = await fetch(`${API_BASE}/reporting/occupancy/employee?from=2025-09-10&to=2025-09-12&employeeId=${employeeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(response.status, 200, 'Occupancy employee should return 200');
    const data = await response.json();

    // Verificar dados específicos
    const day10 = data.items.find(item => item.day === '2025-09-10T00:00:00.000Z');
    const day11 = data.items.find(item => item.day === '2025-09-11T00:00:00.000Z');
    const day12 = data.items.find(item => item.day === '2025-09-12T00:00:00.000Z');

    A.ok(day10, 'Day 10 should exist');
    A.equal(day10.employeeId, employeeId, 'Employee ID should match');
    A.equal(day10.booked_min, 30, 'Day 10 should have 30 booked minutes');
    A.equal(day10.capacity_min, 480, 'Day 10 should have 480 capacity minutes');
    A.equal(parseFloat(day10.occupancy_pct), 6.3, 'Day 10 should have 6.3% occupancy');

    A.ok(day11, 'Day 11 should exist');
    A.equal(day11.employeeId, employeeId, 'Employee ID should match');
    A.equal(day11.booked_min, 60, 'Day 11 should have 60 booked minutes');
    A.equal(day11.capacity_min, 480, 'Day 11 should have 480 capacity minutes');
    A.equal(parseFloat(day11.occupancy_pct), 12.5, 'Day 11 should have 12.5% occupancy');

    A.ok(day12, 'Day 12 should exist');
    A.equal(day12.employeeId, employeeId, 'Employee ID should match');
    A.equal(day12.booked_min, 30, 'Day 12 should have 30 booked minutes');
    A.equal(day12.capacity_min, 480, 'Day 12 should have 480 capacity minutes');
    A.equal(parseFloat(day12.occupancy_pct), 6.3, 'Day 12 should have 6.3% occupancy');

    console.log('✅ Occupancy employee test passed');
}

async function testSummary() {
    console.log('📊 Testing summary...');

    const response = await fetch(`${API_BASE}/reporting/summary?day=2025-09-11`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
        }
    });

    A.equal(response.status, 200, 'Summary should return 200');
    const data = await response.json();

    A.equal(data.day, '2025-09-11T00:00:00.000Z', 'Day should be 2025-09-11');
    A.equal(data.appts_total, 2, 'Should have 2 total appointments');
    A.equal(data.appts_cancelados, 0, 'Should have 0 cancelled appointments');
    A.equal(parseFloat(data.cancel_rate_pct), 0.0, 'Should have 0% cancellation rate');
    A.equal(parseFloat(data.avg_occupancy_pct), 12.5, 'Should have 12.5% average occupancy');

    console.log('✅ Summary test passed');
}

async function testCacheHeaders() {
    console.log('📊 Testing cache headers...');

    const response = await fetch(`${API_BASE}/reporting/appointments/daily?from=2025-09-10&to=2025-09-12`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`
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
    const noAuthResponse = await fetch(`${API_BASE}/reporting/summary?day=2025-09-11`);
    A.ok([401, 403].includes(noAuthResponse.status), 'Should return 401/403 without auth');

    // Teste de isolamento de tenant
    const otherTenantData = await prisma.$queryRaw`
    SELECT COUNT(*) as c FROM v_reporting_appt_daily 
    WHERE "tenantId" <> ${TENANT_ID} AND day BETWEEN '2025-09-10' AND '2025-09-12'
  `;

    A.equal(parseInt(otherTenantData[0].c), 0, 'Should have 0 appointments from other tenants');

    console.log('✅ Negative cases test passed');
}

async function testDatabaseCrosscheck() {
    console.log('📊 Testing database crosscheck...');

    // Verificar dados na view
    const viewData = await prisma.$queryRaw`
    SELECT day, appts_total, appts_ativos, appts_cancelados 
    FROM v_reporting_appt_daily 
    WHERE "tenantId" = ${TENANT_ID} AND day BETWEEN '2025-09-10' AND '2025-09-12' 
    ORDER BY day
  `;

    A.equal(viewData.length, 3, 'Should have 3 days in view');

    // Verificar dados na materialized view
    const mvData = await prisma.$queryRaw`
    SELECT employee_id, day, booked_min, capacity_min, occupancy_pct 
    FROM mv_reporting_emp_occupancy_daily 
    WHERE "tenantId" = ${TENANT_ID} AND employee_id = ${employeeId} AND day BETWEEN '2025-09-10' AND '2025-09-12' 
    ORDER BY day
  `;

    A.equal(mvData.length, 3, 'Should have 3 days in materialized view');

    console.log('✅ Database crosscheck passed');
}

async function cleanup() {
    console.log('🧹 Cleaning up test data...');

    // Deletar agendamentos
    await prisma.$executeRaw`
    DELETE FROM appointments WHERE "tenantId" = ${TENANT_ID} AND "clientId" = ${clientId}
  `;

    // Deletar cliente
    await prisma.$executeRaw`
    DELETE FROM clients WHERE id = ${clientId}
  `;

    // Deletar serviço
    await prisma.$executeRaw`
    DELETE FROM services WHERE id = ${serviceId}
  `;

    // Deletar horários do funcionário
    await prisma.$executeRaw`
    DELETE FROM employees_hours WHERE employee_id = ${employeeId}
  `;

    // Deletar funcionário
    await prisma.$executeRaw`
    DELETE FROM employees WHERE id = ${employeeId}
  `;

    console.log('✅ Cleanup completed');
}

async function runQA() {
    try {
        console.log('🚀 Starting QA Reporting Tests...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');
        A.ok(AUTH_TOKEN, 'AUTH_TOKEN env var required');

        await preflightChecks();
        await seedData();
        await refreshMaterializedView();

        await testAppointmentsDaily();
        await testCancellationsDaily();
        await testOccupancyEmployee();
        await testSummary();
        await testCacheHeaders();
        await testNegativeCases();
        await testDatabaseCrosscheck();

        await cleanup();

        console.log('\n🎯 All QA Reporting Tests PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ QA Test failed:', error.message);
        await cleanup();
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runQA();


