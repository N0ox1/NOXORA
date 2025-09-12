import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

export default async function testSummary() {
    A.ok(TENANT_ID, 'TENANT_ID env var required');

    const day = '2025-09-06';

    const response = await fetch(`${API_BASE}/reporting/summary?day=${day}`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'summary 200');

    const data = await response.json();
    A.ok(typeof data.day === 'string', 'day field present');
    A.ok(typeof data.appts_total === 'number', 'appts_total field present');
    A.ok(typeof data.appts_cancelados === 'number', 'appts_cancelados field present');
    A.ok(typeof data.cancel_rate_pct === 'string' || typeof data.cancel_rate_pct === 'number', 'cancel_rate_pct field present');
    A.ok(typeof data.avg_occupancy_pct === 'string' || typeof data.avg_occupancy_pct === 'number', 'avg_occupancy_pct field present');

    console.log(`✅ summary: ${data.appts_total} total, ${data.appts_cancelados} cancelled, ${data.cancel_rate_pct}% rate, ${data.avg_occupancy_pct}% occupancy`);
    return 'summary ok';
}
