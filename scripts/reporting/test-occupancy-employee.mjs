import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;
const EMPLOYEE_ID = process.env.EMPLOYEE_ID;

export default async function testOccupancyEmployee() {
    A.ok(TENANT_ID, 'TENANT_ID env var required');

    const from = '2025-09-01';
    const to = '2025-09-30';

    // Teste sem filtro de funcionário
    const response1 = await fetch(`${API_BASE}/reporting/occupancy/employee?from=${from}&to=${to}`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response1.status, 200, 'occupancy employee 200');

    const data1 = await response1.json();
    A.ok(Array.isArray(data1.items), 'items is array');
    A.ok(typeof data1.from === 'string', 'from field present');
    A.ok(typeof data1.to === 'string', 'to field present');
    A.ok(data1.employeeId === null, 'employeeId is null when not provided');

    if (data1.items.length > 0) {
        const item = data1.items[0];
        A.ok(typeof item.employeeId === 'string', 'employeeId field present');
        A.ok(typeof item.day === 'string', 'day field present');
        A.ok(typeof item.booked_min === 'number', 'booked_min field present');
        A.ok(typeof item.capacity_min === 'number', 'capacity_min field present');
        A.ok(typeof item.occupancy_pct === 'string' || typeof item.occupancy_pct === 'number', 'occupancy_pct field present');
    }

    // Teste com filtro de funcionário (se fornecido)
    if (EMPLOYEE_ID) {
        const response2 = await fetch(`${API_BASE}/reporting/occupancy/employee?from=${from}&to=${to}&employeeId=${EMPLOYEE_ID}`, {
            method: 'GET',
            headers: {
                'X-Tenant-Id': TENANT_ID
            }
        });

        A.equal(response2.status, 200, 'occupancy employee filtered 200');

        const data2 = await response2.json();
        A.equal(data2.employeeId, EMPLOYEE_ID, 'employeeId matches filter');
    }

    console.log(`✅ occupancy employee: ${data1.items.length} records`);
    return 'occupancy employee ok';
}
