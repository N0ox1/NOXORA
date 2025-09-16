import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

export default async function testRefresh() {
    A.ok(TENANT_ID, 'TENANT_ID env var required');

    const response = await fetch(`${API_BASE}/reporting/refresh`, {
        method: 'POST',
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'Content-Type': 'application/json'
        }
    });

    A.equal(response.status, 200, 'refresh 200');

    const data = await response.json();
    A.equal(data.success, true, 'success field true');
    A.ok(typeof data.message === 'string', 'message field present');
    A.ok(typeof data.timestamp === 'string', 'timestamp field present');

    console.log(`✅ refresh: ${data.message}`);
    return 'refresh ok';
}




