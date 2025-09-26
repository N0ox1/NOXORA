import { strict as A } from 'assert';
const base = 'http://localhost:3000/api/v1/public';
const TENANT = process.env.TENANT_ID;
const EMP = process.env.EMPLOYEE_ID;
function tomorrowISO() { const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
export default async function testAvailability() {
    A.ok(TENANT && EMP, 'env TENANT_ID/EMPLOYEE_ID');
    const date = tomorrowISO();
    const r = await fetch(`${base}/availability?tenantId=${TENANT}&employeeId=${EMP}&date=${date}&slot=30`);
    A.equal(r.status, 200, 'availability 200');
    const j = await r.json();
    A.ok(Array.isArray(j.slots), 'slots array');
    return 'availability ok';
}



















