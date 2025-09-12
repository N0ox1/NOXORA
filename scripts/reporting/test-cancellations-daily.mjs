import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

export default async function testCancellationsDaily() {
    A.ok(TENANT_ID, 'TENANT_ID env var required');

    const from = '2025-09-01';
    const to = '2025-09-30';

    const response = await fetch(`${API_BASE}/reporting/cancellations/daily?from=${from}&to=${to}`, {
        method: 'GET',
        headers: {
            'X-Tenant-Id': TENANT_ID
        }
    });

    A.equal(response.status, 200, 'cancellations daily 200');

    const data = await response.json();
    A.ok(Array.isArray(data.items), 'items is array');
    A.ok(typeof data.from === 'string', 'from field present');
    A.ok(typeof data.to === 'string', 'to field present');
    A.ok(typeof data.total === 'number', 'total field present');

    if (data.items.length > 0) {
        const item = data.items[0];
        A.ok(typeof item.day === 'string', 'day field present');
        A.ok(typeof item.appts_cancelados === 'number', 'appts_cancelados field present');
        A.ok(typeof item.cancel_rate_pct === 'string' || typeof item.cancel_rate_pct === 'number', 'cancel_rate_pct field present');
    }

    console.log(`✅ cancellations daily: ${data.items.length} days`);
    return 'cancellations daily ok';
}
